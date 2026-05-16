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
  const [bookFile, setBookFile] = useState(null);
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/genres')
      .then(res => setGenres(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      formData.append('bookFile', bookFile);
    }

    try {
      await axios.post('http://localhost:5000/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Книгу успішно додано!');
      setTitle(''); setAuthor(''); setGenreId(''); setPages('');
      setDescription(''); setImageUrl(''); setYear(''); setPrice('');
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
            style={inputStyle} type="text" placeholder="Назва книги" 
            value={title} onChange={(e) => setTitle(e.target.value)} required 
          />
          <input 
            style={inputStyle} type="text" placeholder="Автор" 
            value={author} onChange={(e) => setAuthor(e.target.value)} required 
          />
        </div>

        <div style={rowStyle}>
          <select 
            style={inputStyle} value={genreId} 
            onChange={(e) => setGenreId(e.target.value)} required
          >
            <option value="">Оберіть жанр</option>
            {genres.map(g => (
              <option key={g.id} value={g.id} style={{background: 'var(--card-bg)', color: 'var(--text-main)'}}>{g.name}</option>
            ))}
          </select>
          <input 
            style={inputStyle} type="number" placeholder="Рік видання" 
            value={year} onChange={(e) => setYear(e.target.value)} 
          />
        </div>

        <div style={rowStyle}>
          <input 
            style={inputStyle} type="number" placeholder="Кількість сторінок" 
            value={pages} onChange={(e) => setPages(e.target.value)} 
          />
          <input 
            style={inputStyle} type="number" placeholder="Ціна" 
            value={price} onChange={(e) => setPrice(e.target.value)} 
          />
        </div>

        <input 
          style={inputStyle} type="text" placeholder="URL обкладинки" 
          value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} 
        />

        <textarea 
          style={textAreaStyle} placeholder="Анотація (короткий опис)" 
          value={description} onChange={(e) => setDescription(e.target.value)} required
        />

        <div style={fileUploadStyle}>
          <label style={fileLabelStyle}>
            Завантажити файл книги (PDF, EPUB):
          </label>
          <input 
            type="file" accept=".pdf,.epub" 
            onChange={(e) => setBookFile(e.target.files[0])} 
            style={{color: 'var(--text-main)'}}
          />
        </div>

        <button type="submit" style={submitBtnStyle}>Опублікувати книгу</button>
      </form>
    </div>
  );
};

const containerStyle = { 
  maxWidth: '800px', 
  margin: '40px auto', 
  padding: '30px', 
  backgroundColor: 'var(--card-bg)', 
  color: 'var(--text-main)',         
  borderRadius: '12px', 
  border: '1px solid var(--border-color)',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  transition: '0.3s'
};

const headerStyle = { textAlign: 'center', marginBottom: '30px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const rowStyle = { display: 'flex', gap: '15px' };

const inputStyle = { 
  flex: 1, 
  padding: '12px', 
  borderRadius: '8px', 
  border: '1px solid var(--border-color)', 
  backgroundColor: 'var(--bg-color)', 
  color: 'var(--text-main)', 
  fontSize: '15px', 
  outline: 'none',
  transition: '0.3s'
};

const textAreaStyle = { 
  width: '100%', 
  padding: '12px', 
  borderRadius: '8px', 
  border: '1px solid var(--border-color)', 
  backgroundColor: 'var(--bg-color)', 
  color: 'var(--text-main)', 
  minHeight: '120px', 
  fontSize: '15px', 
  outline: 'none', 
  fontFamily: 'inherit', 
  boxSizing: 'border-box',
  transition: '0.3s'
};

const fileUploadStyle = { 
  marginTop: '10px', 
  padding: '20px', 
  border: '2px dashed var(--border-color)', 
  borderRadius: '8px', 
  backgroundColor: 'var(--bg-color)' 
};

const fileLabelStyle = { 
  fontSize: '14px', 
  color: 'var(--text-muted)', 
  marginBottom: '8px', 
  display: 'block', 
  fontWeight: 'bold' 
};

const submitBtnStyle = { 
  backgroundColor: 'var(--accent)', 
  color: '#fff', 
  border: 'none', 
  padding: '15px', 
  borderRadius: '8px', 
  fontSize: '16px', 
  fontWeight: 'bold', 
  cursor: 'pointer', 
  transition: '0.3s' 
};

export default AddBook;