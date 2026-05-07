import React, { useState } from 'react';

const FiltersModal = ({ isOpen, onClose, genres, authors = [], onApplyFilters }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedYears, setSelectedYears] = useState({ from: '', to: '' });
  const [pageFilter, setPageFilter] = useState('');
  const [onlyWithImages, setOnlyWithImages] = useState(false);

  if (!isOpen) return null;

  const toggleSection = (section) => setActiveSection(activeSection === section ? null : section);

  const handleCheckboxChange = (id, list, setList) => {
    list.includes(id) ? setList(list.filter(item => item !== id)) : setList([...list, id]);
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSelectedAuthors([]);
    setPriceRange({ min: '', max: '' });
    setSelectedYears({ from: '', to: '' });
    setPageFilter('');
    setOnlyWithImages(false);
  };

  return (
    <div 
      style={overlayStyle} 
      onClick={onClose} 
      className="modal-overlay" 
    >
      {styleTag} 
      {modalAnimationStyles}

      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeBtnStyle} onClick={onClose}>✕</button>

        <div style={filterContainerStyle}>
          <FilterSection title="Жанри" id="genres" active={activeSection} onToggle={toggleSection}>
            {genres.map(g => (
              <label key={g.id} style={labelStyle}>
                <input type="checkbox" checked={selectedGenres.includes(g.id)} onChange={() => handleCheckboxChange(g.id, selectedGenres, setSelectedGenres)} /> {g.name}
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Автори" id="authors" active={activeSection} onToggle={toggleSection}>
            {authors.length > 0 ? authors.map(author => (
              <label key={author} style={labelStyle}>
                <input type="checkbox" checked={selectedAuthors.includes(author)} onChange={() => handleCheckboxChange(author, selectedAuthors, setSelectedAuthors)} /> {author}
              </label>
            )) : <p style={{fontSize: '12px'}}>Авторів не знайдено</p>}
          </FilterSection>

          <FilterSection title="Ціна (грн)" id="price" active={activeSection} onToggle={toggleSection}>
            <div style={{display: 'flex', gap: '5px'}}>
                <input type="number" placeholder="Від" style={inputStyle} value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} />
                <input type="number" placeholder="До" style={inputStyle} value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} />
            </div>
          </FilterSection>

          <FilterSection title="Рік видання" id="years" active={activeSection} onToggle={toggleSection}>
            <div style={{display: 'flex', gap: '5px'}}>
                <input type="number" placeholder="З" style={inputStyle} value={selectedYears.from} onChange={(e) => setSelectedYears({...selectedYears, from: e.target.value})} />
                <input type="number" placeholder="До" style={inputStyle} value={selectedYears.to} onChange={(e) => setSelectedYears({...selectedYears, to: e.target.value})} />
            </div>
          </FilterSection>

          <FilterSection title="Кількість сторінок" id="pages" active={activeSection} onToggle={toggleSection}>
            <select style={inputStyle} value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}>
              <option value="">Будь-яка</option>
              <option value="short">До 200 сторінок</option>
              <option value="medium">200-500 сторінок</option>
              <option value="long">Понад 500 сторінок</option>
            </select>
          </FilterSection>

          <label style={checkboxLabelStyle}>
             <input type="checkbox" checked={onlyWithImages} onChange={() => setOnlyWithImages(!onlyWithImages)} />
             Тільки з обкладинкою 📸
          </label>
        </div>

        <button 
          className="reset-button" 
          style={resetBtnStyle} 
          onClick={handleReset}
        >
          Скинути фільтри
        </button>

        <button 
          style={applyBtnStyle} 
          onClick={() => onApplyFilters({ selectedGenres, selectedAuthors, priceRange, selectedYears, pageFilter, onlyWithImages })}
        >
          Застосувати
        </button>
      </div>
    </div>
  );
};

