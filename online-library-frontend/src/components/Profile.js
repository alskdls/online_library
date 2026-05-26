import React, { useState, useEffect, useRef } from 'react'; 
import { useNavigate, useParams, Link } from 'react-router-dom';

const Profile = ({ socket }) => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 
  const booksSectionRef = useRef(null); 
  
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [profileData, setProfileData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarHover, setAvatarHover] = useState(false);

  const [currentTab, setCurrentTab] = useState('reading'); 
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  const [modal, setModal] = useState({ isOpen: false, type: null, data: [], loading: false });
  const [counts, setCounts] = useState({ reading: 0, completed: 0, planned: 0, dropped: 0 });

  // Синхронизация темы для внутренних элементов
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const syncTheme = () => {
      const currentTheme = localStorage.getItem('theme') || 'light';
      if (currentTheme !== themeMode) setThemeMode(currentTheme);
    };
    const interval = setInterval(syncTheme, 100);
    return () => clearInterval(interval);
  }, [themeMode]);

  const isDarkMode = themeMode === 'dark';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const targetId = id || currentUser?.id;
      if (!targetId) { setLoading(false); return; }
      try {
        const response = await fetch(`http://localhost:5000/users/${targetId}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setIsOnline(data.is_online); 
        }
      } catch (err) { console.error("Ошибка профиля:", err); } 
      finally { setLoading(false); }
    };
    fetchProfile();
    fetchCounts(); 
  }, [id, currentUser?.id]);

  useEffect(() => {
    const fetchUserBooks = async () => {
      const targetId = id || currentUser?.id;
      if (!targetId) return;
      setBooksLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/users/${targetId}/books?status=${currentTab}`);
        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        }
      } catch (err) { console.error("Ошибка книг:", err); } 
      finally { setBooksLoading(false); }
    };
    fetchUserBooks();
  }, [currentTab, id]);

  const fetchCounts = async () => {
    const targetId = id || currentUser?.id;
    if (!targetId) return;
    try {
      const res = await fetch(`http://localhost:5000/users/${targetId}/book-counts`);
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch (err) { console.error("Ошибка счетчиков:", err); }
  };

  const scrollToCompleted = () => {
    setCurrentTab('completed');
    setTimeout(() => {
      booksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 10);
  };

  const openModal = async (type) => {
    const targetId = id || currentUser?.id;
    setModal({ isOpen: true, type, data: [], loading: true });
    try {
      let url = `http://localhost:5000/users/${targetId}/reactions?type=${type}`;
      if (type === 'friends') url = `http://localhost:5000/users/${targetId}/friends`;
      if (type === 'reviews') url = `http://localhost:5000/users/${targetId}/reviews-list`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setModal(prev => ({ ...prev, data, loading: false }));
      }
    } catch (err) {
      console.error(`Ошибка загрузки ${type}:`, err);
      setModal(prev => ({ ...prev, loading: false }));
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: null, data: [], loading: false });

  const handleUpdateStatus = async (bookId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/users/books/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, bookId, status: newStatus })
      });
      if (response.ok) {
        setBooks(prev => prev.filter(b => b.id !== bookId));
        fetchCounts();
      }
    } catch (err) { console.error("Ошибка статуса:", err); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`http://localhost:5000/users/${profileData.id}/avatar`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(prev => ({ ...prev, avatar_url: data.avatar_url }));
        const updatedUser = { ...currentUser, avatar_url: data.avatar_url };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('userUpdate'));
      }
    } catch (err) { console.error("Ошибка аватара:", err); }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-5px)';
    e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.1)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.05)';
  };

  const LikeIcon = ({ color, style }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} style={{...style}}><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
  );
  const DislikeIcon = ({ color, style }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} style={{...style}}><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.37-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>
  );
  const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
  const ReadingIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
  const PlannedIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
  const DroppedIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
  const EditIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

  if (loading) return <div style={{...pageWrapper, background: 'transparent'}}><p style={{textAlign:'center', color: 'var(--text-main)'}}>Завантаження...</p></div>;
  if (!profileData) return <div style={{...pageWrapper, background: 'transparent'}}><div style={containerStyle}><p style={{ textAlign: 'center', color: 'var(--text-main)' }}>Користувача не знайдено.</p></div></div>;

  const isOwnProfile = currentUser && profileData.id === currentUser.id;

  return (
    <div style={{...pageWrapper, backgroundColor: 'transparent'}}>
      {/* Магия: делаем обертку прозрачной, чтобы была видна основа Home.js */}
      <style>{`
        body { transition: none !important; }
        * { transition: none !important; }
      `}</style>
      {modalAnimationStyles}
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={genreTitleStyle}>{isOwnProfile ? 'Мій профіль' : `Профіль ${profileData.username}`}</h2>
          <div style={underlineStyle}></div>
        </div>

        <div style={profileHeaderCard}>
          <div style={bannerArea}></div>
          <div style={userMainInfo}>
            <div 
              style={{...avatarContainer, cursor: isOwnProfile ? 'pointer' : 'default'}}
              onClick={() => isOwnProfile && fileInputRef.current.click()}
              onMouseEnter={() => isOwnProfile && setAvatarHover(true)}
              onMouseLeave={() => isOwnProfile && setAvatarHover(false)}
            >
              {profileData.avatar_url ? (
                <img 
                  src={`http://localhost:5000${profileData.avatar_url}`} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px', opacity: (isOwnProfile && avatarHover) ? 0.6 : 1 }} 
                />
              ) : (
                <div style={avatarPlaceholder}>{profileData.username?.charAt(0).toUpperCase()}</div>
              )}
              {isOwnProfile && avatarHover && <div style={uploadOverlay}><EditIcon /></div>}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{display: 'none'}} accept="image/*" />

            <div style={textInfo}>
              <h1 style={userName}>{profileData.username}</h1>
              <div style={statusWrapper}>
                <p style={userRole}>Група: {profileData.role === 'admin' ? 'Адміністратор' : 'Читач'}</p>
                <div style={statusBadge(isOnline)}>
                  <div style={statusDot(isOnline)}></div>
                  <span>{isOnline ? 'В мережі' : 'Офлайн'}</span>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div style={actionButtons}>
                <button onClick={() => navigate('/settings')} style={editBtn}>Редагувати</button>
                <button onClick={handleLogout} style={logoutBtn}>Вийти</button>
              </div>
            )}
          </div>
        </div>

        <div style={statsGrid}>
          <div style={{...statCard, cursor: 'pointer'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={scrollToCompleted}>
            <span style={statValue}>{counts.completed || 0}</span>
            <span style={statLabel}>Прочитано книг</span>
          </div>

          <div style={{...statCard, cursor: 'pointer'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={() => openModal('friends')}>
            <span style={statValue}>0</span>
            <span style={statLabel}>Друзі</span>
          </div>

          <div style={{...smallStatCard, cursor: 'pointer'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={() => openModal('like')}>
            <span style={{...statValue, color: '#2ecc71'}}>{profileData.total_likes || 0}</span>
            <div style={subLabel}><LikeIcon color="#2ecc71" style={{marginBottom: '5px'}}/>Подобається</div>
          </div>

          <div style={{...smallStatCard, cursor: 'pointer'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={() => openModal('dislike')}>
            <span style={{...statValue, color: '#e74c3c'}}>{profileData.total_dislikes || 0}</span>
            <div style={subLabel}><DislikeIcon color="#e74c3c" style={{marginBottom: '5px'}}/>Не подобається</div>
          </div>

          <div style={{...statCard, cursor: 'pointer'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={() => openModal('reviews')}>
            <span style={statValue}>{profileData.reviews_count || 0}</span>
            <span style={statLabel}>Написано відгуків</span>
          </div>
        </div>

        <div style={bottomSection} ref={booksSectionRef}>
          <div style={tabsHeader}>
            {[
              { id: 'reading', label: 'Читаю зараз' },
              { id: 'completed', label: 'Прочитано' },
              { id: 'planned', label: 'Заплановано' },
              { id: 'dropped', label: 'Кинуто' }
            ].map(t => (
              <div key={t.id} onClick={() => setCurrentTab(t.id)} style={currentTab === t.id ? activeTab : tab}>
                {t.label}
                <span style={badgeStyle(currentTab === t.id)}>{counts[t.id] || 0}</span>
              </div>
            ))}
          </div>

          <div style={contentBox}>
            {booksLoading ? (
              <p style={{ textAlign: 'center', opacity: 0.5, color: 'var(--text-main)' }}>Завантаження...</p>
            ) : books.length > 0 ? (
              books.map(book => (
                <div key={book.id} style={bookRowStyle}>
                  <Link to={`/book/${book.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flex: 1 }}>
                    <img src={book.image_url || "https://kappa.lol/pAubra"} alt="" style={bookRowImage} />
                    <div style={bookRowTextInfo}>
                      <div style={bookTitleStyle}>{book.title}</div>
                      <div style={bookAuthorStyle}>{book.author}</div>
                    </div>
                  </Link>
                  {isOwnProfile && (
                    <div style={actionIconsContainer}>
                       {currentTab !== 'completed' && <button onClick={() => handleUpdateStatus(book.id, 'completed')} style={iconBtnStyle} title="Прочитано"><CheckIcon/></button>}
                       {currentTab !== 'reading' && <button onClick={() => handleUpdateStatus(book.id, 'reading')} style={iconBtnStyle} title="Читаю"><ReadingIcon/></button>}
                       {currentTab !== 'planned' && <button onClick={() => handleUpdateStatus(book.id, 'planned')} style={iconBtnStyle} title="У плани"><PlannedIcon/></button>}
                       {currentTab !== 'dropped' && <button onClick={() => handleUpdateStatus(book.id, 'dropped')} style={iconBtnStyle} title="Кинуто"><DroppedIcon/></button>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ opacity: 0.5, textAlign: 'center', color: 'var(--text-main)' }}>Список порожній</p>
            )}
          </div>
        </div>

        {modal.isOpen && (
          <div style={overlayStyle} onClick={closeModal} className="modal-overlay">
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
              <button style={closeBtnStyle} onClick={closeModal}>✕</button>
              <div style={modalHeader}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  {modal.type === 'like' && <LikeIcon color="#2ecc71" />}
                  {modal.type === 'dislike' && <DislikeIcon color="#e74c3c" />}
                  <h3 style={{margin: 0, color: 'var(--text-main)', fontSize: '18px'}}>
                    {modal.type === 'like' && 'Подобається'}
                    {modal.type === 'dislike' && 'Не подобається'}
                    {modal.type === 'friends' && 'Список друзів'}
                    {modal.type === 'reviews' && 'Мої відгуки'}
                  </h3>
                </div>
              </div>

              <div style={modalBody} className="modal-body-scroll">
                {modal.loading ? (
                  <p style={{textAlign: 'center', padding: '20px', opacity: 0.5, color: 'var(--text-main)'}}>Завантаження...</p>
                ) : modal.data.length > 0 ? (
                  modal.data.map((item, index) => (
                    <Link 
                      key={index} 
                      to={item.book_id ? `/book/${item.book_id}` : `/user/${item.id}`} 
                      onClick={closeModal} 
                      style={modal.type === 'reviews' ? reviewCardStyle : modalBookItem}
                    >
                      <img src={item.image_url || item.avatar_url || "https://kappa.lol/pAubra"} alt="" style={modalBookCover} />
                      <div style={modalBookTextInfo}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                          <div style={modalBookTitle}>{item.title || item.username}</div>
                          {item.created_at && (
                            <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {modal.type === 'reviews' ? (
                          <div style={reviewTextStyle}>"{item.review_text}"</div>
                        ) : (
                          <div style={modalBookAuthor}>{item.author || (item.is_online ? 'В мережі' : 'Офлайн')}</div>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>Список порожній</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Стили - ВОЗВРАЩАЕМ БЛОКИ, но убираем фон у pageWrapper
const pageWrapper = { minHeight: '100vh', padding: '40px 20px' };
const containerStyle = { maxWidth: '1100px', margin: '0 auto' };
const genreTitleStyle = { fontSize: '28px', color: 'var(--text-main)', fontWeight: 'bold', textTransform: 'uppercase' };
const underlineStyle = { height: '4px', width: '60px', background: 'var(--accent)', margin: '0 auto', borderRadius: '2px' };
const profileHeaderCard = { backgroundColor: 'var(--card-bg)', borderRadius: '15px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid var(--border-color)' };
const bannerArea = { height: '180px', background: 'linear-gradient(135deg, #4b3832 0%, var(--accent) 100%)' };
const userMainInfo = { display: 'flex', padding: '0 40px 30px 40px', marginTop: '-50px', alignItems: 'flex-end', gap: '30px', flexWrap: 'wrap' };
const avatarContainer = { width: '140px', height: '140px', borderRadius: '20px', backgroundColor: '#333', border: '6px solid var(--card-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' };
const avatarPlaceholder = { fontSize: '60px', color: 'var(--accent)', fontWeight: 'bold' };
const uploadOverlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' };
const textInfo = { display: 'flex', flexDirection: 'column', paddingBottom: '10px', alignItems: 'flex-start' };
const userName = { margin: '0', fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)' };
const statusWrapper = { display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' };
const userRole = { margin: '0', color: 'var(--accent)', fontWeight: '500', fontSize: '15px' };
const statusBadge = (on) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${on ? '#2ecc71' : '#e74c3c'}`, color: on ? '#27ae60' : '#c0392b', fontSize: '12px', fontWeight: 'bold', backgroundColor: on ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' });
const statusDot = (on) => ({ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: on ? '#2ecc71' : '#e74c3c' });
const actionButtons = { display: 'flex', gap: '12px', paddingBottom: '10px', marginLeft: 'auto' };
const editBtn = { padding: '10px 25px', backgroundColor: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const logoutBtn = { padding: '10px 25px', backgroundColor: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

const reviewCardStyle = { display: 'flex', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid var(--border-color)', textDecoration: 'none', transition: 'background 0.2s', borderRadius: '8px' };
const reviewTextStyle = { fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '8px', lineHeight: '1.4', backgroundColor: 'var(--bg-color)', padding: '8px', borderRadius: '6px', width: '100%', textAlign: 'left', display: 'block' };

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '40px' };
const statCard = { backgroundColor: 'var(--card-bg)', height: '140px', borderRadius: '15px', textAlign: 'center', borderBottom: '4px solid var(--accent)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: '0.3s' };
const smallStatCard = { ...statCard, padding: '10px' };
const statValue = { fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' };
const statLabel = { fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', marginTop: '8px' };
const subLabel = { fontSize: '10px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '5px' };

const bottomSection = { backgroundColor: 'var(--card-bg)', borderRadius: '15px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' };
const tabsHeader = { display: 'flex', gap: '30px', borderBottom: '2px solid var(--border-color)', paddingBottom: '15px', marginBottom: '25px' };
const tab = { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '500', paddingBottom: '13px', borderBottom: '3px solid transparent' };
const activeTab = { ...tab, color: 'var(--accent)', borderBottom: '3px solid var(--accent)', fontWeight: 'bold' };
const badgeStyle = (isActive) => ({ backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-color)', color: isActive ? '#fff' : 'var(--text-muted)', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' });
const contentBox = { display: 'flex', flexDirection: 'column', gap: '10px' };
const bookRowStyle = { display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border-color)' };
const bookRowImage = { width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px' };
const bookRowTextInfo = { marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' };
const bookTitleStyle = { fontWeight: 'bold', color: 'var(--text-main)' };
const bookAuthorStyle = { fontSize: '14px', color: 'var(--accent)' };
const actionIconsContainer = { display: 'flex', gap: '10px', marginLeft: 'auto' };
const iconBtnStyle = { background: 'var(--bg-color)', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: 'var(--text-muted)' };

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: 'var(--card-bg)', padding: '30px', borderRadius: '16px', width: '450px', maxWidth: '95%', maxHeight: '80vh', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' };
const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' };
const modalHeader = { borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' };
const modalBody = { overflowY: 'auto', flex: 1 };
const modalBookItem = { display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border-color)', textDecoration: 'none' };
const modalBookCover = { width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px' };
const modalBookTextInfo = { marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, textAlign: 'left' };
const modalBookTitle = { fontWeight: 'bold', color: 'var(--text-main)', fontSize: '15px' };
const modalBookAuthor = { fontSize: '13px', color: 'var(--accent)', marginTop: '2px' };

const modalAnimationStyles = (
  <style>
    {`
      html {scroll-behavior: smooth;}
      @keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .modal-overlay { animation: overlayFade 0.3s ease-out; backdrop-filter: blur(4px); }
      .modal-overlay > div { animation: modalSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
      .modal-body-scroll::-webkit-scrollbar { width: 6px; }
      .modal-body-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
    `}
  </style>
);

export default Profile;