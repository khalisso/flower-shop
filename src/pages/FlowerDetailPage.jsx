import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import OrderPopup from '../components/OrderPopup';

const API_URL = process.env.REACT_APP_API_URL ?? '';
const MIN_QUANTITY = 10;

export default function FlowerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flower, setFlower] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(MIN_QUANTITY.toString());
  const [isInvalid, setIsInvalid] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/flowers`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(f => f.id === parseInt(id));
        setFlower(found || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Telegram native back button
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(() => navigate(-1));
    return () => {
      tg.BackButton.hide();
      tg.BackButton.offClick();
    };
  }, [navigate]);

  function calculateTotalPrice(flower, quantity) {
    const { supplierPrice, packSize, markup } = flower;
    const leftover = Math.max(0, packSize - quantity);
    const orderedWithMarkup = quantity * supplierPrice * (1 + markup);
    const leftoverCost = leftover * supplierPrice;
    return Math.ceil(orderedWithMarkup + leftoverCost);
  }

  function calculateTotalPriceMultiPack(flower, quantity) {
    const { supplierPrice, packSize, markup } = flower;
    const fullPacks = Math.floor(quantity / packSize);
    const remainingPieces = quantity % packSize;
    const fullPacksCost = fullPacks * packSize * supplierPrice * (1 + markup);

    if (remainingPieces === 0) return Math.ceil(fullPacksCost);

    const remainingLeftover = packSize - remainingPieces;
    const remainingCost = remainingPieces * supplierPrice * (1 + markup) + remainingLeftover * supplierPrice;
    return Math.ceil(fullPacksCost + remainingCost);
  }

  function calculatePricePerPiece(flower, quantity) {
    const totalPrice = quantity <= flower.packSize
      ? calculateTotalPrice(flower, quantity)
      : calculateTotalPriceMultiPack(flower, quantity);
    return Math.ceil(totalPrice / quantity);
  }

  if (loading) return <div className="empty-state">Загрузка...</div>;
  if (!flower) return <div className="empty-state">Цветок не найден</div>;

  const validateQuantity = (value) => {
    if (value === '') return false;
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= MIN_QUANTITY;
  };

  const getValidQuantity = () => {
    if (quantity === '') return MIN_QUANTITY;
    const num = parseInt(quantity, 10);
    return (!isNaN(num) && num >= MIN_QUANTITY) ? num : MIN_QUANTITY;
  };

  const validQuantity = getValidQuantity();

  const totalPrice = validQuantity <= flower.packSize
    ? calculateTotalPrice(flower, validQuantity)
    : calculateTotalPriceMultiPack(flower, validQuantity);

  const pricePerPiece = calculatePricePerPiece(flower, validQuantity);
  const packPrice = calculateTotalPrice(flower, flower.packSize);
  const packPricePerPiece = Math.ceil(packPrice / flower.packSize);

  const packOptions = [1, 2, 3].map(multiplier => ({
    quantity: flower.packSize * multiplier,
    label: `${multiplier} упак`
  }));

  const handleOrder = () => {
    if (!validateQuantity(quantity)) {
      alert(`Пожалуйста, введите количество от ${MIN_QUANTITY} штук`);
      return;
    }
    setShowPopup(true);
  };

  const decreaseQuantity = () => {
    const newValue = Math.max(MIN_QUANTITY, validQuantity - 1);
    setQuantity(newValue.toString());
    setIsInvalid(false);
  };

  const increaseQuantity = () => {
    setQuantity((validQuantity + 1).toString());
    setIsInvalid(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuantity(value);
    if (value === '') { setIsInvalid(false); return; }
    if (/^\d+$/.test(value)) {
      setIsInvalid(parseInt(value, 10) < MIN_QUANTITY);
    } else {
      setIsInvalid(true);
    }
  };

  const handleBlur = () => {
    if (quantity === '' || !validateQuantity(quantity)) {
      setQuantity(MIN_QUANTITY.toString());
      setIsInvalid(false);
    }
  };

  return (
    <div>
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <h2>{flower.name}</h2>
        <a
          href="https://t.me/cvetok_khabarstore"
          target="_blank"
          rel="noopener noreferrer"
          className="telegram-link"
          title="Написать в Telegram"
        >
          <svg className="telegram-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.04-.48-.82-.27-1.47-.42-1.42-.88.03-.24.27-.48.74-.74 2.88-1.25 4.79-2.08 5.75-2.49 2.73-1.16 3.3-1.36 3.67-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.08-.03.23-.04.36z"/>
          </svg>
        </a>
      </div>

      <img src={flower.image} alt={flower.name} className="detail-image" />

      <div className="detail-content">
        <h1 className="detail-title">{flower.name}</h1>
        <p className="detail-latin">{flower.latin}</p>
        <p className="detail-description">{flower.description}</p>

        <div className="detail-info">
          <div className="info-row">
            <span>Цена</span>
            <span className="info-value">{Math.ceil(flower.supplierPrice * (1 + flower.markup))} ₽/шт</span>
          </div>
          <div className="info-row">
            <span>В упаковке</span>
            <span className="info-value">{flower.packSize} шт</span>
          </div>
          <div className="info-row">
            <span>Мин. заказ</span>
            <span className="info-value">{MIN_QUANTITY} шт</span>
          </div>
        </div>

        <div className="quantity-block">
          <div className="quantity-controls">
            <button onClick={decreaseQuantity} className="qty-btn" disabled={validQuantity <= MIN_QUANTITY}>−</button>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`qty-input ${isInvalid ? 'invalid' : ''}`}
              placeholder={MIN_QUANTITY.toString()}
            />
            <button onClick={increaseQuantity} className="qty-btn">+</button>
          </div>
          {isInvalid && (
            <div className="error-message">Минимальное количество {MIN_QUANTITY} шт</div>
          )}
        </div>

        <div className="pack-options">
          {packOptions.map(option => (
            <button
              key={option.quantity}
              className={`pack-btn ${validQuantity === option.quantity ? 'active' : ''}`}
              onClick={() => { setQuantity(option.quantity.toString()); setIsInvalid(false); }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="price-block">
          <div className="price-row">
            <span>Цена за шт</span>
            <span className="price-highlight">{pricePerPiece.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="price-row total">
            <span>Итого</span>
            <span className="total-highlight">{totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {validQuantity < flower.packSize && !isInvalid && quantity !== '' && (
          <div className="hint-mini">
            <span>💡</span>
            <span>Закажите {flower.packSize} шт — {packPricePerPiece} ₽/шт</span>
            <button
              className="hint-mini-btn"
              onClick={() => { setQuantity(flower.packSize.toString()); setIsInvalid(false); }}
            >
              Выбрать
            </button>
          </div>
        )}

        <button
          className={`order-btn ${isInvalid ? 'disabled' : ''}`}
          onClick={handleOrder}
          disabled={isInvalid}
        >
          Заказать {validQuantity} шт
        </button>
      </div>

      {showPopup && (
        <OrderPopup
          flower={flower}
          quantity={validQuantity}
          totalPrice={totalPrice}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
