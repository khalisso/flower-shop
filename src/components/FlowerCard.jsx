import { useNavigate } from 'react-router-dom';

// Функция расчета минимальной цены для карточки
function calculateCardPrice(flower) {
  // Берем цену за упаковку с наценкой и делим на количество в упаковке
  const packCost = flower.supplierPrice * flower.packSize;
  const packPriceWithMarkup = packCost * (1 + flower.markup);
  return Math.ceil(packPriceWithMarkup / flower.packSize);
}

export default function FlowerCard({ flower }) {
  const navigate = useNavigate();
  const pricePerPiece = calculateCardPrice(flower);

  const handleClick = () => {
    navigate(`/flower/${flower.id}`);
  };

  return (
    <div className="list-item" onClick={handleClick}>
      <img
        src={flower.image}
        alt={flower.name}
        className="list-item-image"
      />
      <div className="list-item-content">
        <div className="list-item-title">{flower.name}</div>
        <div className="list-item-subtitle">{flower.latin}</div>
      </div>
      <div className="list-item-price">
        {pricePerPiece.toLocaleString('ru-RU')} ₽/шт
      </div>
    </div>
  );
}