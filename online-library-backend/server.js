const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const http = require('http'); 
const { Server } = require('socket.io'); 
const app = express();
const pool = require('./db'); 
const bcrypt = require('bcryptjs');
const PORT = 5000;

// --- НАЛАШТУВАННЯ СЕРВЕРА ТА SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Робимо папку uploads публічною
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- НАЛАШТУВАННЯ MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// --- ЛОГІКА SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('Нове підключення:', socket.id);

  socket.on('user_online', async (userId) => {
    if (!userId) return;
    socket.userId = userId;
    socket.join(`user_${userId}`); 
    try {
      await pool.query('UPDATE users SET is_online = true WHERE id = $1', [userId]);
      io.emit('status_changed', { userId, status: true });
    } catch (err) {
      console.error('Помилка БД (online):', err.message);
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      const userId = socket.userId;
      setTimeout(async () => {
        const activeSockets = await io.in(`user_${userId}`).fetchSockets();
        if (activeSockets.length === 0) {
          try {
            await pool.query('UPDATE users SET is_online = false WHERE id = $1', [userId]);
            io.emit('status_changed', { userId, status: false });
          } catch (err) {
            console.error('Помилка БД (offline):', err.message);
          }
        }
      }, 3000);
    }
  });
});

// Эндпоинт для получения книг, которые юзер лайкнул или дизлайкнул
app.get('/users/:id/reactions', async (req, res) => {
    const userId = req.params.id;
    const { type } = req.query; // Ожидаем 'like' или 'dislike'

    try {
        // Джоиним (соединяем) реакции с книгами, чтобы получить названия и обложки
        const result = await pool.query(
            `SELECT b.id, b.title, b.author, b.image_url 
             FROM books b
             JOIN book_reactions br ON b.id = br.book_id
             WHERE br.user_id = $1 AND br.type = $2`, 
            [userId, type]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Ошибка при получении списка реакций:", err.message);
        res.status(500).send("Ошибка сервера");
    }
});

// Эндпоинт для редактирования книги
app.put('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, description, pages, genre_id, image_url, price, year } = req.body;
  
  try {
    const updatedBook = await pool.query(
      `UPDATE books 
       SET title = $1, author = $2, description = $3, pages = $4, genre_id = $5, image_url = $6, price = $7, year = $8
       WHERE id = $9 RETURNING *`,
      [title, author, description, pages, genre_id, image_url, price, year, id]
    );

    if (updatedBook.rows.length === 0) {
      return res.status(404).send("Книга не знайдена");
    }

    res.json(updatedBook.rows[0]);
  } catch (err) {
    console.error("Помилка оновлення:", err.message);
    res.status(500).send("Помилка сервера");
  }
});

// --- КОРИСТУВАЧІ ТА ПРОФІЛІ ---

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.is_online, u.avatar_url,
        (SELECT COUNT(*) FROM user_books WHERE user_id = u.id AND status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM book_reactions WHERE user_id = u.id AND type = 'like') as total_likes,
        (SELECT COUNT(*) FROM book_reactions WHERE user_id = u.id AND type = 'dislike') as total_dislikes,
        (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as reviews_count
        FROM users u WHERE u.id = $1`, 
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json('Користувача не знайдено');
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error('Помилка отримання юзера:', err.message);
    res.status(500).send('Помилка сервера');
  }
});

// 1. Обновление настроек
app.put('/users/:id/settings', async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, avatar_url, role',
            [username, email, id]
        );
        res.json({ message: "Дані оновлено", user: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Помилка при оновленні профілю");
    }
});

// 2. Смена пароля
app.put('/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
        const validPassword = await bcrypt.compare(oldPassword, user.rows[0].password);
        if (!validPassword) return res.status(401).json("Старий пароль невірний");

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);
        res.json("Пароль змінено");
    } catch (err) {
        res.status(500).send("Помилка при зміні пароля");
    }
});

// 3. Список отзывов для профиля
app.get('/users/:id/reviews-list', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query(
            `SELECT r.id, r.comment as review_text, r.created_at, b.id as book_id, b.title, b.author, b.image_url 
             FROM reviews r
             JOIN books b ON r.book_id = b.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`, 
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Ошибка отзывов:", err.message);
        res.status(500).send("Ошибка сервера");
    }
});

app.post('/users/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json("Файл не обрано");

    const avatarPath = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url',
      [avatarPath, id]
    );
    res.json({ avatar_url: result.rows[0].avatar_url });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Помилка при завантаженні аватара");
  }
});

// --- КНИГИ ---
app.get('/books', async (req, res) => {
  try {
    const allBooks = await pool.query(`
      SELECT books.*, genres.name AS genre_name 
      FROM books 
      LEFT JOIN genres ON books.genre_id = genres.id
      ORDER BY books.id DESC
    `);
    res.json(allBooks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка сервера');
  }
});

app.post('/books', upload.single('bookFile'), async (req, res) => {
  try {
    const { title, author, description, pages, genre_id, image_url, price, year } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.content;

    const newBook = await pool.query(
      `INSERT INTO books (title, author, description, content, pages, genre_id, image_url, price, year) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, author, description, fileUrl, pages || 0, genre_id, image_url, price || 0, year || null]
    );
    res.json(newBook.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Помилка при додаванні книги");
  }
});

