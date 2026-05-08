import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingData, setRatingData] = useState({ average_rating: 0, total_votes: 0 });
  const [userRating, setUserRating] = useState(0); 
  const [comment, setComment] = useState(""); 
  const [allReviews, setAllReviews] = useState([]); 
  const [hasVoted, setHasVoted] = useState(false);
  const [cooldown, setCooldown] = useState(0); 
  const [replyTo, setReplyTo] = useState(null); 
  
  // --- НОВОЕ: Состояние для статуса книги в списке пользователя ---
  const [currentStatus, setCurrentStatus] = useState(null);

  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;
  const user = JSON.parse(localStorage.getItem('user'));

  const formatDate = (dateString) => {
    if (!dateString) return "щойно";
    const options = { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  const fetchData = async () => {
    try {
      const booksRes = await axios.get(`https://library-backend-0q6b.onrender.com/books`);
      const foundBook = booksRes.data.find(b => b.id === parseInt(id));
      setBook(foundBook);

      const ratingRes = await axios.get(`https://library-backend-0q6b.onrender.com/books/${id}/rating`);
      setRatingData(ratingRes.data);

      const reviewsRes = await axios.get(`https://library-backend-0q6b.onrender.com/books/${id}/reviews`);
      setAllReviews(reviewsRes.data);

      if (user) {
        // Проверка рейтинга
        const myVote = reviewsRes.data.find(r => r.user_id === user.id && r.rating > 0);
        if (myVote) {
          setUserRating(myVote.rating);
          setHasVoted(true);
        }
        // Избранное
        const favRes = await axios.get(`https://library-backend-0q6b.onrender.com/favorites/${user.id}`);
        setIsFavorite(favRes.data.includes(parseInt(id)));

        // --- НОВОЕ: Получаем текущий статус книги (читаю/планирую и т.д.) ---
        const statusRes = await axios.get(`https://library-backend-0q6b.onrender.com/user-books/${user.id}/${id}`);
        if (statusRes.data) {
          setCurrentStatus(statusRes.data.status);
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // --- НОВОЕ: Обработчик изменения статуса (как в профиле) ---
  const handleStatusChange = async (newStatus) => {
    if (!user) return alert("Увійдіть в акаунт!");
    try {
      await axios.post(`https://library-backend-0q6b.onrender.com/user-books`, {
        userId: user.id,
        bookId: id,
        status: newStatus
      });
      setCurrentStatus(newStatus);
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
    }
  };

  const handleStarClick = async (val) => {
    if (!user) return alert("Увійдіть, щоб поставити оцінку!");
    if (hasVoted) return; 
    try {
      await axios.post('https://library-backend-0q6b.onrender.com/reviews', {
        userId: user.id, bookId: id, rating: val, comment: null 
      });
      setUserRating(val);
      setHasVoted(true);
      fetchData(); 
    } catch (err) { console.error(err); }
  };

  const handlePostComment = async () => {
    if (!userRating) return;
    if (!comment.trim()) return alert("Напишіть текст відгуку!");
    try {
      await axios.post('https://library-backend-0q6b.onrender.com/reviews', {
        userId: user.id, bookId: id, rating: userRating, comment: comment.trim(), parent_id: replyTo
      });
      setComment(""); setReplyTo(null); fetchData(); 
      alert(replyTo ? "Відповідь додано!" : "Відгук додано!");
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setCooldown(Math.ceil(err.response.data.retryAfter / 1000));
      } else { alert("Помилка при відправці коментаря"); }
    }
  };

  const handleFavoriteClick = async () => {
    if (!user) return alert("Будь ласка, увійдіть!");
    try {
      if (isFavorite) {
        await axios.delete('https://library-backend-0q6b.onrender.com/favorites', { data: { userId: user.id, bookId: book.id } });
      } else {
        await axios.post('https://library-backend-0q6b.onrender.com/favorites', { userId: user.id, bookId: book.id });
      }
      setIsFavorite(!isFavorite);
    } catch (err) { console.error("Помилка з обраним:", err); }
  };

  const handleReaction = async (commentId, type) => {
    if (!user) return alert("Увійдіть, щоб ставити реакції!");
    try {
      await axios.post(`https://library-backend-0q6b.onrender.com/comments/${commentId}/reaction`, { userId: user.id, type: type });
      fetchData(); 
    } catch (err) { console.error(err); }
  };

  const handleQuote = (username, text) => {
    setComment(`> ${username}: "${text}" \n\n${comment}`);
    document.getElementById('comment-textarea')?.focus();
  };

  if (!book) return <div style={loadingStyle}>Завантаження...</div>;

  const cover = (book.image_url && book.image_url !== "[null]" && book.image_url.trim() !== "") 
    ? book.image_url : "https://kappa.lol/pAubra";

  const isButtonActive = userRating > 0 && comment.trim().length > 0 && cooldown === 0;
  const isFileContent = book.content && book.content.startsWith('/uploads/');

  // Вспомогательные SVG
  const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  );

  return (
    <div className="page-wrapper-custom" style={pageWrapper}>
      <div style={containerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>← Назад до каталогу</button>

        <div style={topSection}>
          <div style={imageSide}>
            <img src={cover} alt={book.title} style={mainImage} />
            
            {/* --- НОВОЕ: Панель управления статусами под обложкой --- */}
            <div style={statusPanelSide}>
               <button 
                  onClick={() => handleStatusChange('completed')} 
                  style={statusBtnStyle('#27ae60', currentStatus === 'completed')}
               >
                  {currentStatus === 'completed' && <CheckIcon />} Прочитано
               </button>
               <button 
                  onClick={() => handleStatusChange('reading')} 
                  style={statusBtnStyle('#3498db', currentStatus === 'reading')}
               >
                  {currentStatus === 'reading' && <CheckIcon />} Читаю
               </button>
               <button 
                  onClick={() => handleStatusChange('planned')} 
                  style={statusBtnStyle('#f39c12', currentStatus === 'planned')}
               >
                  {currentStatus === 'planned' && <CheckIcon />} У плани
               </button>
               <button 
                  onClick={() => handleStatusChange('dropped')} 
                  style={statusBtnStyle('#e74c3c', currentStatus === 'dropped')}
               >
                  {currentStatus === 'dropped' && <CheckIcon />} Кинуто
               </button>
            </div>
          </div>

          <div style={infoSide}>
            <h1 style={bookTitle}>{book.title}</h1>
            <h2 style={bookSubtitle}>{book.author}</h2>

            <div style={ratingContainer}>
                <div style={{ display: 'flex', gap: '5px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                            key={star}
                            onClick={() => handleStarClick(star)}
                            style={{ 
                                cursor: hasVoted ? 'default' : 'pointer', 
                                color: star <= (userRating || Math.round(ratingData.average_rating)) ? '#f1c40f' : '#ccc',
                                fontSize: '28px',
                                opacity: hasVoted && star > userRating ? 0.4 : 1
                            }}
                        >★</span>
                    ))}
                </div>
                <div style={{marginLeft: '10px'}}>
                    <span style={ratingValue}>{ratingData.average_rating} / 5</span>
                    <div style={votesCount}>{ratingData.total_votes} голосів</div>
                </div>
            </div>

            <div style={specsTable}>
              <div style={specRow}><span style={specLabel}>Жанр:</span> <span style={specValue}>{book.genre_name}</span></div>
              <div style={specRow}><span style={specLabel}>Рік:</span> <span style={specValue}>{book.year || '—'}</span></div>
              <div style={specRow}><span style={specLabel}>Сторінок:</span> <span style={specValue}>{book.pages || '—'}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => document.getElementById('reader-section')?.scrollIntoView({ behavior: 'smooth' })} 
                  style={readActionBtn}
                >
                  ЧИТАТИ ОНЛАЙН 📖
                </button>
                <button onClick={handleFavoriteClick} style={favoriteBtn(isFavorite)}>
                  {isFavorite ? '★ У СПИСКУ' : '☆ В ОБРАНЕ'}
                </button>
            </div>
          </div>
        </div>

        {/* ... (остальная часть с описанием, читалкой и комментариями остается без изменений) ... */}
        <div style={descriptionSection}>
          <h3 style={sectionHeader}>Анотація</h3>
          <div style={descriptionText}>{book.description}</div>
        </div>

        <div id="reader-section" style={{ marginTop: '50px' }}>
            <h3 style={sectionHeader}>Читати «{book.title}» онлайн</h3>
            
            {book.content ? (
                isFileContent ? (
                  <div style={professionalReaderWrapper}>
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                      <div style={readerLayout}>
                        <div style={readerToolbar}>
                          <Toolbar>
                            {(props) => {
                              const {
                                CurrentPageInput, GoToNextPage, GoToPreviousPage, NumberOfPages,
                                Zoom, ZoomIn, ZoomOut, EnterFullScreen
                              } = props;
                              return (
                                <div style={toolbarFlex}>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <GoToPreviousPage />
                                    <div style={{ width: '40px' }}><CurrentPageInput /></div>
                                    <span style={{ margin: '0 5px' }}>/</span>
                                    <NumberOfPages />
                                    <GoToNextPage />
                                  </div>
                                  <div style={divider} />
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <ZoomOut />
                                    <Zoom />
                                    <ZoomIn />
                                  </div>
                                  <div style={divider} />
                                  <EnterFullScreen />
                                </div>
                              );
                            }}
                          </Toolbar>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <Viewer 
                            fileUrl={`https://library-backend-0q6b.onrender.com${book.content}`}
                            plugins={[toolbarPluginInstance]}
                          />
                        </div>
                      </div>
                    </Worker>
                  </div>
                ) : (
                  <div style={readerBoxStyle}>
                      {book.content}
                  </div>
                )
            ) : (
                <div style={bookPlaceholder}>
                    <div style={{ textAlign: 'center' }}>
                        <p>Контент книги поки що відсутній...</p>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>Додайте файл або текст через адмін-панель</span>
                    </div>
                </div>
            )}
        </div>

        <div style={commentsSection}>
            <h3 style={sectionHeader}>Відгуки користувачів</h3>
            
            {user ? (
                <div style={commentForm}>
                    {replyTo && (
                      <div style={replyStatusStyle}>
                        <div style={replyUserSide}>
                          Ви відповідаєте: <strong>{allReviews.find(r => r.id === replyTo)?.username}</strong>
                        </div>
                        <div style={replyActionSide}>
                          <button onClick={() => setReplyTo(null)} style={cancelReplyBtn}>Скасувати</button>
                        </div>
                      </div>
                    )}

                    <textarea 
                        id="comment-textarea"
                        placeholder="Ваш відгук..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={textAreaStyle}
                    />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                        <button 
                            onClick={handlePostComment}
                            disabled={!isButtonActive}
                            style={{
                                ...sendCommentBtn,
                                backgroundColor: isButtonActive ? '#2c1e1a' : '#ccc',
                                cursor: isButtonActive ? 'pointer' : 'not-allowed'
                            }}
                        >
                          {cooldown > 0 ? `ПАУЗА ${cooldown}с` : (replyTo ? 'ВІДПОВІСТИ' : 'ДОДАТИ КОМЕНТАР')}
                        </button>
                    </div>
                </div>
            ) : <p style={{ color: 'var(--text-muted)' }}>Увійдіть, щоб залишити відгук.</p>}

            <div style={{ marginTop: '30px' }}>
                {allReviews
                  .filter(rev => rev.comment && !rev.parent_id) 
                  .map((rev) => (
                    <div key={rev.id} style={{ marginBottom: '25px' }}>
                        <div style={commentCard}>
                            <div style={commentAvatar}>{rev.username[0].toUpperCase()}</div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span style={commentUser}>{rev.username}</span>
                                      <span style={starsLabel}>
                                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                      </span>
                                      <span style={dateStyle}>{formatDate(rev.created_at)}</span>
                                    </div>
                                    <div style={reactionWrapper}>
                                        <button onClick={() => handleReaction(rev.id, 'like')} style={reactionBtnStyle}>
                                            👍 <span style={countStyle}>{rev.likes_count || 0}</span>
                                        </button>
                                        <div style={separatorStyle}>|</div>
                                        <button onClick={() => handleReaction(rev.id, 'dislike')} style={reactionBtnStyle}>
                                            👎 <span style={countStyle}>{rev.dislikes_count || 0}</span>
                                        </button>
                                    </div>
                                </div>
                                <p style={commentText}>{rev.comment}</p>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                                    <button onClick={() => handleQuote(rev.username, rev.comment)} style={smallActionLink}>Цитата</button>
                                    <button 
                                        onClick={() => {
                                            setReplyTo(rev.id);
                                            document.getElementById('comment-textarea')?.focus();
                                        }} 
                                        style={smallActionLink}
                                    >Відповісти</button>
                                </div>
                            </div>
                        </div>

                        {allReviews
                            .filter(reply => reply.parent_id === rev.id)
                            .map(reply => (
                                <div key={reply.id} style={replyCardStyle}>
                                    <div style={{...commentAvatar, width: '32px', height: '32px', fontSize: '12px', backgroundColor: '#5d4037'}}>
                                        {reply.username[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{...commentUser, fontSize: '14px'}}>{reply.username}</span>
                                                <span style={{...dateStyle, marginLeft: '10px'}}>{formatDate(reply.created_at)}</span>
                                            </div>
                                        </div>
                                        <p style={{...commentText, fontSize: '14px', marginTop: '3px'}}>{reply.comment}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- СТИЛИ (Добавленные/Измененные) ---

const statusPanelSide = {
  marginTop: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '10px'
};

const statusBtnStyle = (color, isActive) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: '0.3s all',
  backgroundColor: isActive ? color : '#fff',
  color: isActive ? '#fff' : '#555',
  boxShadow: isActive ? `0 4px 10px ${color}44` : '0 2px 5px rgba(0,0,0,0.05)',
});

// Все остальные стили из твоего файла...
const pageWrapper = { backgroundColor: 'var(--bg-color)', minHeight: '100vh', padding: '40px 20px', color: 'var(--text-main)' };
const containerStyle = { maxWidth: '1000px', margin: '0 auto', backgroundColor: 'var(--card-bg, #fff)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };
const backBtnStyle = { background: 'none', border: 'none', color: '#8d6e63', cursor: 'pointer', marginBottom: '30px', fontSize: '16px', fontWeight: '500' };
const topSection = { display: 'flex', gap: '50px', marginBottom: '40px', flexWrap: 'wrap' };
const imageSide = { flex: '0 0 280px' };
const mainImage = { width: '100%', borderRadius: '8px', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' };
const infoSide = { flex: '1', textAlign: 'left' };
const bookTitle = { fontSize: '34px', margin: '0', color: 'var(--text-main)' };
const bookSubtitle = { fontSize: '19px', color: '#8d6e63', margin: '5px 0 20px 0' };
const ratingContainer = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', padding: '12px', backgroundColor: 'var(--hover-color, #f9f9f9)', borderRadius: '8px', width: 'fit-content' };
const specsTable = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' };
const specRow = { display: 'flex' };
const specLabel = { width: '120px', color: '#8d6e63', fontWeight: '500' };
const specValue = { fontWeight: '400', color: 'var(--text-main)' };
const readActionBtn = { backgroundColor: '#2c1e1a', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' };
const favoriteBtn = (active) => ({ backgroundColor: active ? '#8d6e63' : 'transparent', color: active ? '#fff' : '#8d6e63', border: '2px solid #8d6e63', padding: '13px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' });
const sectionHeader = { fontSize: '22px', borderBottom: '2px solid #8d6e63', width: 'fit-content', paddingBottom: '5px', marginBottom: '20px', color: 'var(--text-main)' };
const descriptionSection = { marginTop: '40px' };
const descriptionText = { lineHeight: '1.7', color: 'var(--text-main)', textAlign: 'left', whiteSpace: 'pre-wrap', opacity: 0.9 };
const professionalReaderWrapper = { boxShadow: '0 10px 40px rgba(0,0,0,0.1)', borderRadius: '12px', backgroundColor: '#2c1e1a', padding: '10px', marginTop: '20px' };
const readerLayout = { display: 'flex', flexDirection: 'column', height: '800px', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' };
const readerToolbar = { borderBottom: '1px solid #eee', padding: '5px 10px', backgroundColor: '#f9f9f9' };
const toolbarFlex = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' };
const divider = { borderLeft: '1px solid #ccc', height: '20px', margin: '0 10px' };
const readerBoxStyle = { padding: '30px', backgroundColor: '#fdfdfd', borderRadius: '10px', border: '1px solid #eee', lineHeight: '1.8', fontSize: '18px', color: '#333', textAlign: 'left', whiteSpace: 'pre-wrap', maxHeight: '600px', overflowY: 'auto', fontFamily: 'Georgia, serif' };
const commentsSection = { marginTop: '50px' };
const commentForm = { display: 'flex', flexDirection: 'column', gap: '10px' };
const textAreaStyle = { width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', minHeight: '120px', fontFamily: 'inherit', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const sendCommentBtn = { padding: '12px 28px', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', transition: '0.3s' };
const commentCard = { display: 'flex', gap: '15px', padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' };
const commentAvatar = { width: '45px', height: '45px', backgroundColor: '#2c1e1a', color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' };
const commentUser = { fontWeight: 'bold', color: 'var(--text-main)' };
const commentText = { color: 'var(--text-main)', marginTop: '5px', textAlign: 'left', opacity: 0.85 };
const starsLabel = { color: '#f1c40f', fontSize: '14px', marginLeft: '10px' };
const dateStyle = { color: '#8d6e63', fontSize: '12px', marginLeft: '15px', opacity: 0.7 };
const reactionWrapper = { display: 'flex', alignItems: 'center', backgroundColor: 'var(--hover-color, #f0f2f5)', borderRadius: '20px', padding: '2px 10px' };
const reactionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 8px', color: 'var(--text-main)' };
const smallActionLink = { background: 'none', border: 'none', color: '#8d6e63', fontSize: '13px', cursor: 'pointer', padding: '0', fontWeight: 'bold', textDecoration: 'underline', marginTop: '5px' };
const replyStatusStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', backgroundColor: '#f3ecea', padding: '12px 20px', borderRadius: '10px', borderLeft: '5px solid #2c1e1a' };
const replyUserSide = { fontSize: '13px', color: 'var(--text-main)' }; 
const replyActionSide = { flexShrink: 0 }; 
const replyCardStyle = { display: 'flex', gap: '12px', marginLeft: '55px', marginTop: '10px', padding: '12px', backgroundColor: 'var(--hover-color, #f8f9fa)', borderRadius: '8px', borderLeft: '3px solid #2c1e1a' };
const cancelReplyBtn = { background: '#fff', border: '1px solid #e74c3c', color: '#e74c3c', cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' };
const ratingValue = { fontWeight: 'bold', fontSize: '18px', color: 'var(--text-main)' };
const votesCount = { color: '#8d6e63', fontSize: '12px' };
const separatorStyle = { color: '#ccc', margin: '0 3px' };
const countStyle = { fontSize: '13px', fontWeight: 'bold' };
const bookPlaceholder = { height: '200px', backgroundColor: 'var(--hover-color)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '30px 0', border: '2px dashed #ccc', color: '#999' };
const loadingStyle = { textAlign: 'center', padding: '100px', color: 'var(--text-main)' };

export default BookDetail;