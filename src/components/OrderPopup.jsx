import { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL ?? '';

export default function OrderPopup({ flower, quantity, totalPrice, onClose }) {
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const TELEGRAM_LINK = 'https://t.me/halliilll'; // твой Telegram для связи

  // Форматирование телефона
  const formatPhone = (input) => {
    let digits = input.replace(/\D/g, '');
    if (digits.length > 0) {
      if (digits[0] === '8') {
        digits = '7' + digits.slice(1);
      } else if (digits[0] !== '7' && digits.length > 0) {
        digits = '7' + digits;
      }
    }

    if (digits.length === 0) return '';

    let formatted = '+' + digits[0];
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) formatted += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) formatted += '-' + digits.slice(7, 9);
    if (digits.length >= 10) formatted += '-' + digits.slice(9, 11);

    return formatted;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const validatePhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 && digits[0] === '7';
  };

  // ✅ ОТПРАВКА ЗАКАЗА НА СЕРВЕР
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhone(phone)) {
      setError('Пожалуйста, введите корректный номер телефона');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flower,
          quantity,
          totalPrice,
          phone
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError('Ошибка при отправке. Попробуйте позже');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  // Экран успеха
  if (isSubmitted) {
    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-content" onClick={e => e.stopPropagation()}>
          <button className="popup-close" onClick={onClose}>×</button>
          <div className="popup-success">
            <div className="success-icon">✓</div>
            <h3>Заявка принята!</h3>
            <p>Мы получили ваш заказ и скоро свяжемся с вами</p>
            <p className="success-phone">{phone}</p>
            <button className="popup-button" onClick={onClose}>
              Хорошо
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>×</button>

        <div className="popup-header">
          <h3>Оформление заказа</h3>
          <div className="order-summary-mini">
            <span>{flower.name}</span>
            <span>{quantity} шт • {totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="popup-body">
          <p className="popup-description">
            Выберите удобный способ связи:
          </p>

          {/* Вариант 1: Telegram */}
          <button
            className="telegram-option"
            onClick={() => {
              const message = `Здравствуйте! Хочу заказать:\n${flower.name} - ${quantity} шт\nСумма: ${totalPrice.toLocaleString('ru-RU')} ₽`;
              window.open(`${TELEGRAM_LINK}?text=${encodeURIComponent(message)}`, '_blank');
              onClose();
            }}
          >
            <div className="option-icon telegram-icon-large">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.04-.48-.82-.27-1.47-.42-1.42-.88.03-.24.27-.48.74-.74 2.88-1.25 4.79-2.08 5.75-2.49 2.73-1.16 3.3-1.36 3.67-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.08-.03.23-.04.36z"/>
              </svg>
            </div>
            <div className="option-text">
              <strong>Написать в Telegram</strong>
              <span>Быстрый ответ, уведомления о заказе</span>
            </div>
            <div className="option-arrow">→</div>
          </button>

          {/* Вариант 2: Телефон */}
          <div className="phone-option">
            <div className="option-divider">
              <span>или</span>
            </div>

            <div className="option-icon phone-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </div>

            <form onSubmit={handlePhoneSubmit} className="phone-form">
              <p className="option-label">Перезвонить мне</p>
              <div className="phone-input-group">
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  className={`phone-input ${error ? 'error' : ''}`}
                />
                <button type="submit" className="phone-submit" disabled={isLoading}>
                  {isLoading ? '⏳' : 'Отправить'}
                </button>
              </div>
              {error && <div className="phone-error">{error}</div>}
              <p className="phone-hint">
                Начните вводить номер — +7 появится автоматически
              </p>
            </form>
          </div>
        </div>

        <div className="popup-footer">
          <button className="popup-cancel" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}