app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.json('Книга видалена');
  } catch (err) { 
    console.error(err.message);
    res.status(500).send("Ошибка удаления");
  }
});

// --- АВТОРІЗАЦІЯ ---
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, 'user']
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка при реєстрації');
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(401).json('Невірний email або пароль');
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(401).json('Невірний email або пароль');
    res.json({ 
      message: 'Ви успішно увійшли!', 
      user: { id: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role, avatar_url: user.rows[0].avatar_url } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка сервера');
  }
});

// --- ЖАНРИ ---
app.get('/genres', async (req, res) => {
  try {
    const allGenres = await pool.query('SELECT * FROM genres ORDER BY id ASC');
    res.json(allGenres.rows);
  } catch (err) { console.error(err.message); }
});

// --- РЕЙТИНГИ ТА ВІДГУКИ ---
app.get('/books/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, u.username,
      (SELECT COUNT(*) FROM comment_likes WHERE comment_id = r.id AND reaction_type = 'like') as likes_count,
      (SELECT COUNT(*) FROM comment_likes WHERE comment_id = r.id AND reaction_type = 'dislike') as dislikes_count
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.book_id = $1
      ORDER BY r.created_at ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Помилка при отриманні відгуків");
  }
});

app.get('/books/:id/rating', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(rating) as total_votes 
            FROM reviews WHERE book_id = $1 AND rating > 0
        `, [id]);
        res.json({
            average_rating: parseFloat(result.rows[0].average_rating).toFixed(1),
            total_votes: parseInt(result.rows[0].total_votes)
        });
    } catch (err) {
        res.status(500).send("Ошибка рейтинга");
    }
});

app.post('/reviews', async (req, res) => {
  const { userId, bookId, rating, comment, parent_id } = req.body;
  try {
    // Если это простая оценка (нет parent_id), используем логику обновления
    if (!parent_id && rating) {
      const result = await pool.query(`
        INSERT INTO reviews (user_id, book_id, rating, comment, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, book_id) WHERE parent_id IS NULL
        DO UPDATE SET 
          rating = EXCLUDED.rating,
          comment = COALESCE(EXCLUDED.comment, reviews.comment),
          created_at = NOW()
        RETURNING *;
      `, [userId, bookId, rating, comment || null]);
      return res.json(result.rows[0]);
    }

    // Если это нажатие кнопок статуса или ответ на комментарий (есть parent_id)
    // оставляем твою оригинальную логику без изменений
    const result = await pool.query(`
      INSERT INTO reviews (user_id, book_id, rating, comment, parent_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *;
    `, [userId, bookId, rating || null, comment || null, parent_id || null]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Ошибка сервера");
  }
});

// --- РЕАКЦІЇ ТА ОБРАНЕ ---
app.post('/comments/:id/reaction', async (req, res) => {
  const { userId, type } = req.body; 
  const commentId = req.params.id;
  try {
    const existingReaction = await pool.query(
      'SELECT reaction_type FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]
    );
    if (existingReaction.rows.length > 0) {
      if (existingReaction.rows[0].reaction_type === type) {
        await pool.query('DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
        return res.json("Реакцію прибрано");
      } else {
        await pool.query('UPDATE comment_likes SET reaction_type = $1 WHERE user_id = $2 AND comment_id = $3', [type, userId, commentId]);
        return res.json("Реакцію змінено");
      }
    }
    await pool.query('INSERT INTO comment_likes (user_id, comment_id, reaction_type) VALUES ($1, $2, $3)', [userId, commentId, type]);
    res.json("Реакцію поставлено");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Помилка");
  }
});

app.get('/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT book_id FROM favorites WHERE user_id = $1', [userId]);
    res.json(result.rows.map(row => row.book_id)); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Помилка сервера");
  }
});

app.post('/favorites', async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    await pool.query('INSERT INTO favorites (user_id, book_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, bookId]);
    res.json("Додано");
  } catch (err) { 
    console.error(err.message); 
    res.status(500).send("Помилка");
  }
});

app.delete('/favorites', async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND book_id = $2', [userId, bookId]);
    res.json("Видалено");
  } catch (err) { 
    console.error(err.message); 
    res.status(500).send("Помилка");
  }
});

app.get('/favorites-details/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT books.*, genres.name AS genre_name 
      FROM books 
      JOIN favorites ON books.id = favorites.book_id 
      LEFT JOIN genres ON books.genre_id = genres.id
      WHERE favorites.user_id = $1
      ORDER BY favorites.id DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Помилка");
  }
});

// --- СТАТУСИ ЧИТАННЯ ---

app.get('/users/:userId/book-counts', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT status, COUNT(*) FROM user_books WHERE user_id = $1 GROUP BY status`,
            [userId]
        );
        
        // Превращаем массив строк в удобный объект { reading: 5, completed: 10, ... }
        const counts = result.rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, {});

        res.json(counts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Ошибка получения статистики");
    }
});

