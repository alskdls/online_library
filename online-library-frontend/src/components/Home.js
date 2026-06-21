import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { Flame } from 'lucide-react'; 
import BookCard from './BookCard';

const Home = ({ searchQuery = '', extraFilters }) => {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [favorites, setFavorites] = useState([]); 
  const [recommendedBooks, setRecommendedBooks] = useState([]); 
  const [latestBooks, setLatestBooks] = useState([]); 
  
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
    })
    .catch(err => console.error("Помилка завантаження даних:", err));

    // 2. Завантажуємо рекомендации из умного эндпоинта на бэкенде
    const fetchRecommendations = async () => {
      try {
        const url = user && user.id 
          ? `http://localhost:5000/api/books/recommended/${user.id}`
          : 'http://localhost:5000/api/books/recommended/guest';
        
        const res = await axios.get(url);
        setRecommendedBooks(res.data);
      } catch (err) {
        console.error("Ошибка загрузки рекомендаций:", err);
      }
    };
    fetchRecommendations();

    // 3. Завантажуємо новинки (из нового эндпоинта по реальной дате создания)
    const fetchLatest = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/books/latest');
        setLatestBooks(res.data);
      } catch (err) {
        console.error("Ошибка загрузки новинок:", err);
      }
    };
    fetchLatest();

    // 4. Завантажуємо обране (якщо юзер авторизований)
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

  // Дублируем список новинок для создания бесшовной бегущей дорожки на мобилках
  const duplicatedLatestBooks = [...latestBooks, ...latestBooks];

  // ИСПРАВЛЕННАЯ ФИЛЬТРАЦИЯ КНИГ ДЛЯ ВЫВОДА ПО ЖАНРАМ
  const getFilteredBooks = () => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            book.author.toLowerCase().includes(searchQuery.toLowerCase());

      if (!extraFilters) return matchesSearch;

      const { selectedGenres = [], selectedAuthors = [], selectedYears = {}, pageFilter = '' } = extraFilters;

      const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(book.genre_id);
      const matchesAuthor = selectedAuthors.length === 0 || selectedAuthors.includes(book.author);
      const matchesYear = (book.year || 2026) >= (parseInt(selectedYears.from) || 0) && 
                          (book.year || 2026) <= (parseInt(selectedYears.to) || 3000);
      
      let matchesPages = true;
      if (pageFilter === 'short') matchesPages = book.pages <= 200;
      else if (pageFilter === 'medium') matchesPages = book.pages > 200 && book.pages <= 500;
      else if (pageFilter === 'long') matchesPages = book.pages > 500;

      return matchesSearch && matchesGenre && matchesAuthor && matchesYear && matchesPages;
    });
  };

  const filteredBooksList = getFilteredBooks();

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

          <div className="mobile-marquee-viewport">
            <div className="mobile-marquee-track">
              {duplicatedLatestBooks.map((book, index) => {
                const cover = (book.image_url && book.image_url !== "[null]" && book.image_url.trim() !== "") 
                  ? book.image_url 
                  : "https://kappa.lol/pAubra";

                return (
                  <div 
                    key={`news-${book.id}-${index}`} 
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
          </div>
        </section>
      )}

      {/* ================= 3. ВЫВОД КНИГ ПО ЖАНРАМ ================= */}
      {genres.map(genre => {
        // Фильтруем из уже обработанного getFilteredBooks списка книг
        const genreBooks = filteredBooksList
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

        /* СКРЫВАЕМ block Новинок на больших экранах */
        .mobile-news-section { display: none; }

        /* ПОКАЗЫВАЕМ только на маленьких устройствах (меньше 1100px) */
        @media (max-width: 1100px) {
          .mobile-news-section { display: block; }
          
          .mobile-marquee-viewport {
            overflow: hidden;
            width: 100%;
            position: relative;
            mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          }

          .mobile-marquee-track {
            display: flex;
            gap: 20px;
            width: max-content;
            padding: 10px 0;
            animation: mobileMarqueeHorizontal 25s linear infinite;
          }

          .mobile-marquee-viewport:hover .mobile-marquee-track,
          .mobile-marquee-viewport:active .mobile-marquee-track {
            animation-play-state: paused;
          }
        }

        .mobile-rs-item {
          display: flex;
          gap: 12px;
          padding: 8px;
          border-radius: 15px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid var(--accent); 
          box-shadow: 0 10px 40px var(--shadow-color);
          flex: 0 0 250px;
          align-items: center;
          transition: all 0.3s ease;
        }

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

        @keyframes mobileMarqueeHorizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
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