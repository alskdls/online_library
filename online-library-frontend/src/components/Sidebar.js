import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { LayoutGrid, Sparkles, Trophy, Shuffle, PlusCircle, User as UserIcon, X } from 'lucide-react';

const Sidebar = ({ onApplyFilters, isDarkMode, toggleTheme, isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // ИСПРАВЛЕННАЯ ЛОГИКА ДЛЯ НОВИНОК (синхронно с 1100px)
  const handleGoToNew = () => {
    navigate('/search?sort=new');
    if (window.innerWidth <= 1100) onClose();
  };

  const menuClick = (path) => {
    navigate(path);
    if (window.innerWidth <= 1100) onClose();
  };

  const handleRandomBook = async () => {
    try {
      const res = await axios.get('http://localhost:5000/books');
      const books = res.data;
      
      if (books && books.length > 0) {
        const randomIndex = Math.floor(Math.random() * books.length);
        const randomBookId = books[randomIndex].id;
        menuClick(`/book/${randomBookId}`);
      } else {
        alert("Книг поки що немає");
      }
    } catch (err) {
      console.error("Помилка при пошуку рандомної книги:", err);
      alert("Не вдалося завантажити список книг");
    }
  };

  return (
    <>
      <style>{`
        .sidebar-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
          z-index: 1000;
          opacity: ${isOpen ? 1 : 0};
          visibility: ${isOpen ? 'visible' : 'hidden'};
          transition: all 0.3s ease-in-out;
        }

        .sidebar-aside {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease-in-out !important;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mobile-sidebar-header {
          display: none; 
        }

        /* ТЕПЕРЬ ПЕРЕКЛЮЧАЕТСЯ СИНХРОННО НА 1100px КАК И ПРАВЫЙ САЙДБАР */
        @media (max-width: 1100px) {
          .sidebar-aside {
            position: fixed !important;
            z-index: 1001;
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .mobile-sidebar-header { 
            display: flex !important; 
            justify-content: space-between;
            align-items: center;
            color: #fff;
            padding: 10px 5px;
            margin-bottom: 15px;
          }
        }

        .sidebar-scrollable-content {
          flex: 1; 
          overflow-y: auto;
        }
        .sidebar-scrollable-content::-webkit-scrollbar { width: 0; }

        .sidebar-item {
          padding: 12px 15px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease !important;
          color: #d7ccc8;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        
        .sidebar-item:hover {
          background-color: #5d4037 !important;
          color: #fff !important;
        }

        .action-btn { transition: all 0.3s ease !important; }
        .action-btn:hover { opacity: 0.9; }
      `}</style>

      <div className="sidebar-overlay" onClick={onClose} />

      <aside className="sidebar-aside" style={sidebarContainerStyle}>
        
        <div className="mobile-sidebar-header">
           <span style={{fontWeight: 'bold', fontSize: '14px'}}>МЕНЮ</span>
           <X size={22} onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>

        <div className="sidebar-scrollable-content">
          <div className="sidebar-item" onClick={() => menuClick('/')}>
            <LayoutGrid size={18} /> Головна
          </div>
          
          {/* ИСПРАВЛЕННАЯ КНОПКА НОВИНКИ */}
          <div className="sidebar-item" onClick={handleGoToNew}>
            <Sparkles size={18} /> Новинки
          </div>

          <div className="sidebar-item" onClick={() => menuClick('/search?sort=top')}>
            <Trophy size={18} /> Топ книги
          </div>
          <div className="sidebar-item" onClick={() => menuClick('/recommendations')}>
            <Sparkles size={18} color="var(--accent)" /> Рекомендації
          </div>

          <div style={{ height: '30px' }}></div>

          <div className="sidebar-item" onClick={handleRandomBook}>
            <Shuffle size={18} /> Рандомна книга
          </div>
        </div>

        <div style={stickyBottomStyle}>
          <div style={{ padding: '10px 0' }}>
              <button onClick={toggleTheme} style={themeButtonStyle}>
                  {isDarkMode ? '☀️ Світла тема' : '🌙 Темна тема'}
              </button>
          </div>

          <div style={bottomSectionStyle}>
            {user ? (
              <>
                <div 
                  className="user-profile-field-sidebar"
                  onClick={() => menuClick(`/profile/${user.id}`)} 
                  style={userFieldStyle}
                >
                  <UserIcon size={18} color="var(--accent)" />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'center', lineHeight: '1.2' }}>
                    <span style={usernameStyle}>{user.username}</span>
                    <span style={{ 
                      fontSize: '10px', 
                      color: user.role === 'admin' ? 'var(--accent)' : '#a1887f',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {user.role}
                    </span>
                  </div>
                </div>

                {user.role === 'admin' && (
                  <button onClick={() => menuClick('/add-book')} className="action-btn" style={addBookBtnStyle}>
                    <PlusCircle size={16} /> Додати книгу
                  </button>
                )}
              </>
            ) : (
              <button onClick={() => menuClick('/login')} className="action-btn" style={loginBtnStyle}>
                Увійти в кабінет
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

const sidebarContainerStyle = { 
  width: '240px', 
  padding: '20px 15px', 
  backgroundColor: '#2c1e1a', 
  boxSizing: 'border-box', 
  zIndex: 1000 
};

const stickyBottomStyle = { marginTop: 'auto', paddingTop: '10px', backgroundColor: '#2c1e1a' };
const themeButtonStyle = { width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#d7ccc8', cursor: 'pointer', fontWeight: '600', fontSize: '13px' };
const bottomSectionStyle = { paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' };
const userFieldStyle = { display: 'flex', alignItems: 'center', padding: '6px 15px', borderRadius: '20px', border: '1px solid var(--accent)', cursor: 'pointer', backgroundColor: 'transparent', color: '#f5f5f5', marginBottom: '15px' };
const usernameStyle = { fontSize: '14px', fontWeight: '600' };
const addBookBtnStyle = { backgroundColor: 'var(--accent)', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const loginBtnStyle = { backgroundColor: 'transparent', color: '#fff', width: '100%', padding: '12px', border: '1px solid var(--accent)', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };

export default Sidebar;