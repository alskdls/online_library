import React, { useState, useEffect } from 'react';
import BookCard from './BookCard';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchCart = () => {
    if (!user) return;
    fetch(`http://localhost:5000/cart-details/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setCartItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) fetchCart();
  }, [user?.id]);

  const updateQuantity = async (bookId, action) => {
    try {
      await fetch('http://localhost:5000/cart/quantity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bookId, action })
      });
      fetchCart(); 
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price || 0) * (item.quantity || 1));
    }, 0).toFixed(2);
  };

  const removeItem = async (bookId) => {
    try {
      await fetch('http://localhost:5000/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bookId })
      });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div style={{ padding: '20px' }}>Будь ласка, увійдіть.</div>;
  if (loading) return <div style={{ padding: '20px' }}>Завантаження...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Мій Кошик 🛒</h2>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Кількість найменувань: {cartItems.length}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginTop: '20px' }}>
        {cartItems.length > 0 ? (
          cartItems.map(book => (
            <div key={book.id}>
              <BookCard 
                book={book} 
                isFavoriteInitial={book.is_favorite} 
                isCartPage={true} 
                onRemove={() => removeItem(book.id)} 
                onUpdateQuantity={updateQuantity} 
              />
            </div>
          ))
        ) : (
          <p>Ваш кошик порожній.</p>
        )}
      </div>

      {cartItems.length > 0 && (
        <div style={summaryBoxStyle}>
          <h3>Загальна сума: <span style={{ color: '#27ae60' }}>{calculateTotal()} грн</span></h3>
          <button 
            style={checkoutBtnStyle} 
            onClick={() => alert(`Замовлення на суму ${calculateTotal()} грн оформлено!`)}
          >
            Оформити замовлення
          </button>
        </div>
      )}
    </div>
  );
};

const summaryBoxStyle = {
  marginTop: '30px',
  padding: '20px',
  borderTop: '2px solid #eee',
  textAlign: 'right',
  background: '#f9f9f9',
  borderRadius: '8px'
};

const checkoutBtnStyle = { 
  backgroundColor: '#27ae60', 
  color: 'white', 
  padding: '12px 35px', 
  border: 'none', 
  borderRadius: '5px', 
  fontSize: '18px', 
  fontWeight: 'bold', 
  cursor: 'pointer',
  marginTop: '10px'
};

export default Cart;