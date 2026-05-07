import React from 'react';
import { Mail, Phone, MapPin, Share2, Globe, MessageSquare, BookOpen } from 'lucide-react';

const Footer = () => {
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
          <div style={socialWrapperStyle}>
             <Share2 size={18} className="social-icon" style={socialIconStyle} />
             <Globe size={18} className="social-icon" style={socialIconStyle} />
             <MessageSquare size={18} className="social-icon" style={socialIconStyle} />
          </div>
        </div>

        {/* Блок 2: Навігація */}
        <div style={sectionStyle}>
          <h4 style={miniHeadingStyle}>Навігація</h4>
          <ul style={listStyle}>
            <li className="footer-link" style={listItemStyle}>Про нас</li>
            <li className="footer-link" style={listItemStyle}>Правила користування</li>
            <li className="footer-link" style={listItemStyle}>Допомога</li>
            <li className="footer-link" style={listItemStyle}>FAQ</li>
          </ul>
        </div>

        {/* Блок 3: Контакти */}
        <div style={sectionStyle}>
          <h4 style={miniHeadingStyle}>Зв'язок з нами</h4>
          <div style={contactItemStyle}>
            <Mail size={14} color="var(--accent)" />
            <span style={textStyle}>support@library.ua</span>
          </div>
          <div style={contactItemStyle}>
            <Phone size={14} color="var(--accent)" />
            <span style={textStyle}>+380 (99) 123-45-67</span>
          </div>
          <div style={contactItemStyle}>
            <MapPin size={14} color="var(--accent)" />
            <span style={textStyle}>м. Львів, вул. Технічна, 1</span>
          </div>
        </div>

      </div>

      <div style={bottomBarStyle}>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} Система управління бібліотекою. Всі права захищені.
        </p>
      </div>

      <style>{`
        .footer-link {
          transition: all 0.3s ease;
          display: block;
        }
        .footer-link:hover {
          color: #fff !important;
          transform: scale(1.05);
        }
        .social-icon {
          cursor: pointer;
          transition: transform 0.3s ease, color 0.3s ease;
          color: #a1887f;
        }
        .social-icon:hover {
          color: var(--accent);
          transform: translateY(-3px);
        }
      `}</style>
    </footer>
  );
};

// --- СТИЛІ ---

const footerStyle = {
  background: '#2c1e1a',
  color: '#f5f5f5',
  padding: '60px 0 20px 0',
  marginTop: '0', // ЗМІНИТИ З 40px НА 0, щоб прибрати смугу зверху
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  width: '100%',
  position: 'relative',
  zIndex: 10
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'space-around', // Більш рівномірний розподіл
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 40px',
  gap: '40px'
};

const sectionStyle = {
  flex: '1',
  minWidth: '250px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center', // ЦЕНТРУВАННЯ КОНТЕНТУ В СТОВПЧИКУ
  textAlign: 'center'    // ЦЕНТРУВАННЯ ТЕКСТУ
};

const logoWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '20px'
};

const headingStyle = {
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const miniHeadingStyle = {
  color: 'var(--accent)',
  marginBottom: '25px',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const textStyle = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#d7ccc8',
  margin: 0
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

const listItemStyle = {
  fontSize: '14px',
  marginBottom: '12px',
  cursor: 'pointer',
  color: '#a1887f'
};

const contactItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center', // Центрування іконки разом з текстом
  gap: '12px',
  marginBottom: '15px',
  width: '100%'
};

const socialWrapperStyle = {
  display: 'flex',
  gap: '20px',
  marginTop: '25px',
  justifyContent: 'center'
};

const socialIconStyle = {
  opacity: 0.8
};

const bottomBarStyle = {
  textAlign: 'center',
  marginTop: '60px',
  paddingTop: '25px',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  fontSize: '12px',
  color: '#a1887f'
};

export default Footer;