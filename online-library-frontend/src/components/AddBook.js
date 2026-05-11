import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddBook = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genreId, setGenreId] = useState('');
  const [pages, setPages] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [bookFile, setBookFile] = useState(null); // Нове поле для файлу
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/genres')
      .then(res => setGenres(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Створюємо FormData замість звичайного об'єкта
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('genre_id', parseInt(genreId));
    formData.append('pages', parseInt(pages) || 0);
    formData.append('description', description);
    formData.append('image_url', imageUrl);
    formData.append('year', parseInt(year) || null);
    formData.append('price', parseFloat(price) || 0);
    formData.append('userRole', 'admin');
    
    if (bookFile) {
      formData.append('bookFile', bookFile); // Ключ має збігатися з тим, що в multer: upload.single('bookFile')
    }

    try {
      await axios.post('http://localhost:5000/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Важливо для завантаження файлів
        }
      });
      alert('Книгу успішно додано!');
      
      // Скидання всіх полів
      setTitle('');
      setAuthor('');
      setGenreId('');
      setPages('');
      setDescription('');
      setImageUrl('');
      setYear('');
      setPrice('');
      setBookFile(null);
    } catch (err) {
      console.error(err);
      alert('Помилка при додаванні книги');
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Додати нову книгу</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={rowStyle}>
          <input 
            style={inputStyle} 
            type="text" 
            placeholder="Назва книги" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
          <input 
            style={inputStyle} 
            type="text" 
            placeholder="Автор" 
            value={author} 
            onChange={(e) => setAuthor(e.target.value)} 
            required 
          />
        </div>

        <div style={rowStyle}>
          <select 
            style={inputStyle} 
            value={genreId} 
            onChange={(e) => setGenreId(e.target.value)} 
            required
          >
            <option value="">Оберіть жанр</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input 
            style={inputStyle} 
            type="number" 
            placeholder="Рік видання" 
            value={year} 
            onChange={(e) => setYear(e.target.value)} 
          />
        </div>

        <div style={rowStyle}>
          <input 
            style={inputStyle} 
            type="number" 
            placeholder="Кількість сторінок" 
            value={pages} 
            onChange={(e) => setPages(e.target.value)} 
          />
          <input 
            style={inputStyle} 
            type="number" 
            placeholder="Ціна" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
          />
        </div>

        <input 
          style={inputStyle} 
          type="text" 
          placeholder="URL обкладинки" 
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
        />

        <textarea 
          style={textAreaStyle} 
          placeholder="Анотація (короткий опис)" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required
        />

        {/* Новий блок для завантаження файлу замість текстового поля */}
        <div style={{ marginTop: '10px', padding: '15px', border: '2px dashed #3498db', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <label style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
            Завантажити файл книги (PDF, EPUB):
          </label>
          <input 
            type="file" 
            accept=".pdf,.epub" 
            onChange={(e) => setBookFile(e.target.files[0])} 
          />
        </div>

        <button type="submit" style={submitBtnStyle}>Опублікувати книгу</button>
      </form>
    </div>
  );
};

const containerStyle = { maxWidth: '800px', margin: '40px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' };
const headerStyle = { textAlign: 'center', color: '#2c3e50', marginBottom: '30px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const rowStyle = { display: 'flex', gap: '15px' };
const inputStyle = { flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' };
const textAreaStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const submitBtnStyle = { backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '15px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', marginTop: '10px' };

export default AddBook;