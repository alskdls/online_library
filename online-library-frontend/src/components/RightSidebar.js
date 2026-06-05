import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Flame } from 'lucide-react';

const RightSidebar = () => {
  const [latestBooks, setLatestBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await axios.get('http://localhost:5000/books');
        const sorted = res.data.sort((a, b) => b.id - a.id).slice(0, 10);
        setLatestBooks(sorted);
      } catch (err) {
        console.error("Ошибка загрузки новинок:", err);
      }
    };
    fetchLatest();
  }, []);

  const handleGoToNew = () => navigate('/search?sort=new');

  return (
    <aside className="right-sidebar-container">
      {/* ШАПКА — ВЕРНУЛИ В ЦЕНТР */}
      <div className="rs-header-wrapper" onClick={handleGoToNew} style={{ cursor: 'pointer' }}>
        <div className="rs-title-container">
          <Flame size={20} className="flame-icon" />
          <h3 className="rs-main-title">НОВИНКИ</h3>
        </div>
        <div className="rs-underline"></div>
      </div>

      {/* СПИСОК — СТАНОВИТСЯ СКРОЛЛОМ НА МОБИЛКАХ */}
      <div className="right-sidebar-list">
        {latestBooks.map(book => {
          const cover = (book.image_url && book.image_url !== "[null]" && book.image_url.trim() !== "") 
            ? book.image_url 
            : "https://kappa.lol/pAubra";

          return (
            <div 
              key={book.id} 
              className="right-sidebar-item"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <div className="rs-image-wrapper">
                <img src={cover} alt={book.title} />
              </div>
              <div className="rs-info">
                <div className="rs-item-title">{book.title}</div>
                <div className="rs-item-author">{book.author}</div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="rs-view-all-btn" onClick={handleGoToNew}>
        Всі новинки
      </button>

      <style>{`
        .right-sidebar-container {
          width: 300px;
          margin: 40px 20px 20px 10px; 
          padding: 25px 15px;
          background: var(--card-bg);
          backdrop-filter: blur(15px);
          border-radius: 24px;
          border: 2px solid var(--accent); 
          box-shadow: 0 10px 40px var(--shadow-color);
          display: flex;
          flex-direction: column;
          height: fit-content;
          position: relative;
        }

        .rs-header-wrapper {
          text-align: center;
          margin-bottom: 25px;
        }

        .rs-title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .rs-main-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: var(--text-main);
          margin: 0;
          text-transform: uppercase;
        }

        .flame-icon {
          color: var(--accent);
          filter: drop-shadow(0 0 5px var(--accent));
        }

        .rs-underline {
          height: 4px;
          width: 40px;
          background: var(--accent);
          margin: 0 auto;
          border-radius: 2px;
        }

        .right-sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .right-sidebar-item {
          display: flex;
          gap: 12px;
          padding: 8px;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.03);
        }

        .right-sidebar-item:hover {
          background: rgba(212, 163, 115, 0.15);
          transform: translateX(5px);
        }

        .rs-image-wrapper {
          width: 50px;
          height: 70px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .rs-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rs-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          text-align: left;
        }

        .rs-item-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rs-item-author {
          font-size: 11px;
          opacity: 0.6;
          color: var(--text-main);
          margin-top: 2px;
        }

        .rs-view-all-btn {
          margin-top: 20px;
          padding: 12px;
          background: var(--accent);
          border: 2px solid var(--accent);
          color: white;
          font-weight: 800;
          text-transform: uppercase;
          border-radius: 12px;
          transition: all 0.3s;
          cursor: pointer;
          width: 100%;
        }

        .rs-view-all-btn:hover {
          background: transparent;
          color: var(--accent);
        }

        /* ================= МЕДИА-ЗАПРОС ДЛЯ СМАРТФОНОВ И ПЛАНШЕТОВ ================= */
        @media (max-width: 1100px) {
          .right-sidebar-container {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto 40px auto; /* Центрируем саму панель по бокам */
            padding: 20px;
            background: transparent;  /* Убираем лишний фон, чтобы не дублировать плашки */
            border: none;             /* Убираем рамку на мобилках */
            box-shadow: none;         /* Убираем массивную тень */
            order: -1;                /* Если родитель флекс, кинет новинки НАВЕРХ (сразу после рекомендаций) */
          }

          /* Перестраиваем список в горизонтальную ленту */
          .right-sidebar-list {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            whiteSpace: nowrap;
            padding-bottom: 15px;
            gap: 20px;
            -webkit-overflow-scrolling: touch;
            justify-content: safe center; /* Центрируем новинки на планшетах, если их мало */
          }

          /* Карточка новинки в слайдере */
          .right-sidebar-item {
            flex: 0 0 240px; /* Фиксированная ширина карточки в скролле */
            background: var(--card-bg); /* Теперь фон карточки выделяет её в ленте */
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }

          .right-sidebar-item:hover {
            transform: translateY(-5px); /* На мобилке лучше анимировать вверх, а не вбок */
          }

          .rs-info {
            flex: 1; /* Чтобы текст занимал всё оставшееся место в карточке */
          }

          /* Скрываем кнопку "Все новинки" снизу, так как заголовок кликабельный */
          .rs-view-all-btn {
            display: none;
          }

          /* Красивый кастомный скроллбар для новинок */
          .right-sidebar-list::-webkit-scrollbar {
            height: 6px;
          }
          .right-sidebar-list::-webkit-scrollbar-track {
            background: transparent;
          }
          .right-sidebar-list::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 10px;
          }
          .right-sidebar-list::-webkit-scrollbar-thumb:hover {
            background: var(--accent);
          }
        }
      `}</style>
    </aside>
  );
};

export default RightSidebar;