import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FlowerListPage from './pages/FlowerListPage.jsx';
import FlowerDetailPage from './pages/FlowerDetailPage.jsx';
import './index.css';

export default function App() {
  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<FlowerListPage />} />
          <Route path="/flower/:id" element={<FlowerDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}