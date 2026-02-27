require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const FLOWERS_FILE = path.join(__dirname, 'flowers.json');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.use(cors());
app.use(express.json());

// --- Flowers helpers ---

function readFlowers() {
  return JSON.parse(fs.readFileSync(FLOWERS_FILE, 'utf8'));
}

function writeFlowers(flowers) {
  fs.writeFileSync(FLOWERS_FILE, JSON.stringify(flowers, null, 2), 'utf8');
}

// --- API ---

app.get('/api/flowers', (req, res) => {
  res.json(readFlowers());
});

app.post('/api/order', async (req, res) => {
  const { flower, quantity, totalPrice, phone } = req.body;

  if (!flower || !quantity || !totalPrice || !phone) {
    return res.status(400).json({ error: 'Не все данные заполнены' });
  }

  const now = new Date();
  const dateStr = now.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const message = `
🌸 *НОВЫЙ ЗАКАЗ* 🌸
━━━━━━━━━━━━━━━━━━━━━
🌷 *Цветок:* ${flower.name}
📦 *Количество:* ${quantity} шт
💰 *Сумма:* ${totalPrice.toLocaleString('ru-RU')} ₽
📞 *Телефон:* ${phone}
━━━━━━━━━━━━━━━━━━━━━
⏱ *Время:* ${dateStr}
  `;

  try {
    await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
    console.log(`✅ Заказ: ${flower.name} - ${quantity}шт, тел: ${phone}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка Telegram:', error);
    res.status(500).json({ error: 'Не удалось отправить заказ' });
  }
});

// --- Bot: /addflower command ---

const STEPS = ['name', 'latin', 'supplierPrice', 'packSize', 'markup', 'image', 'description'];

const STEP_PROMPTS = {
  name:          '🌸 Название цветка (например: Роза белая):',
  latin:         '🔬 Латинское название (например: Rosa White):',
  supplierPrice: '💵 Цена поставщика за штуку в рублях (например: 350):',
  packSize:      '📦 Размер упаковки в штуках (например: 25):',
  markup:        '📈 Наценка в процентах (например: 30 для 30%):',
  image:         '🖼 URL изображения (или напиши "пропустить"):',
  description:   '📝 Описание цветка:',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400';

// In-memory state per admin chat
const addFlowerState = {};

bot.onText(/\/addflower/, (msg) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== CHAT_ID) {
    bot.sendMessage(chatId, '⛔ Нет доступа.');
    return;
  }
  addFlowerState[chatId] = { step: 0, data: {} };
  bot.sendMessage(chatId, `Добавляем новый цветок. Шаг 1/${STEPS.length}\n\n${STEP_PROMPTS[STEPS[0]]}`);
});

bot.onText(/\/cancelflower/, (msg) => {
  const chatId = msg.chat.id.toString();
  if (addFlowerState[chatId]) {
    delete addFlowerState[chatId];
    bot.sendMessage(chatId, '❌ Добавление отменено.');
  }
});

bot.onText(/\/listflowers/, (msg) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== CHAT_ID) return;
  const flowers = readFlowers();
  const list = flowers.map(f => `• [${f.id}] ${f.name}`).join('\n');
  bot.sendMessage(chatId, `📋 Список цветов:\n\n${list}`);
});

bot.onText(/\/deleteflower (\d+)/, (msg, match) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== CHAT_ID) return;
  const id = parseInt(match[1], 10);
  const flowers = readFlowers();
  const index = flowers.findIndex(f => f.id === id);
  if (index === -1) {
    bot.sendMessage(chatId, `❌ Цветок с ID ${id} не найден.`);
    return;
  }
  const deleted = flowers.splice(index, 1)[0];
  writeFlowers(flowers);
  bot.sendMessage(chatId, `✅ Удалён: *${deleted.name}* (ID: ${id})`, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id.toString();
  if (!addFlowerState[chatId]) return;
  if (!msg.text || msg.text.startsWith('/')) return;

  const state = addFlowerState[chatId];
  const currentStep = STEPS[state.step];
  let value = msg.text.trim();

  // Validate and convert numeric fields
  if (currentStep === 'supplierPrice' || currentStep === 'packSize') {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      bot.sendMessage(chatId, '❌ Введите корректное целое число. Попробуйте снова:');
      return;
    }
    value = num;
  } else if (currentStep === 'markup') {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      bot.sendMessage(chatId, '❌ Введите корректное число. Попробуйте снова:');
      return;
    }
    value = num / 100;
  } else if (currentStep === 'image' && value.toLowerCase() === 'пропустить') {
    value = DEFAULT_IMAGE;
  }

  state.data[currentStep] = value;
  state.step++;

  if (state.step >= STEPS.length) {
    const flowers = readFlowers();
    const newId = flowers.length > 0 ? Math.max(...flowers.map(f => f.id)) + 1 : 1;
    const newFlower = { id: newId, ...state.data };
    flowers.push(newFlower);
    writeFlowers(flowers);
    delete addFlowerState[chatId];

    bot.sendMessage(chatId,
      `✅ Цветок добавлен!\n\n` +
      `🌸 *${newFlower.name}* (${newFlower.latin})\n` +
      `💵 Цена поставщика: ${newFlower.supplierPrice} ₽\n` +
      `📦 Упаковка: ${newFlower.packSize} шт\n` +
      `📈 Наценка: ${newFlower.markup * 100}%\n` +
      `🆔 ID: ${newId}\n\n` +
      `Цветок сразу доступен на сайте!`,
      { parse_mode: 'Markdown' }
    );
  } else {
    const next = state.step + 1;
    bot.sendMessage(chatId, `Шаг ${next}/${STEPS.length}\n\n${STEP_PROMPTS[STEPS[state.step]]}`);
  }
});

// --- Start server ---

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📱 Команды бота: /addflower, /listflowers, /deleteflower <id>, /cancelflower`);
});
