import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import HTMLFlipBook from 'react-pageflip';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const syncTheme = () => {
      const currentTheme = localStorage.getItem('theme') || 'light';
      if (currentTheme !== themeMode) setThemeMode(currentTheme);
    };
    const interval = setInterval(syncTheme, 100);
    window.addEventListener('storage', syncTheme);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncTheme);
    };
  }, [themeMode]);

  const isDarkMode = themeMode === 'dark';

  const [book, setBook] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingData, setRatingData] = useState({ average_rating: 0, total_votes: 0 });
  const [userRating, setUserRating] = useState(0); 
  const [comment, setComment] = useState(""); 
  const [allReviews, setAllReviews] = useState([]); 
  const [cooldown, setCooldown] = useState(0); 
  const [replyTo, setReplyTo] = useState(null); 
  const [currentStatus, setCurrentStatus] = useState(null);
  const [bookReactions, setBookReactions] = useState({ likes: 0, dislikes: 0, userReaction: null });
  const [pages, setPages] = useState([]); 

  const bookRef = useRef();
  const user = JSON.parse(localStorage.getItem('user'));
  const bookIdNum = parseInt(id);

  const fetchData = async () => {
    try {
      const booksRes = await axios.get(`http://localhost:5000/books`);
      const foundBook = booksRes.data.find(b => b.id === bookIdNum);
      setBook(foundBook);

      if (foundBook && foundBook.content) {
        const textContent = foundBook.content;
        const words = textContent.split(' ');
        const wordsPerPage = 90; 
        const generatedPages = [];
        
        for (let i = 0; i < words.length; i += wordsPerPage) {
          generatedPages.push({
            text: words.slice(i, i + wordsPerPage).join(' ')
          });
        }
        if (generatedPages.length % 2 !== 0) {
          generatedPages.push({ text: "" });
        }
        setPages(generatedPages);
      }

      const ratingRes = await axios.get(`http://localhost:5000/books/${id}/rating`);
      setRatingData(ratingRes.data);

      const reviewsRes = await axios.get(`http://localhost:5000/books/${id}/reviews`);
      setAllReviews(reviewsRes.data);

      const reactionsRes = await axios.get(`http://localhost:5000/books/${id}/reactions`);
      setBookReactions(prev => ({ ...prev, ...reactionsRes.data }));

      if (user) {
        const myVote = reviewsRes.data.find(r => r.user_id === user.id && r.rating > 0);
        if (myVote) { setUserRating(myVote.rating); }
        const favRes = await axios.get(`http://localhost:5000/favorites/${user.id}`);
        setIsFavorite(favRes.data.map(Number).includes(bookIdNum));
        const statusRes = await axios.get(`http://localhost:5000/user-books/${user.id}/${id}`);
        if (statusRes.data) setCurrentStatus(statusRes.data.status);
        try {
          const userVoteRes = await axios.get(`http://localhost:5000/books/${id}/reactions/${user.id}`);
          setBookReactions(prev => ({ ...prev, userReaction: userVoteRes.data.type }));
        } catch (e) {
          setBookReactions(prev => ({ ...prev, userReaction: null }));
        }
      }
    } catch (err) { console.error(err); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleBookReaction = async (type) => {
    if (!user) return alert("Увійдіть!");
    try {
      await axios.post(`http://localhost:5000/books/${id}/reaction`, { userId: user.id, type });
      fetchData(); 
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (newStatus) => {
    if (!user) return alert("Увійдіть!");
    setCurrentStatus(newStatus);
    try {
      await axios.post(`http://localhost:5000/users/books/update-status`, { userId: user.id, bookId: bookIdNum, status: newStatus });
    } catch (err) { fetchData(); }
  };

  const handleStarClick = async (val) => {
    if (!user) return alert("Увійдіть!");
    setUserRating(val);
    try { await axios.post('http://localhost:5000/reviews', { userId: user.id, bookId: id, rating: val, comment: null }); fetchData(); } catch (err) { console.error(err); }
  };

  const handlePostComment = async () => {
    if (!userRating || !comment.trim()) return alert("Заповніть відгук та оцінку!");
    try {
      await axios.post('http://localhost:5000/reviews', { userId: user.id, bookId: id, rating: userRating, comment: comment.trim(), parent_id: replyTo });
      setComment(""); setReplyTo(null); fetchData(); 
    } catch (err) { if (err.response?.status === 429) setCooldown(Math.ceil(err.response.data.retryAfter / 1000)); }
  };

  const handleFavoriteClick = async () => {
    if (!user) return alert("Увійдіть!");
    const oldFavorite = isFavorite;
    setIsFavorite(!oldFavorite);
    try {
      if (oldFavorite) await axios.delete('http://localhost:5000/favorites', { data: { userId: user.id, bookId: bookIdNum } });
      else await axios.post('http://localhost:5000/favorites', { userId: user.id, bookId: bookIdNum });
    } catch (err) { setIsFavorite(oldFavorite); }
  };

  const handleReaction = async (commentId, type) => {
    if (!user) return alert("Увійдіть!");
    try { await axios.post(`http://localhost:5000/comments/${commentId}/reaction`, { userId: user.id, type }); fetchData(); } catch (err) { console.error(err); }
  };

  const handleQuote = (username, text) => {
    setComment(`> ${username}: "${text}" \n\n${comment}`);
    document.getElementById('comment-textarea')?.focus();
  };

  const LikeIcon = ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
  );
  const DislikeIcon = ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
  );
  const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  );

  if (!book) return null;

  const cover = (book.image_url && book.image_url !== "[null]" && book.image_url.trim() !== "") ? book.image_url : "https://kappa.lol/pAubra";
  const isButtonActive = userRating > 0 && comment.trim().length > 0 && cooldown === 0;

  // Проверяем, что у нас в контенте: ссылка на файл или текст
  const isFile = book.content && book.content.startsWith('/uploads/');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-main)' }}>
      <style>{`
        :root {
          --text-main: ${isDarkMode ? '#e0e0e0' : '#2c1e1a'};
          --text-muted: ${isDarkMode ? '#a0a0a0' : '#8d6e63'};
          --border-color: ${isDarkMode ? '#333' : '#eee'};
          --accent-brown: ${isDarkMode ? '#b08968' : '#2c1e1a'};
          --secondary-brown: ${isDarkMode ? '#7f5539' : '#8d6e63'};
          --input-bg: ${isDarkMode ? '#2d2d2d' : '#fff'};
        }
        * { transition: none !important; }
        .stf__parent {
          box-shadow: 0 12px 38px rgba(0,0,0,0.4) !important;
        }
      `}</style>

      <div style={{ marginBottom: '30px' }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>← Назад до каталогу</button>
      </div>

      <div style={topSection}>
        <div style={imageSide}>
          <img src={cover} alt={book.title} style={mainImage} />
          <div style={{...statusPanelSide, backgroundColor: isDarkMode ? '#242424' : '#f8f9fa', border: `1px solid var(--border-color)`}}>
             {['completed', 'reading', 'planned', 'dropped'].map(status => (
               <button key={status} onClick={() => handleStatusChange(status)} style={statusBtnStyle(status === 'completed' ? '#27ae60' : status === 'reading' ? '#3498db' : status === 'planned' ? '#f39c12' : '#e74c3c', currentStatus === status, isDarkMode)}>
                  {currentStatus === status && <CheckIcon />} {status === 'completed' ? 'Прочитано' : status === 'reading' ? 'Читаю' : status === 'planned' ? 'У плани' : 'Кинуто'}
               </button>
             ))}
          </div>
        </div>

        <div style={infoSide}>
          <h1 style={{...bookTitle, color: 'var(--text-main)'}}>{book.title}</h1>
          <h2 style={{...bookSubtitle, color: 'var(--text-muted)'}}>{book.author}</h2>
          
          <div style={{...ratingContainer, backgroundColor: isDarkMode ? '#242424' : '#f9f9f9', border: `1px solid var(--border-color)`}}>
              <div style={{ display: 'flex', gap: '5px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} onClick={() => handleStarClick(star)} style={{ 
                          cursor: 'pointer', color: star <= (userRating || Math.round(ratingData.average_rating)) ? '#f1c40f' : '#ccc', fontSize: '28px'
                      }}>★</span>
                  ))}
              </div>
              <div style={{marginLeft: '10px'}}>
                  <span style={ratingValue}>{ratingData.average_rating} / 5</span>
                  <div style={{...votesCount, color: 'var(--text-muted)'}}>{ratingData.total_votes} голосів</div>
              </div>
          </div>

          <div style={specsTable}>
            <div style={specRow}><span style={{...specLabel, color: 'var(--text-muted)'}}>Жанр:</span> <span style={specValue}>{book.genre_name}</span></div>
            <div style={specRow}><span style={{...specLabel, color: 'var(--text-muted)'}}>Рік:</span> <span style={specValue}>{book.year || '—'}</span></div>
            <div style={specRow}><span style={{...specLabel, color: 'var(--text-muted)'}}>Сторінок:</span> <span style={specValue}>{book.pages || '—'}</span></div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => document.getElementById('reader-section')?.scrollIntoView({ behavior: 'auto' })} style={{...readActionBtn, backgroundColor: 'var(--accent-brown)'}}>ЧИТАТИ ОНЛАЙН 📖</button>
              <button onClick={handleFavoriteClick} style={favoriteBtn(isFavorite, isDarkMode)}>{isFavorite ? '★ У СПИСКУ' : '☆ В ОБРАНЕ'}</button>
          </div>
        </div>
      </div>

      <div style={descriptionSection}>
        <h3 style={{...sectionHeader, borderBottomColor: 'var(--accent-brown)'}}>Анотація</h3>
        <div style={descriptionText}>{book.description}</div>
      </div>

      {/* УВЕЛИЧЕННЫЙ И РАСШИРЕННЫЙ БЛОК ЧИТАЛКИ */}
      <div id="reader-section" style={{ marginTop: '50px', width: '100%' }}>
          <h3 style={{...sectionHeader, borderBottomColor: 'var(--accent-brown)'}}>Читати онлайн</h3>
          
          {isFile ? (
            <div style={{ 
              width: '100%', 
              height: '1200px', // Увеличил высоту в 1.5 раза (было 800px)
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 12px 38px rgba(0,0,0,0.3)',
              backgroundColor: '#333'
            }}>
              <iframe 
                src={`http://localhost:5000${book.content}#view=FitH&toolbar=0`} 
                width="100%" 
                height="100%" 
                style={{ border: 'none' }}
                title={book.title}
              />
            </div>
          ) : pages.length > 0 ? (
            // Тут оставляем FlipBook как было, если это текст
            <div style={{...professionalReaderWrapper, backgroundColor: isDarkMode ? '#1a1a1a' : '#2b211f', width: '100%'}}>
              <button onClick={() => bookRef.current?.pageFlip().flipPrev()} style={navArrowStyle}>‹</button>
              <HTMLFlipBook width={600} height={850} size="fixed" minWidth={400} maxWidth={1000} minHeight={600} maxHeight={1200} showCover={false} ref={bookRef}>
                {pages.map((page, index) => (
                  <div key={index} style={{...pagePaperStyle, backgroundColor: isDarkMode ? '#262322' : '#fcfaf2'}}>
                    <div style={pageInnerContentStyle}>
                      <p style={{...textStyle, color: isDarkMode ? '#e0dcd3' : '#2c2523'}}>{page.text}</p>
                      <span style={pageNumberStyle}>{index + 1}</span>
                    </div>
                  </div>
                ))}
              </HTMLFlipBook>
              <button onClick={() => bookRef.current?.pageFlip().flipNext()} style={navArrowStyle}>›</button>
            </div>
          ) : (
            <div style={bookPlaceholder}>Контент відсутній або завантажується...</div>
          )}
      </div>

      <div style={{...bottomActionsBar, borderTopColor: 'var(--border-color)'}}>
        <div style={bookReactionContainerBottom}>
          <button onClick={() => handleBookReaction('like')} style={bookReactionBtn(bookReactions.userReaction === 'like', '#27ae60', isDarkMode)}>
            <LikeIcon size={18} color={bookReactions.userReaction === 'like' ? '#27ae60' : (isDarkMode ? '#aaa' : '#555')} />
            <span style={{marginLeft: '8px'}}>{bookReactions.likes}</span>
          </button>
          <button onClick={() => handleBookReaction('dislike')} style={bookReactionBtn(bookReactions.userReaction === 'dislike', '#e74c3c', isDarkMode)}>
            <DislikeIcon size={18} color={bookReactions.userReaction === 'dislike' ? '#e74c3c' : (isDarkMode ? '#aaa' : '#555')} />
            <span style={{marginLeft: '8px'}}>{bookReactions.dislikes}</span>
          </button>
        </div>
      </div>

      <div style={commentsSection}>
          <h3 style={sectionHeader}>Відгуки</h3>
          {user ? (
              <div style={commentForm}>
                  {replyTo && <div style={{...replyStatusStyle, backgroundColor: isDarkMode ? '#332a28' : '#f3ecea'}}>Відповідь для: {allReviews.find(r => r.id === replyTo)?.username} <button onClick={() => setReplyTo(null)}>X</button></div>}
                  <textarea id="comment-textarea" placeholder="Ваш відгук..." value={comment} onChange={(e) => setComment(e.target.value)} style={{...textAreaStyle, backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'}} />
                  <button onClick={handlePostComment} disabled={!isButtonActive} style={{...sendCommentBtn, backgroundColor: isButtonActive ? 'var(--accent-brown)' : '#ccc'}}>
                    {cooldown > 0 ? `ПАУЗА ${cooldown}с` : (replyTo ? 'ВІДПОВІСТИ' : 'ДОДАТИ КОМЕНТАР')}
                  </button>
              </div>
          ) : <p>Увійдіть для відгуку.</p>}

          <div style={{ marginTop: '30px', paddingBottom: '60px' }}>
              {allReviews.filter(rev => rev.comment && !rev.parent_id).map((rev) => (
                  <div key={rev.id} style={{ marginBottom: '25px', borderBottom: `1px solid var(--border-color)` }}>
                      <div style={commentCard}>
                          <div style={{...commentAvatar, backgroundColor: 'var(--accent-brown)'}}>{rev.username[0]}</div>
                          <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={commentUser}>{rev.username} <span style={starsLabel}>{'★'.repeat(rev.rating)}</span></span>
                                  <div style={{...reactionWrapper, backgroundColor: isDarkMode ? '#242424' : '#f0f2f5', border: `1px solid var(--border-color)`}}>
                                    <button onClick={() => handleReaction(rev.id, 'like')} style={reactionBtnStyle}><LikeIcon size={14}/> {rev.likes_count}</button>
                                    <button onClick={() => handleReaction(rev.id, 'dislike')} style={reactionBtnStyle}><DislikeIcon size={14}/> {rev.dislikes_count}</button>
                                  </div>
                              </div>
                              <p style={commentText}>{rev.comment}</p>
                              <button onClick={() => handleQuote(rev.username, rev.comment)} style={smallActionLink}>Цитата</button>
                              {allReviews.filter(reply => reply.parent_id === rev.id).map(reply => (
                                  <div key={reply.id} style={{marginLeft: '40px', marginTop: '15px', paddingLeft: '15px', borderLeft: '2px solid var(--border-color)'}}>
                                      <span style={commentUser}>{reply.username}</span>
                                      <p style={commentText}>{reply.comment}</p>
                                  </div>
                              ))}
                              <button onClick={() => setReplyTo(rev.id)} style={{...smallActionLink, marginLeft: '10px'}}>Відповісти</button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

// Стили
const backBtnStyle = { background: 'none', border: 'none', color: 'var(--secondary-brown)', cursor: 'pointer', fontSize: '16px' };
const topSection = { display: 'flex', gap: '50px', marginBottom: '40px', flexWrap: 'wrap' };
const imageSide = { flex: '0 0 280px' };
const mainImage = { width: '100%', borderRadius: '8px', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' };
const infoSide = { flex: '1', textAlign: 'left' };
const bookTitle = { fontSize: '34px', margin: '0', fontWeight: 'bold' };
const bookSubtitle = { fontSize: '19px', margin: '5px 0 20px 0' };
const ratingContainer = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px', borderRadius: '8px' };
const specsTable = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' };
const specRow = { display: 'flex' };
const specLabel = { width: '120px', fontWeight: '500' };
const specValue = { fontWeight: '400' };
const readActionBtn = { color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const favoriteBtn = (active, dark) => ({ backgroundColor: active ? 'var(--secondary-brown)' : 'transparent', color: active ? '#fff' : 'var(--secondary-brown)', border: '2px solid var(--secondary-brown)', padding: '13px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' });
const sectionHeader = { fontSize: '22px', borderBottom: '2px solid', width: 'fit-content', paddingBottom: '5px', marginBottom: '20px', textTransform: 'uppercase' };
const descriptionSection = { marginTop: '40px' };
const descriptionText = { lineHeight: '1.7', whiteSpace: 'pre-wrap', textAlign: 'left' };

const professionalReaderWrapper = { borderRadius: '16px', padding: '30px 20px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' };
const navArrowStyle = { background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#fff', fontSize: '36px', width: '46px', height: '46px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' };
const pagePaperStyle = { borderLeft: '1px solid rgba(0,0,0,0.12)', borderRight: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 10px 0 15px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.15)', boxSizing: 'border-box' };
const pageInnerContentStyle = { padding: '35px 30px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' };
const textStyle = { fontSize: '15px', lineHeight: '1.65', textAlign: 'justify', margin: 0, fontFamily: '"Georgia", serif', whiteSpace: 'pre-wrap' };
const pageNumberStyle = { display: 'block', width: '100%', textAlign: 'center', color: '#8b827e', fontSize: '12px', fontWeight: '600' };

const commentsSection = { marginTop: '50px' }; 
const commentForm = { display: 'flex', flexDirection: 'column', gap: '10px' };
const textAreaStyle = { width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid', minHeight: '120px', boxSizing: 'border-box' };
const sendCommentBtn = { padding: '12px 28px', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };
const commentCard = { display: 'flex', gap: '15px', padding: '20px 0' };
const commentAvatar = { width: '45px', height: '45px', color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' };
const commentUser = { fontWeight: 'bold' };
const commentText = { marginTop: '5px', textAlign: 'left' };
const starsLabel = { color: '#f1c40f', fontSize: '14px', marginLeft: '10px' };
const reactionWrapper = { display: 'flex', alignItems: 'center', borderRadius: '20px', padding: '2px 10px' };
const reactionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'inherit' };
const smallActionLink = { background: 'none', border: 'none', color: 'var(--secondary-brown)', fontSize: '13px', cursor: 'pointer' };
const replyStatusStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', marginBottom: '10px' };
const statusPanelSide = { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '15px', borderRadius: '10px' };
const statusBtnStyle = (color, isActive, dark) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  backgroundColor: isActive ? color : (dark ? '#333' : '#fff'), color: isActive ? '#fff' : (dark ? '#bbb' : '#555'),
});
const bottomActionsBar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', padding: '15px 10px 0', borderTop: '1px solid' };
const bookReactionContainerBottom = { display: 'flex', gap: '12px' };
const bookReactionBtn = (isActive, color, dark) => ({
  display: 'flex', alignItems: 'center', padding: '6px 16px', borderRadius: '20px', border: isActive ? `2px solid ${color}` : `1px solid var(--border-color)`, backgroundColor: isActive ? `${color}20` : 'var(--input-bg)', color: isActive ? color : 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold'
});
const ratingValue = { fontWeight: 'bold', fontSize: '18px' };
const votesCount = { fontSize: '12px' };
const bookPlaceholder = { height: '200px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px dashed #ccc' };

export default BookDetail;