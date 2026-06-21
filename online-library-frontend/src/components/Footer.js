import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, LayoutGrid, Sparkles, Trophy, Shuffle } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  // Логіка переходів як у Сайдбарі
  const handleGoToNew = () => {
    navigate('/search?sort=new');
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleRandomBook = async () => {
    try {
      const res = await axios.get('http://localhost:5000/books');
      const books = res.data;
      
      if (books && books.length > 0) {
        const randomIndex = Math.floor(Math.random() * books.length);
        const randomBookId = books[randomIndex].id;
        navigate(`/book/${randomBookId}`);
      } else {
        alert("Книг поки що немає");
      }
    } catch (err) {
      console.error("Помилка при пошуку рандомної книги:", err);
      alert("Не вдалося завантажити список книг");
    }
  };

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        
        {/* Блок 1: Про нас */}
        <div style={sectionStyle}>
          <div style={logoWrapperStyle}>
            <BookOpen size={20} color="var(--accent)" />
            <h4 style={headingStyle}>Бібліотека</h4>
          </div>
          <p style={textStyle}>
            Твій персональний цифровий простір для навчання та розвитку. 
            Ми робимо доступ до знань простішим та зручнішим.
          </p>
        </div>

      </div>

      {/* Роздільна лінія на всю ширину футера */}
      <div style={fullWidthDividerStyle} />

      <div style={containerStyle}>
        {/* Горизонтальний рядок: Кнопки навігації із сайдбара */}
        <div style={navRowStyle}>
          <div className="footer-nav-item" style={navItemStyle} onClick={() => handleNavClick('/')}>
            <LayoutGrid size={16} /> <span>Головна</span>
          </div>
          
          <div className="footer-nav-item" style={navItemStyle} onClick={handleGoToNew}>
            <Sparkles size={16} /> <span>Новинки</span>
          </div>

          <div className="footer-nav-item" style={navItemStyle} onClick={() => handleNavClick('/search?sort=top')}>
            <Trophy size={16} /> <span>Топ книги</span>
          </div>

          <div className="footer-nav-item" style={navItemStyle} onClick={() => handleNavClick('/recommendations')}>
            <Sparkles size={16} color="var(--accent)" /> <span>Рекомендації</span>
          </div>

          <div className="footer-nav-item" style={navItemStyle} onClick={handleRandomBook}>
            <Shuffle size={16} /> <span>Рандомна книга</span>
          </div>
        </div>
      </div>

      <div style={bottomBarStyle}>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} Система управління бібліотекою. Всі права захищені.
        </p>
      </div>

      <style>{`
        .footer-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #d7ccc8;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .footer-nav-item:hover {
          background-color: #5d4037;
          color: #fff !important;
          transform: translateY(-2px);
        }
      `}</style>
    </footer>
  );
};

// --- СТИЛІ ---

const footerStyle = {
  background: '#2c1e1a',
  color: '#f5f5f5',
  padding: '50px 0 20px 0',
  marginTop: '0', 
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  width: '100%',
  position: 'relative',
  zIndex: 10
};

const containerStyle = {
  display: 'flex',
  flexDirection: 'column', 
  alignItems: 'center',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 40px',
  width: '100%',
  boxSizing: 'border-box'
};

const sectionStyle = {
  width: '100%',
  maxWidth: '600px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center', 
  textAlign: 'center'    
};

const logoWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '15px'
};

const headingStyle = {
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const textStyle = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#d7ccc8',
  margin: 0
};

// Нова лінія розділювача, розтягнута на 100% ширини екрана
const fullWidthDividerStyle = {
  width: '100%',
  borderTop: '1px solid rgba(255, 255, 255, 0.07)',
  margin: '30px 0'
};

const navRowStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '15px', 
  flexWrap: 'wrap',
  width: '100%'
};

const navItemStyle = {
  userSelect: 'none'
};

const bottomBarStyle = {
  textAlign: 'center',
  marginTop: '40px',
  paddingTop: '25px',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  fontSize: '12px',
  color: '#a1887f'
};

export default Footer;