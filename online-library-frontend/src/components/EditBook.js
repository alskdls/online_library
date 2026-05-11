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
    // 1. Завантажуємо жанри
    fetch('http://localhost:5000/genres').then(res => res.json()).then(data => setGenres(data));
    
    // 2. Завантажуємо дані поточної книги
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
      <h2 style={{ textAlign: 'center' }}>Редагувати книгу</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input name="title" value={formData.title} onChange={handleChange} required style={inputStyle} />
        <input name="author" value={formData.author} onChange={handleChange} required style={inputStyle} />
        <select name="genre_id" value={formData.genre_id} onChange={handleChange} style={inputStyle}>
          {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <textarea name="description" value={formData.description} onChange={handleChange} style={textareaStyle} />
        <input name="year" type="number" value={formData.year || ''} onChange={handleChange} style={inputStyle} placeholder="Рік" />
        <input name="price" type="number" value={formData.price || ''} onChange={handleChange} style={inputStyle} placeholder="Ціна" />
        <input name="image_url" value={formData.image_url} onChange={handleChange} style={inputStyle} placeholder="Посилання на фото" />
        <button type="submit" style={buttonStyle}>Оновити дані</button>
      </form>
    </div>
  );
};

// Стилі такі ж, як в AddBook
const containerStyle = { maxWidth: '450px', margin: '50px auto', padding: '30px', background: '#f9f9f9', borderRadius: '12px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd' };
const textareaStyle = { ...inputStyle, height: '100px' };
const buttonStyle = { padding: '14px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default EditBook;