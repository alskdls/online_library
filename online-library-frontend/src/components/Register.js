import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        // Логика без изменений
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        alert("Реєстрація успішна! Тепер ви можете увійти.");
        navigate('/login');
      } else {
        alert(data.message || "Помилка реєстрації");
      }
    } catch (err) {
      console.error(err);
      alert("Помилка підключення до сервера");
    }
  };

  return (
    <div style={authPageWrapper}>
      <div style={formContainerStyle}>
        <h3 style={headerStyle}>Реєстрація</h3>
        <form onSubmit={handleRegister}>
          <input 
            type="text" placeholder="Ім'я" value={username}
            onChange={e => setUsername(e.target.value)} required 
            style={inputStyle} 
          />
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
          <button type="submit" style={buttonStyle}>Створити акаунт</button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '14px', textAlign: 'center', color: 'var(--text-main)' }}>
          Вже є акаунт? <span onClick={() => navigate('/login')} style={linkStyle}>Увійти</span>
        </p>
      </div>
    </div>
  );
};

const authPageWrapper = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '80vh',
  backgroundColor: 'var(--bg-color)',
  transition: 'background-color 0.3s ease'
};

const formContainerStyle = {
  width: '100%',
  maxWidth: '350px',
  padding: '40px',
  borderRadius: '12px',
  backgroundColor: 'var(--card-bg)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  border: '1px solid var(--border-color)',
  transition: 'all 0.3s ease'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '25px',
  color: 'var(--text-main)',
  fontSize: '24px'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  boxSizing: 'border-box',
  fontSize: '16px',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-main)',
  outline: 'none'
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
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

export default Register;