import './App.css';
import React, { useState, useEffect } from 'react'; // Додано useEffect
import { Routes, Route } from 'react-router-dom';
import io from 'socket.io-client'; // Додано імпорт сокетів
import { API_URL } from './config';

import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import BookList from './components/BookList';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AddBook from './components/AddBook';
import Favorites from './components/Favorites';
import Cart from './components/Cart';
import EditBook from './components/EditBook';
import BookDetail from './components/BookDetail';
import Profile from './components/Profile';

// Ініціалізуємо сокет за межами компонента, щоб він не створювався заново при рендері
const socket = io('https://library-backend-0q6b.onrender.com');

function App() {
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [extraFilters, setExtraFilters] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Перевіряємо, чи залогінений користувач
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Кажемо серверу, що ми онлайн
      socket.emit('user_online', user.id);
    }

    // Очищення при закритті додатка (необов'язково, але корисно)
    return () => {
      socket.off('status_changed');
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-theme' : ''}`} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)'
    }}>
      <Header onSearch={setSearchTerm} onApplyFilters={setExtraFilters} socket={socket} />
      
      <div className="main-layout" style={{ 
        display: 'flex', 
        flex: 1,
        alignItems: 'stretch',
        gap: '0' 
      }}>
        <Sidebar 
          onSelectGenre={setSelectedGenreId} 
          onApplyFilters={setExtraFilters} 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
        />
        
        <main className="content-area" style={{ 
          flex: 1, 
          padding: '20px 20px 0 20px', 
          backgroundColor: 'var(--bg-color)'
        }}>
          <Routes>
            <Route path="/" element={
              <Home searchQuery={searchTerm} extraFilters={extraFilters} />
            } />
            <Route path="/search" element={
              <BookList 
                selectedGenre={selectedGenreId} 
                searchQuery={searchTerm} 
                extraFilters={extraFilters} 
              />
            } />
            {/* Передаємо сокет в Login, щоб відправити статус при вході */}
            <Route path="/login" element={<Login socket={socket} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/add-book" element={<AddBook />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/edit-book/:id" element={<EditBook />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/profile" element={<Profile socket={socket} />} />
            <Route path="/profile/:id" element={<Profile socket={socket} />} />
          </Routes>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export default App;