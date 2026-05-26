import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ socket }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (socket) {
          socket.emit('user_online', data.user.id);
        }

        alert(`Ласкаво просимо, ${data.user.username}!`);
        navigate('/'); 
        window.location.reload(); 
      } else {
        alert(data.message || "Помилка входу");
      }
    } catch (err) {
      console.error(err);
      alert("Помилка підключення до сервера");
    }
  };

  return (
    <div style={{...authPageWrapper, backgroundColor: 'transparent'}}>
      <style>{`
        body { transition: none !important; }
      `}</style>
      <div style={formContainerStyle}>
        <h3 style={headerStyle}>Вхід у систему</h3>
        <form onSubmit={handleLogin}>
          <input 
            type="email" placeholder="Email" value={email} 
            onChange={e => setEmail(e.target.value)} required 
            style={inputStyle}
          />
          <input 
            type="password" placeholder="Пароль" value={password} 
            onChange={e => setPassword(e.target.value)} required 
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>Увійти</button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '14px', textAlign: 'center', color: 'var(--text-main)' }}>
          Немає акаунта? <span onClick={() => navigate('/register')} style={linkStyle}>Зареєструватися</span>
        </p>
      </div>
    </div>
  );
};

// --- Стили с исправлением прозрачности ---
const authPageWrapper = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 80px)', // Учитываем высоту хедера, если он есть
  padding: '20px'
};

const formContainerStyle = {
  width: '100%',
  maxWidth: '350px',
  padding: '40px',
  borderRadius: '16px', // Немного увеличил скругление для соответствия общему стилю
  backgroundColor: 'var(--card-bg)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  border: '1px solid var(--border-color)',
  transition: 'transform 0.3s ease'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '25px',
  color: 'var(--text-main)',
  fontSize: '24px',
  fontWeight: 'bold'
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: '15px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  boxSizing: 'border-box',
  fontSize: '16px',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-main)',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  transition: 'opacity 0.3s'
};

const linkStyle = {
  color: 'var(--accent)',
  cursor: 'pointer',
  fontWeight: 'bold',
  textDecoration: 'underline'
};

export default Login;