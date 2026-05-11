import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard from './BookCard';

const Home = ({ searchQuery, extraFilters }) => {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [favorites, setFavorites] = useState([]); 
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

    // 2. Завантажуємо обране (якщо юзер авторизований)
    if (user && user.id) {
      fetch(`http://localhost:5000/favorites/${user.id}`)
        .then(res => res.json())
        .then(data => {
          // Сервер тепер шле масив чисел [1, 7, 12], тому просто зберігаємо його
          setFavorites(data);
        })
        .catch(err => console.error("Помилка завантаження обраного:", err));
    }
  }, []); // Помилка була десь тут, тепер тут чистий масив залежностей

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
      {genres.map(genre => {
        const genreBooks = books
          .filter(book => book.genre_id === genre.id)
          .slice(0, 5);

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

            <div style={booksGridStyle}>
              {genreBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  // Перевіряємо, чи є ID книги в масиві обраного
                  isFavoriteInitial={favorites.includes(book.id)} 
                />
              ))}
            </div>
          </section>
        );
      })}
      
      <style>{`
        .genre-title-link { cursor: pointer; display: inline-block; transition: transform 0.3s ease, color 0.3s ease; color: var(--text-main); }
        .genre-title-link:hover { color: var(--accent); transform: scale(1.05); }
      `}</style>
    </div>
  );
};

// Стилі
const genreTitleStyle = { fontSize: '28px', color: 'var(--text-main)', margin: '0 0 10px 0', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' };
const underlineStyle = { height: '4px', width: '60px', background: 'var(--accent)', margin: '0 auto', borderRadius: '2px' };
const booksGridStyle = { display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' };

export default Home;