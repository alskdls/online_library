import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuickViewModal from './QuickViewModal';

const BookCard = ({ book, isFavoriteInitial = false }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ratingData, setRatingData] = useState({ average_rating: 0, total_votes: 0 });

  // СИНХРОНІЗАЦІЯ: оновлюємо внутрішній стан, якщо змінився пропс зверху
  useEffect(() => {
    setIsFavorite(isFavoriteInitial);
  }, [isFavoriteInitial]);

  useEffect(() => {
    axios.get(`https://library-backend-0q6b.onrender.com/books/${book.id}/rating`)
      .then(res => setRatingData(res.data))
      .catch(err => console.error(err));
  }, [book.id]);

  const cover = (book.image_url && book.image_url !== "[null]" && book.image_url.trim() !== "") 
    ? book.image_url 
    : "https://kappa.lol/pAubra"; 

 const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!user) { alert("Увійдіть!"); return; }
    
    const method = isFavorite ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch('https://library-backend-0q6b.onrender.com/favorites', {
        method, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bookId: book.id })
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite); // Перемикаємо колір миттєво
      }
    } catch (err) { 
      console.error("Помилка зірочки:", err); 
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Видалити цю книгу?")) return;
    try {
      const response = await fetch(`https://library-backend-0q6b.onrender.com/books/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: user?.role })
      });
      if (response.ok) window.location.reload(); 
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <div className="book-card" style={cardStyle} onClick={() => navigate(`/book/${book.id}`)}>
        <div style={topRowStyle}>
          {user && (
            <button 
              onClick={handleFavoriteClick} 
              style={iconBtnStyle(isFavorite ? '#f1c40f' : '#ccc')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? "#f1c40f" : "none"} stroke={isFavorite ? "#f1c40f" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            {user?.role === 'admin' && (
              <>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-book/${book.id}`); }} style={iconBtnStyle('#f39c12')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button onClick={(e) => handleDelete(e, book.id)} style={iconBtnStyle('#e74c3c')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </>
            )}
            <button onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }} style={iconBtnStyle('var(--accent)')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <div style={imageBoxStyle}>
          <img src={cover} alt={book.title} style={imgStyle} onError={(e) => { e.target.src = "https://kappa.lol/pAubra"; }} />
        </div>
        
        <div style={contentStyle}>
          <h3 style={titleStyle}>{book.title}</h3>
          <p style={authorStyle}>{book.author}</p>
          
          <div style={ratingRowStyle}>
            <span style={{color: '#f1c40f', display: 'flex', gap: '2px'}}>
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.round(ratingData.average_rating) ? "#f1c40f" : "none"} stroke={i < Math.round(ratingData.average_rating) ? "#f1c40f" : "#ccc"} strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </span>
            <span style={ratingNumStyle}>{ratingData.average_rating || 0}</span>
          </div>

          <button className="primary-btn" style={readBtnStyle} onClick={(e) => { e.stopPropagation(); navigate(`/book/${book.id}`); }}>
            Читати онлайн
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '8px'}}>
              <line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
      {isModalOpen && <QuickViewModal book={book} cover={cover} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

// --- Стилі без змін ---
const cardStyle = { width: '210px', background: 'var(--card-bg)', borderRadius: '12px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', transition: 'all 0.3s ease', cursor: 'pointer' };
const topRowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center', height: '24px' };
const iconBtnStyle = (color) => ({ background: 'none', border: 'none', cursor: 'pointer', color: color, padding: '4px', display: 'flex', alignItems: 'center' });
const imageBoxStyle = { width: '100%', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: '4px', overflow: 'hidden' };
const imgStyle = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '2px' };
const contentStyle = { marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '2px' };
const titleStyle = { fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 2px 0', lineHeight: '1.2', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const authorStyle = { fontSize: '13px', color: 'var(--text-muted)', margin: 0 };
const ratingRowStyle = { fontSize: '13px', display: 'flex', alignItems: 'center', margin: '6px 0', justifyContent: 'flex-start', width: '100%' };
const ratingNumStyle = { marginLeft: '8px', color: 'var(--text-muted)', fontWeight: '600' };
const readBtnStyle = { marginTop: '8px', width: '100%', padding: '10px', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default BookCard;