const FilterSection = ({ title, id, active, onToggle, children }) => {
  const isOpen = active === id;
  
  return (
    <div style={filterSectionStyle}>
      <div style={sectionHeaderStyle} onClick={() => onToggle(id)}>
        <span style={{ color: isOpen ? 'var(--accent)' : 'inherit', transition: 'color 0.3s' }}>{title}</span>
        <span style={{ 
          transition: 'transform 0.3s ease', 
          color: isOpen ? 'var(--accent)' : '#ccc',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
        }}>▼</span>
      </div>
      
      <div style={{
        maxHeight: isOpen ? '400px' : '0',
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s ease-in-out, opacity 0.3s ease, margin 0.3s ease',
        marginTop: isOpen ? '10px' : '0'
      }}>
        <div style={dropdownListStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- ОНОВЛЕНІ СТИЛІ ---

const overlayStyle = { 
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
  backgroundColor: 'rgba(0, 0, 0, 0.4)', // Трохи світліший оверлей
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 
};

const modalStyle = { 
  backgroundColor: 'var(--card-bg)', 
  padding: '30px', 
  borderRadius: '16px', 
  width: '400px', maxWidth: '95%', maxHeight: '85vh', 
  position: 'relative', display: 'flex', flexDirection: 'column', 
  color: 'var(--text-main)', 
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)' 
};

const filterContainerStyle = { 
  overflowY: 'auto', 
  paddingRight: '10px',
  marginTop: '15px' 
};

const filterSectionStyle = { 
  borderBottom: '1px solid var(--border-color)', 
  padding: '12px 0' 
};

const sectionHeaderStyle = { 
  display: 'flex', justifyContent: 'space-between', 
  cursor: 'pointer', fontWeight: '600', 
  color: 'var(--text-main)', padding: '8px 0',
  fontSize: '15px'
};

const dropdownListStyle = { 
  display: 'flex', flexDirection: 'column', 
  padding: '12px', background: 'var(--bg-color)', 
  borderRadius: '8px', color: 'var(--text-main)' 
};

const labelStyle = { 
  margin: '6px 0', cursor: 'pointer', 
  display: 'flex', alignItems: 'center', gap: '8px', 
  color: 'var(--text-muted)', fontSize: '14px' 
};

const inputStyle = { 
  padding: '10px', width: '100%', 
  borderRadius: '8px', border: '1px solid var(--border-color)',
  background: 'var(--card-bg)',
  color: 'var(--text-main)',
  outline: 'none'
};

const closeBtnStyle = { 
  position: 'absolute', top: '15px', right: '15px', 
  border: 'none', background: 'none', fontSize: '18px', 
  cursor: 'pointer', color: 'var(--text-muted)' 
};

const checkboxLabelStyle = { 
  padding: '20px 0', display: 'flex', alignItems: 'center', 
  gap: '10px', fontWeight: '600', cursor: 'pointer', 
  color: 'var(--text-main)', userSelect: 'none' 
};

const resetBtnStyle = { 
  width: '100%', marginTop: '10px', padding: '12px', 
  background: 'transparent', color: '#e74c3c', 
  border: '1px solid #fed7d7', borderRadius: '10px', 
  cursor: 'pointer', fontWeight: '600', transition: '0.3s'
};

const applyBtnStyle = { 
  width: '100%', marginTop: '10px', padding: '12px', 
  background: 'var(--accent)', 
  color: 'white', border: 'none', borderRadius: '10px', 
  cursor: 'pointer', fontWeight: 'bold', transition: '0.3s'
};

const styleTag = (
  <style>
    {`
      .reset-button:hover {
        background-color: #fff5f5 !important;
        border-color: #feb2b2 !important;
      }
      input[type="checkbox"] {
        accent-color: var(--accent);
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
    `}
  </style>
);

const modalAnimationStyles = (
  <style>
    {`
      @keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes modalSlideUp { 
        from { opacity: 0; transform: translateY(30px) scale(0.95); } 
        to { opacity: 1; transform: translateY(0) scale(1); } 
      }
      .modal-overlay { animation: overlayFade 0.3s ease-out; backdrop-filter: blur(4px); }
      .modal-overlay > div { animation: modalSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
    `}
  </style>
);

export default FiltersModal;