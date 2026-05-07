import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Sparkles, Trophy, Shuffle, PlusCircle, User as UserIcon } from 'lucide-react';

const Sidebar = ({ onApplyFilters, isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleQuickFilter = (type) => {
    const currentYear = new Date().getFullYear();
    let filters = {
      selectedGenres: [],
      selectedAuthors: [],
      priceRange: { min: '', max: '' },
      selectedYears: { from: '', to: '' },
      pageFilter: '',
      onlyWithImages: false
    };

    if (type === 'new') {
      filters.selectedYears = { from: (currentYear - 1).toString(), to: currentYear.toString() };
    }
    onApplyFilters(filters);
  };

  return (
    <aside style={sidebarContainerStyle}>
      <style>
        {`
          .sidebar-item {
            padding: 12px 15px;
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.3s ease, color 0.3s ease !important;
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

          .user-profile-field-sidebar {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
          }
          
          .user-profile-field-sidebar:hover {
            background-color: #5d4037 !important; 
            color: #fff !important;
          }

          .user-profile-field-sidebar:hover span {
            color: #fff !important;
          }

          .theme-toggle-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 14px;
            margin-bottom: 20px;
          }

          .switch {
            position: relative;
            display: inline-block;
            width: 38px;
            height: 20px;
          }
          .switch input { opacity: 0; width: 0; height: 0; }
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #4a3728;
            transition: .4s;
            border-radius: 20px;
          }
          .slider:before {
            position: absolute;
            content: "";
            height: 14px; width: 14px;
            left: 3px; bottom: 3px;
            background-color: #fff;
            transition: .4s;
            border-radius: 50%;
          }
          input:checked + .slider { background-color: var(--accent); }
          input:checked + .slider:before { transform: translateX(18px); }

          .action-btn {
            transition: all 0.3s ease !important;
          }
          .action-btn:hover {
            opacity: 0.9;
          }
        `}
      </style>

      {/* ОСНОВНА НАВІГАЦІЯ */}
      <div className="sidebar-item" onClick={() => navigate('/')}>
        <LayoutGrid size={18} /> Головна
      </div>
      <div className="sidebar-item" onClick={() => handleQuickFilter('new')}>
        <Sparkles size={18} /> Новинки
      </div>
      <div className="sidebar-item" onClick={() => handleQuickFilter('top')}>
        <Trophy size={18} /> Топ книги
      </div>
      <div className="sidebar-item" onClick={() => navigate('/recommendations')}>
        <Sparkles size={18} color="var(--accent)" /> Рекомендації
      </div>

      <div style={{ height: '30px' }}></div>

      {/* ДОДАТКОВО */}
      <div className="sidebar-item" onClick={() => alert('Шукаємо випадкову книгу...')}>
        <Shuffle size={18} /> Рандомна книга
      </div>

      <div style={{ marginTop: 'auto' }}>
        {/* ПЕРЕМИКАЧ ТЕМИ */}
        <div className="theme-toggle-container">
          <span style={{ fontSize: '13px', color: '#d7ccc8', fontWeight: '500' }}>Темна тема</span>
          <label className="switch">
            <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* НИЖНІЙ БЛОК (АККАУНТ) */}
      <div style={bottomSectionStyle}>
        {user ? (
          <>
            <div 
              className="user-profile-field-sidebar"
              // ЗМІНЕНО: тепер веде на шлях з ID, як і в хедері
              onClick={() => navigate(`/profile/${user.id}`)} 
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
              <button onClick={() => navigate('/add-book')} className="action-btn" style={addBookBtnStyle}>
                <PlusCircle size={16} /> Додати книгу
              </button>
            )}
          </>
        ) : (
          <button onClick={() => navigate('/login')} className="action-btn" style={loginBtnStyle}>
            Увійти в кабінет
          </button>
        )}
      </div>
    </aside>
  );
};

// --- СТИЛІ (без змін) ---
const sidebarContainerStyle = { width: '240px', padding: '20px 15px', backgroundColor: '#2c1e1a', display: 'flex', flexDirection: 'column', alignSelf: 'stretch', boxSizing: 'border-box', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 1000 };
const bottomSectionStyle = { paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' };
const userFieldStyle = { display: 'flex', alignItems: 'center', padding: '6px 15px', borderRadius: '20px', border: '1px solid var(--accent)', cursor: 'pointer', backgroundColor: 'transparent', color: '#f5f5f5', marginBottom: '15px' };
const usernameStyle = { fontSize: '14px', fontWeight: '600' };
const addBookBtnStyle = { backgroundColor: 'var(--accent)', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const loginBtnStyle = { backgroundColor: 'transparent', color: '#fff', width: '100%', padding: '12px', border: '1px solid var(--accent)', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };

export default Sidebar;