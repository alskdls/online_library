import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [formData, setFormData] = useState({
    title: '', author: '', description: '', pages: '', genre_id: '', image_url: '', price: '', year: ''
  });

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch('http://localhost:5000/genres').then(res => res.json()).then(data => setGenres(data));
    
    fetch(`http://localhost:5000/books`).then(res => res.json()).then(data => {
      const bookToEdit = data.find(b => b.id === parseInt(id));
      if (bookToEdit) setFormData(bookToEdit);
    });
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(`http://localhost:5000/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, userRole: user?.role })
    });

    if (response.ok) {
      alert("Зміни збережено!");
      navigate('/');
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: 'var(--text-main)' }}>Редагувати книгу</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input name="title" value={formData.title} onChange={handleChange} required style={inputStyle} placeholder="Назва" />
        <input name="author" value={formData.author} onChange={handleChange} required style={inputStyle} placeholder="Автор" />
        <select name="genre_id" value={formData.genre_id} onChange={handleChange} style={inputStyle}>
          {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <textarea name="description" value={formData.description} onChange={handleChange} style={textareaStyle} placeholder="Опис" />
        <input name="year" type="number" value={formData.year || ''} onChange={handleChange} style={inputStyle} placeholder="Рік" />
        <input name="price" type="number" value={formData.price || ''} onChange={handleChange} style={inputStyle} placeholder="Ціна" />
        <input name="image_url" value={formData.image_url} onChange={handleChange} style={inputStyle} placeholder="Посилання на фото" />
        <button type="submit" style={buttonStyle}>Оновити дані</button>
      </form>
    </div>
  );
};

const containerStyle = { 
  maxWidth: '450px', 
  margin: '50px auto', 
  padding: '30px', 
  background: 'var(--card-bg)', 
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
};

const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };

const inputStyle = { 
  padding: '12px', 
  borderRadius: '8px', 
  border: '1px solid var(--border-color)', 
  background: 'var(--bg-color)', 
  color: 'var(--text-main)',
  outline: 'none'
};

const textareaStyle = { ...inputStyle, height: '100px', resize: 'vertical' };

const buttonStyle = { 
  padding: '14px', 
  background: 'var(--accent)', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontWeight: 'bold',
  transition: '0.3s'
};

export default EditBook;