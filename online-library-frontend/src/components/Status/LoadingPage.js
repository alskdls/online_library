import React from 'react';

const LoadingPage = () => {
  return (
    <div style={containerStyle}>
      <div style={loaderStyle}></div>
      <h2 style={textStyle}>Завантаження бібліотеки...</h2>
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
  color: 'var(--text-main)'
};

const loaderStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid var(--border-color)',
  borderTop: '5px solid var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '20px'
};

const textStyle = {
  fontSize: '1.2rem',
  fontWeight: '500'
};

// Не забудь добавить этот keyframes в App.css или index.css:
// @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

export default LoadingPage;