import { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL ?? '';
const ADMIN_TELEGRAM = 'https://t.me/halliilll';

const tg = window.Telegram?.WebApp;
const tgUser = tg?.initDataUnsafe?.user;
const isTMA = !!tgUser;

// ── TMA MODE ──────────────────────────────────────────────

function TMAOrderPopup({ flower, quantity, totalPrice, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const userName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ');

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_URL}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flower, quantity, totalPrice, tgUser })
      });
      setIsSubmitted(true);
    } catch (e) {
      console.error(e);
      setIsSubmitted(true); // всё равно перекидываем
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = () => {
    tg.openTelegramLink(ADMIN_TELEGRAM);
    onClose();
  };

  if (isSubmitted) {
    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-content" onClick={e => e.stopPropagation()}>
          <div className="popup-success">
            <div className="success-icon">✓</div>
            <h3>Заявка отправлена!</h3>
            <p>Продавец получил ваш заказ и скоро напишет</p>
            <button className="popup-button" onClick={handleOpenChat}>
              Написать продавцу
            </button>
            <button className="popup-cancel" onClick={onClose} style={{ marginTop: 8 }}>
              Закрыть
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
          <h3>Подтверждение заказа</h3>
          <div className="order-summary-mini">
            <span>{flower.name}</span>
            <span>{quantity} шт • {totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="popup-body">
          <div className="tma-user-info">
            <span className="tma-user-label">Заказ от</span>
            <span className="tma-user-name">{userName}</span>
            {tgUser?.username && (
              <span className="tma-user-handle">@{tgUser.username}</span>
            )}
          </div>
          <p className="popup-description">
            Продавец получит заявку и напишет вам в Telegram
          </p>
        </div>

        <div className="popup-footer">
          <button
            className="order-btn"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Отправляем...' : 'Подтвердить заказ'}
          </button>
          <button className="popup-cancel" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WEB MODE ──────────────────────────────────────────────

function WebOrderPopup({ flower, quantity, totalPrice, onClose }) {
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (input) => {
    let digits = input.replace(/\D/g, '');
    if (digits.length > 0) {
      if (digits[0] === '8') digits = '7' + digits.slice(1);
      else if (digits[0] !== '7') digits = '7' + digits;
    }
    if (digits.length === 0) return '';
    let formatted = '+' + digits[0];
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) formatted += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) formatted += '-' + digits.slice(7, 9);
    if (digits.length >= 10) formatted += '-' + digits.slice(9, 11);
    return formatted;
  };

  const validatePhone = (p) => {
    const digits = p.replace(/\D/g, '');
    return digits.length === 11 && digits[0] === '7';
  };

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flower, quantity, totalPrice, phone })
      });
      const data = await response.json();
      if (data.success) setIsSubmitted(true);
      else setError('Ошибка при отправке. Попробуйте позже');
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

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
            <button className="popup-button" onClick={onClose}>Хорошо</button>
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
          <p className="popup-description">Выберите удобный способ связи:</p>

          <button
            className="telegram-option"
            onClick={() => {
              const message = `Здравствуйте! Хочу заказать:\n${flower.name} - ${quantity} шт\nСумма: ${totalPrice.toLocaleString('ru-RU')} ₽`;
              window.open(`${ADMIN_TELEGRAM}?text=${encodeURIComponent(message)}`, '_blank');
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

          <div className="phone-option">
            <div className="option-divider"><span>или</span></div>
            <form onSubmit={handlePhoneSubmit} className="phone-form">
              <p className="option-label">Перезвонить мне</p>
              <div className="phone-input-group">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(formatPhone(e.target.value)); setError(''); }}
                  placeholder="+7 (___) ___-__-__"
                  className={`phone-input ${error ? 'error' : ''}`}
                />
                <button type="submit" className="phone-submit" disabled={isLoading}>
                  {isLoading ? '⏳' : 'Отправить'}
                </button>
              </div>
              {error && <div className="phone-error">{error}</div>}
              <p className="phone-hint">Начните вводить номер — +7 появится автоматически</p>
            </form>
          </div>
        </div>

        <div className="popup-footer">
          <button className="popup-cancel" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ── EXPORT ────────────────────────────────────────────────

export default function OrderPopup(props) {
  return isTMA ? <TMAOrderPopup {...props} /> : <WebOrderPopup {...props} />;
}
