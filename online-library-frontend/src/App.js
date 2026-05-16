import './App.css';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';

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
import Settings from './components/Settings'; 

const socket = io('http://localhost:5000');

function App() {
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [extraFilters, setExtraFilters] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      socket.emit('user_online', user.id);
    }

    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }

    return () => {
      socket.off('status_changed');
    };
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-theme' : ''}`} style={appStyle}>
      <Header 
        onSearch={setSearchTerm} 
        onApplyFilters={setExtraFilters} 
        socket={socket} 
        onMenuClick={() => setIsSidebarOpen(true)} 
      />
      
      <div className="main-layout" style={mainLayoutStyle}>
        <Sidebar 
          onSelectGenre={setSelectedGenreId} 
          onApplyFilters={setExtraFilters} 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <main className="content-area" style={contentAreaStyle}>
          <Routes>
            <Route path="/" element={<Home searchQuery={searchTerm} extraFilters={extraFilters} />} />
            <Route path="/search" element={
              <BookList 
                selectedGenre={selectedGenreId} 
                searchQuery={searchTerm} 
                extraFilters={extraFilters} 
              />
            } />
            <Route path="/login" element={<Login socket={socket} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/add-book" element={<AddBook />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/edit-book/:id" element={<EditBook />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/profile" element={<Profile socket={socket} />} />
            <Route path="/profile/:id" element={<Profile socket={socket} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      
      <Footer />

      <style>
        {`
          @media (max-width: 768px) {
            .main-layout {
              flex-direction: column;
            }
            .content-area {
              padding: 10px !important;
              margin-left: 0 !important;
            }
          }
        `}
      </style>
    </div>
  );
}

const appStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  minHeight: '100vh',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-main)'
};

const mainLayoutStyle = { 
  display: 'flex', 
  flex: 1,
  alignItems: 'stretch',
  gap: '0',
  position: 'relative'
};

const contentAreaStyle = { 
  flex: 1, 
  padding: '20px 20px 0 20px', 
  backgroundColor: 'var(--bg-color)',
  minWidth: 0 
};

export default App;