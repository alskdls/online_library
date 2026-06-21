import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard from './BookCard';

const Favorites = () => {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5000/favorites-details/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setFavoriteBooks(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div style={pageWrapper}>
        <div style={containerStyle}>
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔒</div>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Доступ обмежено</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px auto' }}>
              Будь ласка, увійдіть в аккаунт, щоб переглянути ваше обране.
            </p>
            <button 
              onClick={() => navigate('/')} 
              style={actionBtnStyle}
            >
              На головну
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={pageWrapper}>
        <div style={containerStyle}>
          <div style={{ color: 'var(--text-main)', textAlign: 'center', padding: '100px 0', fontSize: '18px', fontWeight: '500' }}>
            Завантаження...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <div style={containerStyle}>
        
        {/* ================= ЗАГОЛОВОК ================= */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={genreTitleStyle}>
            Моє Обране
          </h2>
          <div style={underlineStyle}></div>
        </div>

        {/* ================= СЕТКА КНИГ ИЛИ ПУСТОЕ СОСТОЯНИЕ ================= */}
        {favoriteBooks.length > 0 ? (
          <div className="books-grid" style={gridContainerStyle}>
            {favoriteBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                isFavoriteInitial={true} 
              />
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>❤️</div>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Тут поки порожньо</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px auto' }}>
              У вас поки немає збережених книг. Натисніть на серце біля будь-якої книги, щоб вона з'явилася на цій сторінці.
            </p>
            <button 
              onClick={() => navigate('/')} 
              style={actionBtnStyle}
            >
              Шукати книги
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- СТИЛИ (Полностью очищенные от паразитных рамок и контуров) ---
const pageWrapper = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '80vh',
  backgroundColor: 'transparent', // Убираем жесткий цвет, чтобы не было стыков и обводок по краям
  padding: '40px 20px',
  color: 'var(--text-main)'
};

const containerStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  border: 'none',        // Гарантируем отсутствие любых обводок
  outline: 'none',
  boxShadow: 'none'
};

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
  display: 'flex',
  flexWrap: 'wrap',
  gap: '30px',
  justifyContent: 'center',
  maxWidth: '1400px',
  margin: '0 auto',
  transition: 'all 0.5s ease-in-out',
  border: 'none'
};

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  marginTop: '60px',
  width: '100%',
  color: 'var(--text-main)',
  border: 'none'
};

const actionBtnStyle = {
  backgroundColor: 'var(--accent)', 
  color: 'white',
  border: 'none',
  padding: '12px 25px',
  borderRadius: '25px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
};

export default Favorites;