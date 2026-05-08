import React, { useState, useEffect, useRef } from 'react'; 
import { useNavigate, useParams, Link } from 'react-router-dom';

const Profile = ({ socket }) => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 
  
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [profileData, setProfileData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarHover, setAvatarHover] = useState(false);

  const [currentTab, setCurrentTab] = useState('reading'); 
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const targetId = id || currentUser?.id;
      if (!targetId) { setLoading(false); return; }
      try {
        const response = await fetch(`https://library-backend-0q6b.onrender.com/users/${targetId}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setIsOnline(data.is_online); 
        }
      } catch (err) { console.error("Ошибка профиля:", err); } finally { setLoading(false); }
    };
    fetchProfile();
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
      } catch (err) { console.error("Ошибка загрузки книг:", err); } finally { setBooksLoading(false); }
    };
    fetchUserBooks();
  }, [currentTab, id]);

  const handleUpdateStatus = async (bookId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/users/books/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, bookId, status: newStatus })
      });
      if (response.ok) {
        setBooks(prev => prev.filter(b => b.id !== bookId));
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
        if (currentUser && profileData.id === currentUser.id) {
          localStorage.setItem('user', JSON.stringify({ ...currentUser, avatar_url: data.avatar_url }));
        }
      }
    } catch (err) { console.error("Ошибка аватара:", err); }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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

  // --- ИКОНКИ ---
  const LikeIcon = ({ color }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} style={{marginBottom: '5px'}}><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
  );
  const DislikeIcon = ({ color }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} style={{marginBottom: '5px'}}><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.37-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>
  );
  const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  );
  const ReadingIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
  );
  const PlannedIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  );
  const DroppedIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
  const EditIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  );

  if (loading) return <div style={pageWrapper}><p style={{textAlign:'center'}}>Завантаження...</p></div>;
  if (!profileData) return <div style={pageWrapper}><div style={containerStyle}><p style={{ textAlign: 'center' }}>Користувача не знайдено.</p></div></div>;

  const isOwnProfile = currentUser && profileData.id === currentUser.id;

  return (
    <div style={pageWrapper}>
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
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px', opacity: (isOwnProfile && avatarHover) ? 0.6 : 1, transition: '0.3s ease' }} 
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
          <div style={statCard} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <span style={statValue}>{profileData.completed_count || 0}</span>
            <span style={statLabel}>Прочитано книг</span>
          </div>
          <div style={statCard} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <span style={statValue}>0</span>
            <span style={statLabel}>Друзі</span>
          </div>
          <div style={smallStatCard} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <span style={{...statValue, color: '#2ecc71'}}>{profileData.total_likes || 0}</span>
            <div style={subLabel}><LikeIcon color="#2ecc71" />Подобається</div>
          </div>
          <div style={smallStatCard} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <span style={{...statValue, color: '#e74c3c'}}>0</span>
            <div style={subLabel}><DislikeIcon color="#e74c3c" />Не подобається</div>
          </div>
          <div style={statCard} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <span style={statValue}>{profileData.reviews_count || 0}</span>
            <span style={statLabel}>Написано відгуків</span>
          </div>
        </div>

        <div style={bottomSection}>
          <div style={tabsHeader}>
            {['reading', 'completed', 'planned', 'dropped'].map(t => (
              <span key={t} onClick={() => setCurrentTab(t)} style={currentTab === t ? activeTab : tab}>
                {t === 'reading' ? 'Читаю зараз' : t === 'completed' ? 'Прочитано' : t === 'planned' ? 'Заплановано' : 'Кинуто'}
              </span>
            ))}
          </div>

          <div style={contentBox}>
            {booksLoading ? (
              <p style={{ textAlign: 'center', opacity: 0.5 }}>Завантаження...</p>
            ) : books.length > 0 ? (
              books.map(book => (
                <div key={book.id} style={bookRowStyle}>
                  <Link to={`/book/${book.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flex: 1 }}>
                    <img src={book.image_url || "https://kappa.lol/pAubra"} alt={book.title} style={bookRowImage} />
                    <div style={bookRowTextInfo}>
                      <div style={{ fontWeight: 'bold', color: '#2c1e1a' }}>{book.title}</div>
                      <div style={{ fontSize: '14px', color: '#8d6e63' }}>{book.author}</div>
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
              <p style={{ opacity: 0.5, textAlign: 'center' }}>Список порожній</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const pageWrapper = { backgroundColor: '#fcfaf9', minHeight: '100vh', padding: '40px 20px' };
const containerStyle = { maxWidth: '1100px', margin: '0 auto' };
const genreTitleStyle = { fontSize: '28px', color: '#2c1e1a', fontWeight: 'bold', textTransform: 'uppercase' };
const underlineStyle = { height: '4px', width: '60px', background: '#8d6e63', margin: '0 auto', borderRadius: '2px' };
const profileHeaderCard = { backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #eee' };
const bannerArea = { height: '180px', background: 'linear-gradient(135deg, #4b3832 0%, #8d6e63 100%)' };
const userMainInfo = { display: 'flex', padding: '0 40px 30px 40px', marginTop: '-50px', alignItems: 'flex-end', gap: '30px', flexWrap: 'wrap' };
const avatarContainer = { width: '140px', height: '140px', borderRadius: '20px', backgroundColor: '#333', border: '6px solid #fff', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' };
const avatarPlaceholder = { fontSize: '60px', color: '#8d6e63', fontWeight: 'bold' };
const uploadOverlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' };

const textInfo = { display: 'flex', flexDirection: 'column', paddingBottom: '10px', alignItems: 'flex-start' };
const userName = { margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#2c1e1a', padding: '0', textAlign: 'left' };
const statusWrapper = { display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' };
const userRole = { margin: '0', color: '#8d6e63', fontWeight: '500', fontSize: '15px' };

const statusBadge = (on) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${on ? '#2ecc71' : '#e74c3c'}`, color: on ? '#27ae60' : '#c0392b', fontSize: '12px', fontWeight: 'bold', backgroundColor: on ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' });
const statusDot = (on) => ({ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: on ? '#2ecc71' : '#e74c3c' });
const actionButtons = { display: 'flex', gap: '12px', paddingBottom: '10px', marginLeft: 'auto' };
const editBtn = { padding: '10px 25px', backgroundColor: '#8d6e63', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const logoutBtn = { padding: '10px 25px', backgroundColor: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '40px' };
const statCard = { backgroundColor: '#fff', height: '140px', borderRadius: '15px', textAlign: 'center', borderBottom: '4px solid #8d6e63', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: '0.3s', cursor: 'default' };
const smallStatCard = { ...statCard, padding: '10px' };
const statValue = { fontSize: '24px', fontWeight: 'bold', color: '#2c1e1a' };
const statLabel = { fontSize: '11px', fontWeight: 'bold', color: '#8d6e63', textTransform: 'uppercase', marginTop: '8px' };
const subLabel = { fontSize: '10px', fontWeight: 'bold', color: '#8d6e63', textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '5px' };

const bottomSection = { backgroundColor: '#fff', borderRadius: '15px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' };
const tabsHeader = { display: 'flex', gap: '30px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px', marginBottom: '25px' };
const tab = { color: '#999', cursor: 'pointer', fontWeight: '500', paddingBottom: '13px', borderBottom: '3px solid transparent', transition: '0.2s' };
const activeTab = { ...tab, color: '#8d6e63', borderBottom: '3px solid #8d6e63', fontWeight: 'bold' };

const contentBox = { display: 'flex', flexDirection: 'column', gap: '10px' };
const bookRowStyle = { display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee' };
const bookRowImage = { width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px' };
const bookRowTextInfo = { marginLeft: '20px' };
const actionIconsContainer = { display: 'flex', gap: '10px', marginLeft: 'auto' };
const iconBtnStyle = { background: '#f8f8f8', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default Profile;