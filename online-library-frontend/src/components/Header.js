import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Заменили Link на useNavigate для ручного контроля переходов
import FiltersModal from './FiltersModal';
import { Book, LogOut, User, Menu, X, Home, Heart, Settings2 } from 'lucide-react';

// Добавили проп onClose в параметры компонента
const Header = ({ onSearch, onApplyFilters, socket, onMenuClick, isSidebarOpen, onClose }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    setUser(savedUser);

    fetch('http://localhost:5000/genres').then(res => res.json()).then(data => setGenres(data));
    fetch('http://localhost:5000/books').then(res => res.json()).then(data => {
      const uniqueAuthors = [...new Set(data.map(b => b.author))].sort();
      setAuthors(uniqueAuthors);
    });
  }, []);

  // Новая функция: делает переход по ссылке и автоматически закрывает сайдбар на мобилках
  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 1100 && onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect(); 
    }
    localStorage.removeItem('user');
    setUser(null);
    alert("Ви вийшли з аккаунту");
    navigate('/');
    window.location.reload(); 
  };

  return (
    <header style={headerStyle}>
      {/* ЛІВА ЧАСТИНА */}
      <div style={leftSectionStyle}>
        
        {/* ИСПРАВЛЕННАЯ КНОПКА БУРГЕРА */}
        <div className="mobile-menu-btn" onClick={onMenuClick} style={burgerBtnStyle}>
          {isSidebarOpen ? <X size={24} color="var(--accent)" /> : <Menu size={24} color="#fff" />}
        </div>

        {/* Используем handleNavigation для логотипа */}
        <div onClick={() => handleNavigation('/')} style={logoWrapperStyle}>
          <Book size={24} color="var(--accent)" />
          <span style={logoTextStyle} className="header-logo-text">Бібліотека</span>
        </div>
        
        <nav style={navStyle} className="header-navigation">
          {/* Заменили Link на div с handleNavigation, чтобы сайдбар закрывался при клике */}
          <div onClick={() => handleNavigation('/')} className="nav-link" style={{ ...linkStyle, cursor: 'pointer' }} title="Головна">
            <Home size={20} className="nav-icon" />
            <span className="nav-text">Головна</span>
          </div>
          <div onClick={() => handleNavigation('/favorites')} className="nav-link" style={{ ...linkStyle, cursor: 'pointer' }} title="Обране">
            <Heart size={20} className="nav-icon" />
            <span className="nav-text">Обране</span>
          </div>
        </nav>
      </div>

      {/* ПРАВА ЧАСТИНА */}
      <div style={rightSectionStyle}>
        <div style={searchContainerStyle} className="header-search-container">
          <input 
            type="text" 
            placeholder="Пошук..." 
            onChange={(e) => onSearch(e.target.value)} 
            style={inputStyle}
            className="header-search-input"
          />
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="filter-btn-header"
            style={filterBtnStyle}
            title="Фільтри"
          >
            <Settings2 size={14} className="filter-icon" />
            <span className="filter-text">Фільтри</span>
          </button>
        </div>

        {!user ? (
          <div style={authNavStyle} className="auth-nav">
            {/* Используем handleNavigation для авторизации */}
            <div onClick={() => handleNavigation('/login')} className="nav-link" style={{ ...linkStyle, cursor: 'pointer' }}>Увійти</div>
            <div onClick={() => handleNavigation('/register')} style={{ ...registerBtnStyle, cursor: 'pointer' }} className="reg-btn">Реєстрація</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div 
              className="user-profile-field"
              onClick={() => handleNavigation(`/profile/${user.id}`)} 
              style={userFieldStyle}
            >
              <User size={18} color="var(--accent)" />
              <span style={usernameStyle} className="username-text">{user.username}</span>
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
        header { min-width: 320px; }
        
        .nav-link, .user-profile-field, .logout-field-icon, .filter-btn-header {
          transition: all 0.2s ease-in-out !important;
        }

        .nav-icon { display: none; }
        .filter-icon { display: none; }

        /* --- АДАПТИВНІСТЬ --- */

        @media (max-width: 1150px) {
          .header-logo-text { display: none; }
        }

        /* Кнопка бургера тепер появляется синхронно на 1100px */
        @media (max-width: 1100px) {
          .mobile-menu-btn { display: flex !important; margin-right: 5px; }
          
          .username-text { display: none; }
          .user-profile-field { padding: 8px !important; }
          
          .nav-text { display: none; }
          .nav-icon { display: block; }
          .nav-link { padding: 8px !important; }
          
          .header-search-container { max-width: 200px; }
        }

        /* 950px - Фикс кнопки фильтров */
        @media (max-width: 950px) {
          .filter-text { display: none; }
          .filter-icon { display: block !important; margin: 0 !important; }
          .filter-btn-header { 
            padding: 0 !important; 
            width: 32px !important; 
            min-width: 32px !important;
            height: 28px !important;
            display: flex; 
            justify-content: center; 
            align-items: center;
          }
          .header-search-container { max-width: 160px; height: 34px; }
        }

        /* Убрали изменение padding, чтобы шапка не сужалась резко и страница не прыгала */
        @media (max-width: 768px) {
          .header-search-container { max-width: 140px; }
        }

        @media (max-width: 480px) {
          .auth-nav { display: none !important; }
          .header-search-container { max-width: 110px; }
        }
      `}</style>
    </header>
  );
};

/* Подняли zIndex шапки до 1010, чтобы бургер-кнопка оставалась кликабельной поверх оверлея (1000) */
const headerStyle = { background: '#2c1e1a', padding: '10px 30px', color: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1010, borderBottom: '1px solid rgba(255,255,255,0.05)', height: '60px', boxSizing: 'border-box' };
const leftSectionStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
const burgerBtnStyle = { display: 'none', alignItems: 'center', justifyItems: 'center', cursor: 'pointer', zIndex: 1015, position: 'relative' };
const logoWrapperStyle = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 };
const logoTextStyle = { fontSize: '18px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' };
const navStyle = { display: 'flex', gap: '5px', alignItems: 'center' };
const linkStyle = { color: '#d7ccc8', textDecoration: 'none', fontWeight: '600', fontSize: '14px', padding: '8px 15px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const rightSectionStyle = { display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'flex-end' };
const searchContainerStyle = { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '25px', padding: '2px 5px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', transition: 'all 0.3s ease', overflow: 'hidden', height: '36px' };
const inputStyle = { flex: 1, padding: '6px 12px', background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#fff', width: '100%', minWidth: '40px' };

const filterBtnStyle = { background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '18px', padding: '0 14px', height: '28px', cursor: 'pointer', fontSize: '11px', color: '#d7ccc8', fontWeight: '600', outline: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', alignSelf: 'center' };

const userFieldStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 15px', borderRadius: '20px', border: '1px solid var(--accent)', cursor: 'pointer', backgroundColor: 'transparent', color: '#f5f5f5', flexShrink: 0 };
const usernameStyle = { fontSize: '14px', fontWeight: '600' };
const logoutIconStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e74c3c', cursor: 'pointer', backgroundColor: 'transparent', color: '#e74c3c', outline: 'none', padding: 0, flexShrink: 0 };
const authNavStyle = { display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 };
const registerBtnStyle = { ...linkStyle, color: 'white', backgroundColor: 'var(--accent)', borderRadius: '20px' };

export default Header;