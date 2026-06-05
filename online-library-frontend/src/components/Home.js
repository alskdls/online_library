import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Добавил axios для новинок
import { Flame } from 'lucide-react'; // Иконка огонька
import BookCard from './BookCard';

const Home = ({ searchQuery, extraFilters }) => {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [favorites, setFavorites] = useState([]); 
  const [recommendedBooks, setRecommendedBooks] = useState([]); 
  const [latestBooks, setLatestBooks] = useState([]); // Состояние для новинок
  
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Завантажуємо книги та жанри
    Promise.all([
      fetch('http://localhost:5000/books').then(res => res.json()),
      fetch('http://localhost:5000/genres').then(res => res.json())
    ])
    .then(([booksData, genresData]) => {
      setBooks(booksData);
      setGenres(genresData);

      // Генерация рекомендаций (случайные 5 книг)
      if (booksData && booksData.length > 0) {
        const shuffled = [...booksData].sort(() => 0.5 - Math.random());
        setRecommendedBooks(shuffled.slice(0, 5));
      }
    })
    .catch(err => console.error("Помилка завантаження даних:", err));

    // 2. Завантажуємо новинки (твоя оригинальная логика)
    const fetchLatest = async () => {
      try {
        const res = await axios.get('http://localhost:5000/books');
        const sorted = res.data.sort((a, b) => b.id - a.id).slice(0, 10);
        setLatestBooks(sorted);
      } catch (err) {
        console.error("Ошибка загрузки новинок:", err);
      }
    };
    fetchLatest();

    // 3. Завантажуємо обране (якщо юзер авторизований)
    if (user && user.id) {
      fetch(`http://localhost:5000/favorites/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setFavorites(data);
        })
        .catch(err => console.error("Помилка завантаження обраного:", err));
    }
  }, []); 

  const handleGoToNew = () => navigate('/search?sort=new');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
      
      {/* ================= 1. БЛОК РЕКОМЕНДАЦИЙ ================= */}
      {user && recommendedBooks.length > 0 && (
        <section style={recommendationsWrapperStyle}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={recommendationsTitleStyle}>
              Рекомендації для вас
            </h2>
            <div style={underlineStyle}></div>
          </div>

          <div className="horizontal-scroll-container" style={scrollContainerStyle}>
            {recommendedBooks.map(book => (
              <div key={`rec-${book.id}`} style={scrollItemStyle}>
                <BookCard 
                  book={book} 
                  isFavoriteInitial={favorites.includes(book.id)} 
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= 2. БЛОК НОВИНКИ (ПОЯВЛЯЕТСЯ ТОЛЬКО НА МАЛЕНЬКИХ ЭКРАНАХ) ================= */}
      {latestBooks.length > 0 && (
        <section className="mobile-news-section" style={{ marginBottom: '60px' }}>
          <div onClick={handleGoToNew} style={{ textAlign: 'center', marginBottom: '25px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <Flame size={20} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 5px var(--accent))' }} />
              <h2 style={genreTitleStyle}>НОВИНКИ</h2>
            </div>
            <div style={underlineStyle}></div>
          </div>

          {/* Горизонтальная лента с твоим оригинальным стилем карточек */}
          <div className="horizontal-scroll-container" style={scrollContainerStyle}>
            {latestBooks.map(book => {
              const cover = (book.image_url && book.image_url !== "[null]" && book.image_url.trim() !== "") 
                ? book.image_url 
                : "https://kappa.lol/pAubra";

              return (
                <div 
                  key={`news-${book.id}`} 
                  className="mobile-rs-item"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <div className="mobile-rs-image-wrapper">
                    <img src={cover} alt={book.title} />
                  </div>
                  <div className="mobile-rs-info">
                    <div className="mobile-rs-item-title">{book.title}</div>
                    <div className="mobile-rs-item-author">{book.author}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= 3. ВЫВОД КНИГ ПО ЖАНРАМ ================= */}
      {genres.map(genre => {
        const genreBooks = books
          .filter(book => book.genre_id === genre.id)
          .slice(0, 8);

        if (genreBooks.length === 0) return null;

        return (
          <section key={genre.id} style={{ marginBottom: '60px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 
                className="genre-title-link"
                onClick={() => navigate(`/search?genre=${genre.id}`)}
                style={genreTitleStyle}
              >
                {genre.name}
              </h2>
              <div style={underlineStyle}></div>
            </div>

            <div className="horizontal-scroll-container" style={scrollContainerStyle}>
              {genreBooks.map(book => (
                <div key={book.id} style={scrollItemStyle}>
                  <div style={{pointerEvents: 'auto'}}>
                    <BookCard 
                      book={book} 
                      isFavoriteInitial={favorites.includes(book.id)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      
      {/* Стили для скролла и отображения блока Новинок */}
      <style>{`
        .genre-title-link { cursor: pointer; display: inline-block; transition: transform 0.3s ease, color 0.3s ease; color: var(--text-main); }
        .genre-title-link:hover { color: var(--accent); transform: scale(1.05); }

        /* СКРЫВАЕМ блок Новинок на больших экранах (ведь там горит твой старый RightSidebar) */
        .mobile-news-section { display: none; }

        /* ПОКАЗЫВАЕМ только на маленьких устройствах (меньше 1100px) */
        @media (max-width: 1100px) {
          .mobile-news-section { display: block; }
        }

        /* Точь-в-точь оригинальный стиль карточки новинок, адаптированный под горизонтальную ленту */
        .mobile-rs-item {
          display: flex;
          gap: 12px;
          padding: 8px;
          border-radius: 15px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid var(--accent); 
          box-shadow: 0 10px 40px var(--shadow-color);
          flex: 0 0 250px; /* Фиксированная ширина карточки в ленте */
          align-items: center;
          transition: all 0.3s ease;
        }

        /* Эффект ховера в точности как в оригинальном сайдбаре */
        .mobile-rs-item:hover {
          background: rgba(212, 163, 115, 0.15);
          transform: translateX(5px);
        }

        .mobile-rs-image-wrapper {
          width: 50px;
          height: 70px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .mobile-rs-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mobile-rs-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          text-align: left;
        }

        .mobile-rs-item-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-rs-item-author {
          font-size: 11px;
          opacity: 0.6;
          color: var(--text-main);
          margin-top: 2px;
        }

        /* Кастомизация ползунка */
        .horizontal-scroll-container::-webkit-scrollbar {
          height: 8px;
        }
        .horizontal-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .horizontal-scroll-container::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .horizontal-scroll-container::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }
      `}</style>
    </div>
  );
};

// --- СТИЛИ ---
const genreTitleStyle = { fontSize: '28px', color: 'var(--text-main)', margin: '0 0 10px 0', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' };
const underlineStyle = { height: '4px', width: '60px', background: 'var(--accent)', margin: '0 auto', borderRadius: '2px' };

const scrollContainerStyle = {
  display: 'flex',
  gap: '30px',
  overflowX: 'auto', 
  overflowY: 'hidden',
  whiteSpace: 'nowrap',
  paddingBottom: '15px', 
  WebkitOverflowScrolling: 'touch', 
  justifyContent: 'safe center'
};

const scrollItemStyle = {
  flex: '0 0 auto'
};

const recommendationsWrapperStyle = {
  backgroundColor: 'var(--card-bg)',
  padding: '40px 30px 25px 30px',
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
  border: '1px solid var(--border-color)',
  marginBottom: '60px',
  transition: 'all 0.3s ease'
};

const recommendationsTitleStyle = {
  ...genreTitleStyle,
  margin: '0 0 10px 0'
};

export default Home;