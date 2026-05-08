import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FiltersModal from './FiltersModal';
import { Book, LogOut, User } from 'lucide-react';

const Header = ({ onSearch, onApplyFilters, socket }) => { // Додано socket в пропси
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    setUser(savedUser);

    fetch('https://library-backend-0q6b.onrender.com/genres').then(res => res.json()).then(data => setGenres(data));
    fetch('https://library-backend-0q6b.onrender.com/books').then(res => res.json()).then(data => {
      const uniqueAuthors = [...new Set(data.map(b => b.author))].sort();
      setAuthors(uniqueAuthors);
    });
  }, []);

  // --- ОНОВЛЕНА ФУНКЦІЯ ВИХОДУ ---
  const handleLogout = () => {
    if (socket) {
      socket.disconnect(); // Примусово розриваємо з'єднання для статусу офлайн
    }
    localStorage.removeItem('user');
    setUser(null);
    alert("Ви вийшли з аккаунту");
    navigate('/');
    window.location.reload(); // Перезавантаження для повної очистки стану
  };

  return (
    <header style={headerStyle}>
      {/* ЛІВА ЧАСТИНА */}
      <div style={leftSectionStyle}>
        <div onClick={() => navigate('/')} style={logoWrapperStyle}>
          <Book size={24} color="var(--accent)" />
          <span style={logoTextStyle}>Бібліотека</span>
        </div>
        
        <nav style={navStyle}>
          <Link to="/" className="nav-link" style={linkStyle}>Головна</Link>
          <Link to="/favorites" className="nav-link" style={linkStyle}>Обране</Link>
          <Link to="/cart" className="nav-link" style={linkStyle}>Кошик</Link>
        </nav>
      </div>

      {/* ПРАВА ЧАСТИНА */}
      <div style={rightSectionStyle}>
        <div style={searchContainerStyle}>
          <input 
            type="text" 
            placeholder="Пошук книг..." 
            onChange={(e) => onSearch(e.target.value)} 
            style={inputStyle}
          />
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="filter-btn-header"
            style={filterBtnStyle}
          >
            Фільтри
          </button>
        </div>

        {!user ? (
          <div style={authNavStyle}>
            <Link to="/login" className="nav-link" style={linkStyle}>Увійти</Link>
            <Link to="/register" style={registerBtnStyle}>Реєстрація</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              className="user-profile-field"
              // ЗМІНЕНО: веде на конкретний ID для коректної роботи профілю
              onClick={() => navigate(`/profile/${user.id}`)} 
              style={userFieldStyle}
            >
              <User size={18} color="var(--accent)" />
              <span style={usernameStyle}>{user.username}</span>
            </div>

            <button 
              className="logout-field-icon" 
              onClick={handleLogout} 
              style={logoutIconStyle}
              title="Вийти"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      <FiltersModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        genres={genres}
        authors={authors}
        onApplyFilters={(filters) => {
          onApplyFilters(filters);
          setIsModalOpen(false);
        }} 
      />

      <style>{`
        .nav-link, .user-profile-field, .logout-field-icon, .filter-btn-header {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
        }

        .nav-link:hover, .user-profile-field:hover {
          background-color: #5d4037 !important; 
          color: #fff !important;
        }
        
        .user-profile-field:hover span {
          color: #fff !important;
        }

        .filter-btn-header:hover {
          background-color: #5d4037 !important; 
          color: #fff !important;
          border-color: var(--accent) !important;
        }

        .logout-field-icon:hover {
          background-color: #e74c3c !important; 
          border-color: #e74c3c !important;
          color: #fff !important;
        }
      `}</style>
    </header>
  );
};

// --- СТИЛІ (без змін) ---
const headerStyle = { background: '#2c1e1a', padding: '10px 30px', color: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1001, borderBottom: '1px solid rgba(255,255,255,0.05)' };
const leftSectionStyle = { display: 'flex', alignItems: 'center', gap: '25px' };
const logoWrapperStyle = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const logoTextStyle = { fontSize: '18px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' };
const navStyle = { display: 'flex', gap: '5px' };
const linkStyle = { color: '#d7ccc8', textDecoration: 'none', fontWeight: '600', fontSize: '14px', padding: '8px 15px', borderRadius: '20px', display: 'flex', alignItems: 'center' };
const rightSectionStyle = { display: 'flex', alignItems: 'center', gap: '15px' };
const searchContainerStyle = { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '25px', padding: '2px 5px', width: '280px', border: '1px solid rgba(255,255,255,0.15)' };
const inputStyle = { flex: 1, padding: '6px 12px', background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#fff' };
const filterBtnStyle = { background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '18px', padding: '5px 14px', cursor: 'pointer', fontSize: '11px', color: '#d7ccc8', marginRight: '3px', fontWeight: '600', outline: 'none' };
const userFieldStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 15px', borderRadius: '20px', border: '1px solid var(--accent)', cursor: 'pointer', backgroundColor: 'transparent', color: '#f5f5f5' };
const usernameStyle = { fontSize: '14px', fontWeight: '600' };
const logoutIconStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e74c3c', cursor: 'pointer', backgroundColor: 'transparent', color: '#e74c3c', outline: 'none', padding: 0 };
const authNavStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
const registerBtnStyle = { ...linkStyle, color: 'white', backgroundColor: 'var(--accent)', borderRadius: '20px' };

export default Header;