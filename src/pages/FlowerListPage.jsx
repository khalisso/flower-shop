import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import FlowerCard from '../components/FlowerCard';

const API_URL = process.env.REACT_APP_API_URL ?? '';

export default function FlowerListPage() {
  const [flowers, setFlowers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/flowers`)
      .then(res => res.json())
      .then(data => setFlowers(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredFlowers = flowers.filter(flower =>
    flower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flower.latin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="header">
        <h1>Монобукеты</h1>
        <a
          href="https://t.me/cvetok_khabarstore"
          target="_blank"
          rel="noopener noreferrer"
          className="telegram-link"
          title="Написать в Telegram"
        >
          <svg className="telegram-icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.04-.48-.82-.27-1.47-.42-1.42-.88.03-.24.27-.48.74-.74 2.88-1.25 4.79-2.08 5.75-2.49 2.73-1.16 3.3-1.36 3.67-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.08-.03.23-.04.36z"/>
          </svg>
          <span className="telegram-text">Поддержка</span>
        </a>
      </div>

      <SearchBar onSearch={setSearchQuery} />

      <div className="list">
        {loading ? (
          <div className="empty-state"><p>Загрузка...</p></div>
        ) : filteredFlowers.length > 0 ? (
          filteredFlowers.map(flower => (
            <FlowerCard key={flower.id} flower={flower} />
          ))
        ) : (
          <div className="empty-state"><p>Цветы не найдены</p></div>
        )}
      </div>
    </div>
  );
}
