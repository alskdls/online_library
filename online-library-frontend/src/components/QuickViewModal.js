import React from 'react';

const QuickViewModal = ({ book, cover, onClose }) => {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeBtnStyle} onClick={onClose}>✕</button>
        
        <div style={containerStyle}>
          {/* Ліва частина: Картинка з жорсткими розмірами */}
          <div style={imageSideStyle}>
            <img src={cover} alt={book.title} style={modalImgStyle} />
          </div>
          
          {/* Права частина: Текст, який тепер правильно переноситься */}
          <div style={infoSideStyle}>
            <h2 style={{margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '26px', lineHeight: '1.2'}}>
              {book.title}
            </h2>
            <p style={authorStyle}>Автор: <b>{book.author}</b></p>
            <p style={genreStyle}>Жанр: {book.genre_name || 'Загальний'}</p>
            
            <hr style={dividerStyle} />
            
            {/* Контейнер для опису з дозволом на перенос рядків */}
            <div style={descContainerStyle}>
               <p style={descStyle}>
                 {book.description || "Опис для цієї книги поки що відсутній, але ми скоро його додамо!"}
               </p>
            </div>
            
            <div style={statsStyle}>
              <span style={{color: 'var(--text-main)'}}>📄 Сторінок: {book.pages || '---'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- СТИЛІ ---

const overlayStyle = { 
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
  backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', 
  alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
};

const modalStyle = { 
  width: '850px', maxWidth: '90%', background: 'var(--card-bg, #1e1e1e)', 
  borderRadius: '16px', padding: '35px', position: 'relative', 
  border: '1px solid var(--border-color, #333)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  maxHeight: '90vh', overflowY: 'auto' 
};

const containerStyle = { 
  display: 'flex', 
  flexDirection: 'row', 
  flexWrap: 'wrap', // Дозволяємо перенос блоків (текст під картинку) лише на дуже малих екранах
  gap: '35px', 
  alignItems: 'flex-start' 
};

const imageSideStyle = { 
  flex: '0 0 280px', // Картинка завжди займає рівно 280px ширини
  maxWidth: '280px'
};

const modalImgStyle = { 
  width: '100%', 
  height: '400px', 
  objectFit: 'cover', 
  borderRadius: '10px', 
  boxShadow: '0 10px 25px rgba(0,0,0,0.4)' 
};

const infoSideStyle = { 
  flex: '1', // Текст займає весь вільний простір
  minWidth: '300px', // Але не стає вужчим за 300px
  display: 'flex', 
  flexDirection: 'column'
};

const descContainerStyle = {
  width: '100%',
  margin: '10px 0 25px 0'
};

const descStyle = { 
  fontSize: '16px', 
  lineHeight: '1.6', 
  color: 'var(--text-main, #eee)', 
  margin: 0,
  whiteSpace: 'normal', // ГАРАНТІЯ ТУТ: текст буде переноситися на нові рядки
  wordWrap: 'break-word',
  textAlign: 'left'
};

const closeBtnStyle = { position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted, #999)' };
const authorStyle = { fontSize: '18px', color: 'var(--accent, #e74c3c)', margin: '0 0 5px 0' };
const genreStyle = { fontSize: '15px', color: '#3498db', margin: 0 };
const dividerStyle = { border: '0', borderTop: '1px solid var(--border-color, #444)', margin: '20px 0' };
const statsStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '16px' };

export default QuickViewModal;