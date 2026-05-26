import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isChanged, setIsChanged] = useState(false);
  const [avatar, setAvatar] = useState(currentUser?.avatar_url ? `http://localhost:5000${currentUser.avatar_url}` : null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const EditIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  useEffect(() => {
    const hasChanges = formData.username !== currentUser?.username;
    setIsChanged(hasChanges);
  }, [formData.username, currentUser]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('avatar', file);

    try {
      const res = await fetch(`http://localhost:5000/users/${currentUser.id}/avatar`, {
        method: 'POST',
        body: data,
      });
      if (res.ok) {
        const result = await res.json();
        const newUrl = `http://localhost:5000${result.avatar_url}`;
        setAvatar(newUrl);
        const updatedUser = { ...currentUser, avatar_url: result.avatar_url };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('userUpdate'));
        setCurrentUser(updatedUser);
        setMsg({ text: 'Фото профілю оновлено', type: 'success' });
      }
    } catch (err) { setMsg({ text: 'Помилка завантаження', type: 'error' }); }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!isChanged) return;
    try {
      const res = await fetch(`http://localhost:5000/users/${currentUser.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, email: formData.email })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setMsg({ text: 'Дані успішно збережено', type: 'success' });
        setIsChanged(false);
      }
    } catch (err) { setMsg({ text: 'Помилка сервера', type: 'error' }); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!formData.oldPassword || !formData.newPassword) {
      setMsg({ text: 'Заповніть поля паролів', type: 'error' });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMsg({ text: 'Паролі не збігаються', type: 'error' });
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/users/${currentUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: formData.oldPassword, newPassword: formData.newPassword })
      });
      if (res.ok) {
        setMsg({ text: 'Пароль успішно змінено', type: 'success' });
        setFormData({ ...formData, oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMsg({ text: 'Поточний пароль вказано невірно', type: 'error' });
      }
    } catch (err) { setMsg({ text: 'Помилка сервера', type: 'error' }); }
  };

  const alertStyle = {
    ...alert,
    backgroundColor: msg.type === 'success' ? 'var(--card-bg)' : 'rgba(255, 0, 0, 0.1)',
    color: msg.type === 'success' ? '#27ae60' : '#e74c3c',
    border: `1px solid ${msg.type === 'success' ? '#27ae60' : '#e74c3c'}`
  };

  return (
    <div style={{...pageWrapper, backgroundColor: 'transparent'}}>
      {/* Убираем лишние транзиции, чтобы при смене темы фон не "лагал" */}
      <style>{`
        body { transition: none !important; }
      `}</style>
      
      <div style={container}>
        <div style={headerRow}>
          <button onClick={() => navigate(-1)} style={backBtn}>← Назад</button>
          <h2 style={mainTitle}>Налаштування профілю</h2>
        </div>

        {msg.text && (
          <div style={alertStyle}>
            {msg.text}
          </div>
        )}

        <div style={verticalStack}>
          
          <div style={wideCard}>
            <h3 style={cardTitle}>Фото профілю</h3>
            <div style={avatarRow}>
              <div 
                style={avatarContainerStyle} 
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => fileInputRef.current.click()}
              >
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar" 
                    style={{ ...squareImg, opacity: avatarHover ? 0.6 : 1 }} 
                  />
                ) : (
                  <div style={avatarPlaceholder}>{currentUser?.username?.charAt(0).toUpperCase()}</div>
                )}
                
                {avatarHover && (
                  <div style={uploadOverlayStyle}>
                    <EditIcon />
                  </div>
                )}
              </div>

              <div style={avatarInfo}>
                <button style={uploadLinkBtn} onClick={() => fileInputRef.current.click()}>
                  Змінити аватар
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                />
                <p style={subText}>Дозволені формати: JPG, PNG. Максимальний розмір 2MB.</p>
              </div>
            </div>
          </div>

          <form style={wideCard} onSubmit={handleUpdateInfo}>
            <h3 style={cardTitle}>Особиста інформація</h3>
            <div style={inputField}>
              <label style={label}>Нікнейм</label>
              <input 
                style={input} 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
              />
            </div>
            <div style={inputField}>
              <label style={label}>Електронна пошта</label>
              <input 
                style={disabledInput} 
                type="email" 
                value={formData.email} 
                readOnly 
                title="Зміна пошти недоступна"
              />
            </div>
            <button 
              type="submit" 
              style={{ ...saveBtn, opacity: isChanged ? 1 : 0.5, cursor: isChanged ? 'pointer' : 'not-allowed' }}
              disabled={!isChanged}
            >
              Зберегти зміни
            </button>
          </form>

          <form style={wideCard} onSubmit={handleChangePassword}>
            <h3 style={cardTitle}>Безпека та пароль</h3>
            <div style={inputField}>
              <label style={label}>Поточний пароль</label>
              <input 
                style={input} 
                type="password" 
                placeholder="Введіть ваш теперішній пароль"
                value={formData.oldPassword} 
                onChange={e => setFormData({...formData, oldPassword: e.target.value})} 
              />
            </div>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={label}>Новий пароль</label>
                <input 
                  style={input} 
                  type="password" 
                  placeholder="Новий пароль"
                  value={formData.newPassword} 
                  onChange={e => setFormData({...formData, newPassword: e.target.value})} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Підтвердження</label>
                <input 
                  style={input} 
                  type="password" 
                  placeholder="Повторіть пароль"
                  value={formData.confirmPassword} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                />
              </div>
            </div>
            <button type="submit" style={passBtn}>Оновити пароль</button>
          </form>

        </div>
      </div>
    </div>
  );
};

// --- Стили: pageWrapper теперь прозрачный ---
const pageWrapper = { minHeight: '100vh', padding: '40px 20px' };
const container = { maxWidth: '750px', margin: '0 auto' };
const headerRow = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' };
const mainTitle = { fontSize: '26px', color: 'var(--text-main)', fontWeight: 'bold', margin: 0 };
const backBtn = { background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', color: 'var(--accent)', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const verticalStack = { display: 'flex', flexDirection: 'column', gap: '25px' };
const wideCard = { backgroundColor: 'var(--card-bg)', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', transition: 'all 0.3s ease' };
const cardTitle = { fontSize: '18px', color: 'var(--text-main)', marginBottom: '25px', fontWeight: 'bold', borderBottom: '2px solid var(--bg-color)', paddingBottom: '10px' };
const inputField = { marginBottom: '20px' };
const gridRow = { display: 'flex', gap: '20px', marginBottom: '20px' };
const label = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' };
const input = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' };
const saveBtn = { padding: '14px 35px', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', transition: '0.3s' };
const passBtn = { ...saveBtn, backgroundColor: 'var(--text-main)', color: 'var(--card-bg)' };
const avatarRow = { display: 'flex', alignItems: 'center', gap: '30px' };
const avatarContainerStyle = { width: '130px', height: '130px', borderRadius: '20px', backgroundColor: 'var(--bg-color)', border: '6px solid var(--card-bg)', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', cursor: 'pointer' };
const squareImg = { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px', transition: '0.3s ease' };
const avatarPlaceholder = { fontSize: '50px', color: 'var(--accent)', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' };
const uploadOverlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' };
const avatarInfo = { display: 'flex', flexDirection: 'column', gap: '8px' };
const uploadLinkBtn = { background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', textDecoration: 'underline', padding: 0, textAlign: 'left' };
const subText = { fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' };
const alert = { padding: '15px 20px', borderRadius: '12px', marginBottom: '25px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' };

const disabledInput = { 
  ...input, 
  backgroundColor: 'var(--bg-color)', 
  color: 'var(--text-muted)', 
  cursor: 'not-allowed', 
  opacity: 0.6
};

export default Settings;