app.post('/users/books/update-status', async (req, res) => {
    const { userId, bookId, status } = req.body;
    try {
        await pool.query(
            `INSERT INTO user_books (user_id, book_id, status) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id, book_id) 
             DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
            [userId, bookId, status]
        );
        res.send("Статус оновлено");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Помилка сервера");
    }
});

app.get('/users/:userId/books', async (req, res) => {
    const { userId } = req.params;
    const { status } = req.query;
    try {
        const result = await pool.query(
            `SELECT b.* FROM books b 
             JOIN user_books ub ON b.id = ub.book_id 
             WHERE ub.user_id = $1 AND ub.status = $2
             ORDER BY ub.updated_at DESC`,
            [userId, status]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Помилка сервера при отриманні списку книг");
    }
});

app.get('/user-books/:userId/:bookId', async (req, res) => {
    const { userId, bookId } = req.params;
    try {
        const result = await pool.query(
            "SELECT status FROM user_books WHERE user_id = $1 AND book_id = $2",
            [userId, bookId]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).send("Помилка сервера");
    }
});

// --- КОШИК ---
app.post('/cart', async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    await pool.query('INSERT INTO cart (user_id, book_id, quantity) VALUES ($1, $2, 1) ON CONFLICT (user_id, book_id) DO UPDATE SET quantity = cart.quantity + 1', [userId, bookId]);
    res.json("Додано в кошик");
  } catch (err) { console.error(err.message); }
});

// --- НОВІ ЕНДПОЇНТИ ДЛЯ ЛАЙКІВ КНИГИ ---

app.get('/books/:id/reactions', async (req, res) => {
    const { id } = req.params;
    try {
        const likes = await pool.query('SELECT count(*) FROM book_reactions WHERE book_id = $1 AND type = $2', [id, 'like']);
        const dislikes = await pool.query('SELECT count(*) FROM book_reactions WHERE book_id = $1 AND type = $2', [id, 'dislike']);
        res.json({ 
            likes: parseInt(likes.rows[0].count), 
            dislikes: parseInt(dislikes.rows[0].count) 
        });
    } catch (err) { 
        console.error(err);
        res.status(500).json(err); 
    }
});

app.post('/books/:id/reaction', async (req, res) => {
    const { id } = req.params;
    const { userId, type } = req.body;
    try {
        const existing = await pool.query("SELECT * FROM book_reactions WHERE book_id = $1 AND user_id = $2", [id, userId]);
        
        if (existing.rows.length > 0) {
            if (existing.rows[0].type === type) {
                await pool.query("DELETE FROM book_reactions WHERE book_id = $1 AND user_id = $2", [id, userId]);
            } else {
                await pool.query("UPDATE book_reactions SET type = $1 WHERE book_id = $2 AND user_id = $3", [type, id, userId]);
            }
        } else {
            await pool.query("INSERT INTO book_reactions (book_id, user_id, type) VALUES ($1, $2, $3)", [id, userId, type]);
        }
        res.json({ success: true });
    } catch (err) { 
        console.error(err);
        res.status(500).json(err); 
    }
});

// Эндпоинт для получения списка всех отзывов пользователя с данными о книгах
app.get('/users/:id/reviews-list', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query(
            `SELECT r.id, r.comment as review_text, r.created_at, b.id as book_id, b.title, b.author, b.image_url 
             FROM reviews r
             JOIN books b ON r.book_id = b.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`, 
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Ошибка при получении списка отзывов пользователя:", err.message);
        res.status(500).send("Ошибка сервера");
    }
});

// =========================================================================
//            НОВЫЕ ЭНДПОИНТЫ ДЛЯ ЖИВЫХ НОВИНОК И УМНЫХ РЕКОМЕНДАЦИЙ
// =========================================================================

// 1. Получение реальных новинок по дате создания (created_at)
app.get('/api/books/latest', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT books.*, genres.name AS genre_name 
      FROM books 
      LEFT JOIN genres ON books.genre_id = genres.id
      ORDER BY books.created_at DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении новинок:", err.message);
    res.status(500).send("Ошибка сервера");
  }
});

// 2. Рекомендации для ГОСТЕЙ (топ книг по количеству лайков) - ИЗМЕНИЛИ LIMIT НА 10
app.get('/api/books/recommended/guest', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, genres.name AS genre_name, COUNT(br.id) as likes_count
      FROM books b
      LEFT JOIN genres ON b.genre_id = genres.id
      LEFT JOIN book_reactions br ON b.id = br.book_id AND br.type = 'like'
      GROUP BY b.id, genres.name
      ORDER BY likes_count DESC, b.id DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка рекомендаций для гостей:", err.message);
    res.status(500).send("Ошибка сервера");
  }
});

// 3. ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ для авторизованных пользователей - ИЗМЕНИЛИ LIMIT НА 10
app.get('/api/books/recommended/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Вытягиваем ID жанров, которые пользователь лайкнул или добавил в избранное
    const userGenresResult = await pool.query(`
      SELECT DISTINCT b.genre_id 
      FROM books b
      LEFT JOIN book_reactions br ON b.id = br.book_id
      LEFT JOIN favorites f ON b.id = f.book_id
      WHERE (br.user_id = $1 AND br.type = 'like') OR f.user_id = $1
    `, [userId]);

    const genreIds = userGenresResult.rows.map(row => row.genre_id).filter(id => id !== null);

    // Если у пользователя еще нет предпочтений (новый аккаунт), отдаем популярное (LIMIT 10)
    if (genreIds.length === 0) {
      const fallbackResult = await pool.query(`
        SELECT b.*, genres.name AS genre_name 
        =FROM books b
        LEFT JOIN genres ON b.genre_id = genres.id
        ORDER BY b.id DESC LIMIT 10
      `);
      return res.json(fallbackResult.rows);
    }

    // Ищем книги из любимых жанров, которые юзер еще НЕ читал/НЕ добавил в списки (LIMIT 10)
    const recommendedResult = await pool.query(`
      SELECT b.*, genres.name AS genre_name
      FROM books b
      LEFT JOIN genres ON b.genre_id = genres.id
      WHERE b.genre_id = ANY($1::int[])
        AND b.id NOT IN (
          SELECT book_id FROM user_books WHERE user_id = $2
        )
      ORDER BY RANDOM()
      LIMIT 10
    `, [genreIds, userId]);

    // Если в этих жанрах ничего нового нет, добираем просто свежие книги сайта (LIMIT 10)
    if (recommendedResult.rows.length === 0) {
      const simpleResult = await pool.query(`
        SELECT b.*, genres.name AS genre_name FROM books b 
        LEFT JOIN genres ON b.genre_id = genres.id
        WHERE b.id NOT IN (SELECT book_id FROM user_books WHERE user_id = $2)
        ORDER BY b.id DESC LIMIT 10
      `, [userId]);
      return res.json(simpleResult.rows);
    }

    res.json(recommendedResult.rows);
  } catch (err) {
    console.error("Ошибка при генерации персональных рекомендаций:", err.message);
    res.status(500).send("Ошибка сервера");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with WebSockets enabled`);
});