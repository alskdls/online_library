import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BookCard from './BookCard';

const BookList = ({ selectedGenre, searchQuery, extraFilters }) => {
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlGenreId = queryParams.get('genre');

  useEffect(() => {
    fetch('http://localhost:5000/books')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error(err));

    if (user) {
      fetch(`http://localhost:5000/favorites/${user.id}`)
        .then(res => res.json())
        .then(data => setFavorites(data))
        .catch(err => console.error(err));
    }
  }, [user?.id]);

  const filteredBooks = books.filter(book => {
    // 1. Поиск по названию или автору
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const activeGenreId = urlGenreId ? parseInt(urlGenreId) : selectedGenre;

    // Если дополнительные фильтры не применили, фильтруем только по поиску и базовому жанру
    if (!extraFilters) {
      const matchesGenre = activeGenreId ? book.genre_id === activeGenreId : true;
      return matchesSearch && matchesGenre;
    }

    const { selectedGenres = [], selectedAuthors = [], selectedYears = {}, pageFilter = '' } = extraFilters;

    // 2. Фильтр по жанрам
    const matchesGenre = selectedGenres.length > 0 
      ? selectedGenres.includes(book.genre_id)
      : (activeGenreId ? book.genre_id === activeGenreId : true);

    // 3. Фильтр по авторам
    const matchesAuthor = selectedAuthors.length === 0 || selectedAuthors.includes(book.author);
    
    // 4. Фильтр по годам (ставим дефолтный 2026 год, если у книги нет года)
    const matchesYear = (book.year || 2026) >= (parseInt(selectedYears.from) || 0) && 
                        (book.year || 2026) <= (parseInt(selectedYears.to) || 3000);
    
    // 5. Фильтр по страницам
    let matchesPages = true;
    if (pageFilter === 'short') matchesPages = book.pages <= 200;
    else if (pageFilter === 'medium') matchesPages = book.pages > 200 && book.pages <= 500;
    else if (pageFilter === 'long') matchesPages = book.pages > 500;

    return matchesSearch && matchesGenre && matchesAuthor && matchesYear && matchesPages;
  });

  return (
    <div style={mainWrapperStyle}>
      {filteredBooks.length > 0 ? (
        <div className="books-grid" style={gridContainerStyle}>
          {filteredBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              isFavoriteInitial={favorites.includes(book.id)} 
            />
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔍</div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Книг не знайдено</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            На жаль, за вашим запитом нічого не знайдено. Спробуйте змінити параметри фільтрів або перевірте правильність написання.
          </p>
          <button 
            onClick={() => window.location.replace('/')} 
            style={resetAllBtnStyle}
          >
            Скинути всі фільтри
          </button>
        </div>
      )}
    </div>
  );
};

const mainWrapperStyle = {
  padding: '40px 20px',
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '80vh',
  backgroundColor: 'transparent' 
};

const gridContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '30px',
  justifyContent: 'center',
  maxWidth: '1400px',
  margin: '0 auto',
  transition: 'all 0.5s ease-in-out'
};

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  marginTop: '100px',
  width: '100%',
  color: 'var(--text-main)'
};

const resetAllBtnStyle = {
  backgroundColor: 'var(--accent)', 
  color: 'white',
  border: 'none',
  padding: '12px 25px',
  borderRadius: '25px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  transition: 'all 0.3s ease',
  shadowColor: '0 4px 10px rgba(0, 0, 0, 0.2)'
};

export default BookList;