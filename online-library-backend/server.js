const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const http = require('http'); 
const { Server } = require('socket.io'); 
const app = express();
const pool = require('./db'); 
const bcrypt = require('bcryptjs');

// Render сам назначает порт через переменную среды, поэтому используем её
const PORT = process.env.PORT || 5000; 

// --- НАЛАШТУВАННЯ СЕРВЕРА ТА SOCKET.IO ---
const server = http.createServer(app);

// ТУТ ИЗМЕНЕНИЕ: Разрешаем сокетам принимать соединения от твоего фронтенда на Vercel
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://online-library-ou77tx9f0-asds-projects-b70223b8.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ТУТ ИЗМЕНЕНИЕ: Разрешаем обычным HTTP запросам (fetch) работать с Vercel
app.use(cors({
  origin: ["http://localhost:3000", "https://online-library-ou77tx9f0-asds-projects-b70223b8.vercel.app"],
  credentials: true
}));

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

// --- КОРИСТУВАЧІ ТА ПРОФІЛІ ---

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.is_online, u.avatar_url,
        (SELECT COUNT(*) FROM user_books WHERE user_id = u.id AND status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM comment_likes WHERE user_id = u.id AND reaction_type = 'like') as total_likes,
        (SELECT COUNT(*) FROM comment_likes WHERE user_id = u.id AND reaction_type = 'dislike') as total_dislikes,
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
  } catch (err) { console.error(err.message); }
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
    const result = await pool.query(`
      INSERT INTO reviews (user_id, book_id, rating, comment, parent_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
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

// ПІДТРИМКА ШЛЯХУ З ПРОФІЛЮ (Додано для сумісності з Profile.js)
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

// Отримати книги користувача за статусом
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

// Отримати статус конкретної книги для юзера
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

// Оригінальний маршрут (залишив для іншої логіки, якщо є)
app.post('/user-books', async (req, res) => {
    const { userId, bookId, status } = req.body;
    try {
        await pool.query(
            `INSERT INTO user_books (user_id, book_id, status) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id, book_id) 
             DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
            [userId, bookId, status]
        );
        res.send("Статус успішно оновлено");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Помилка сервера при збереженні статусу");
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});