import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ message = "Щось пішло не так або сторінку не знайдено" }) => {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <h1 style={codeStyle}>404</h1>
      <p style={messageStyle}>{message}</p>
      <button style={btnStyle} onClick={() => navigate('/')}>
        Повернутися на головну
      </button>
    </div>
  );
};

const containerStyle = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'var(--bg-color)',
  textAlign: 'center',
  padding: '20px'
};

const codeStyle = { fontSize: '100px', margin: 0, color: 'var(--accent)', opacity: 0.2 };
const messageStyle = { fontSize: '20px', color: 'var(--text-main)', marginBottom: '30px' };
const btnStyle = {
  padding: '12px 25px',
  backgroundColor: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default ErrorPage;