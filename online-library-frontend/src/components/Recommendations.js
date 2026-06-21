import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookCard from './BookCard';

const Recommendations = () => {
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // 1. Загружаем рекомендации
    const fetchRecommendations = async () => {
      try {
        const url = user && user.id 
          ? `http://localhost:5000/api/books/recommended/${user.id}`
          : 'http://localhost:5000/api/books/recommended/guest';
        
        const res = await axios.get(url);
        setRecommendedBooks(res.data);
      } catch (err) {
        console.error("Ошибка загрузки рекомендаций:", err);
      } finally {
        setLoading(false);
      }
    };

    // 2. Загружаем избранное для лайков
    const fetchFavorites = async () => {
      if (user && user.id) {
        try {
          const res = await fetch(`http://localhost:5000/favorites/${user.id}`);
          const data = await res.json();
          setFavorites(data);
        } catch (err) {
          console.error("Помилка завантаження обраного:", err);
        }
      }
    };

    fetchRecommendations();
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-main)' }}>
        <h3>Завантаження рекомендацій...</h3>
      </div>
    );
  }

  // Ограничиваем массив до 10 книг, чтобы они выстроились 5х5 в два ряда
  const topTenRecommendations = recommendedBooks.slice(0, 10);

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
      
      {/* Секция один в один как блоки жанров на главной, без светлой плашки */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={genreTitleStyle}>
            Рекомендації для вас
          </h2>
          <div style={underlineStyle}></div>
        </div>

        {topTenRecommendations.length > 0 ? (
          /* Сетка карточек на основном фоне страницы */
          <div className="recommendations-page-grid" style={gridContainerStyle}>
            {topTenRecommendations.map(book => (
              <div key={`rec-page-${book.id}`} style={cardItemStyle}>
                <div style={{ pointerEvents: 'auto' }}>
                  <BookCard 
                    book={book} 
                    isFavoriteInitial={favorites.includes(book.id)} 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-main)', padding: '20px 0' }}>
            <p style={{ opacity: 0.7 }}>Наразі немає відповідних рекомендацій для відображення.</p>
          </div>
        )}
      </section>

      {/* Стили жесткой сетки 5х5 с адаптивным перестроением на мобилках */}
      <style>{`
        .recommendations-page-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr); /* Строго 5 колонок на десктопе */
          gap: 30px;
          justify-items: center;
        }

        /* Адаптив под планшеты */
        @media (max-width: 1200px) {
          .recommendations-page-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }
        @media (max-width: 950px) {
          .recommendations-page-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Адаптив под мобилки */
        @media (max-width: 650px) {
          .recommendations-page-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

// --- СТИЛИ (Полностью скопированы с главной страницы для блоков жанров) ---
const genreTitleStyle = { 
  fontSize: '28px', 
  color: 'var(--text-main)', 
  margin: '0 0 10px 0', 
  fontWeight: 'bold', 
  textTransform: 'uppercase', 
  letterSpacing: '1px' 
};

const underlineStyle = { 
  height: '4px', 
  width: '60px', 
  background: 'var(--accent)', 
  margin: '0 auto', 
  borderRadius: '2px' 
};

const gridContainerStyle = {
  paddingBottom: '15px'
};

const cardItemStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center'
};

export default Recommendations;