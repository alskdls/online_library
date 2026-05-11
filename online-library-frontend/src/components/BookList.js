import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Додали хук для читання URL
import BookCard from './BookCard';

const BookList = ({ selectedGenre, searchQuery, extraFilters }) => {
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  // Читаємо параметри з URL (наприклад, ?genre=3)
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
    // 1. Пошук за назвою або автором
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Визначаємо поточний жанр (пріоритет у того, що в URL, потім те, що в Sidebar)
    const activeGenreId = urlGenreId ? parseInt(urlGenreId) : selectedGenre;

    // 2. Якщо немає додаткових фільтрів (простий пошук/жанр)
    if (!extraFilters) {
      const matchesGenre = activeGenreId ? book.genre_id === activeGenreId : true;
      return matchesSearch && matchesGenre;
    }

    // 3. Якщо увімкнені розширені фільтри
    const { selectedGenres, selectedAuthors, priceRange, selectedYears, pageFilter, onlyWithImages } = extraFilters;

    // Жанр у фільтрах може бути масивом або одиничним вибором
    const matchesGenre = selectedGenres.length > 0 
      ? selectedGenres.includes(book.genre_id)
      : (activeGenreId ? book.genre_id === activeGenreId : true);

    const matchesAuthor = selectedAuthors.length === 0 || selectedAuthors.includes(book.author);
    const matchesPrice = book.price >= (parseFloat(priceRange.min) || 0) && book.price <= (parseFloat(priceRange.max) || Infinity);
    const matchesYear = (book.year || 2024) >= (parseInt(selectedYears.from) || 0) && (book.year || 2024) <= (parseInt(selectedYears.to) || 3000);
    
    let matchesPages = true;
    if (pageFilter === 'short') matchesPages = book.pages <= 200;
    else if (pageFilter === 'medium') matchesPages = book.pages > 200 && book.pages <= 500;
    else if (pageFilter === 'long') matchesPages = book.pages > 500;

    const matchesImage = onlyWithImages ? (book.image_url && book.image_url.trim() !== "") : true;

    return matchesSearch && matchesGenre && matchesAuthor && matchesPrice && matchesYear && matchesPages && matchesImage;
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
          <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Книг не знайдено</h2>
          <p style={{ color: '#7f8c8d', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            На жаль, за вашим запитом нічого не знайдено. Спробуйте змінити параметри фільтрів або перевірте правильність написання.
          </p>
          <button 
            onClick={() => window.location.replace('/')} // Повертаємо на головну
            style={resetAllBtnStyle}
          >
            Скинути всі фільтри
          </button>
        </div>
      )}
    </div>
  );
};

// --- СТИЛІ (БЕЗ ЗМІН) ---

const mainWrapperStyle = {
  padding: '40px 20px',
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '80vh'
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
  width: '100%'
};

const resetAllBtnStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  padding: '12px 25px',
  borderRadius: '25px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)'
};

export default BookList;