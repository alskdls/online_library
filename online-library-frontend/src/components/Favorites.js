import React, { useState, useEffect } from 'react';
import BookCard from './BookCard';

const Favorites = () => {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

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
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div style={pageWrapper}>
        <div style={containerStyle}>
          <div style={{ color: 'var(--text-main)', textAlign: 'center', padding: '50px' }}>
            Будь ласка, увійдіть в аккаунт, щоб переглянути обране.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={pageWrapper}>
        <div style={containerStyle}>
          <div style={{ color: 'var(--text-main)', textAlign: 'center', padding: '50px' }}>
            Завантаження...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <div style={containerStyle}>
        
        {/* Блок заголовка – точна копія з Home.js */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={genreTitleStyle}>
            Моє Обране
          </h2>
          <div style={underlineStyle}></div>
        </div>

        <div style={booksGridStyle}>
          {favoriteBooks.length > 0 ? (
            favoriteBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                isFavoriteInitial={true} 
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', width: '100%', opacity: 0.6 }}>
              У вас поки немає збережених книг.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- СТИЛІ (КОПІЯ З HOME.JS) ---

const pageWrapper = {
  backgroundColor: 'var(--bg-color)',
  minHeight: '100vh',
  padding: '40px 20px',
  color: 'var(--text-main)'
};

const containerStyle = {
  maxWidth: '1400px', // Як на головній
  margin: '0 auto'
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

const booksGridStyle = { 
  display: 'flex', 
  flexWrap: 'wrap', 
  gap: '30px', 
  justifyContent: 'center' 
};

export default Favorites;