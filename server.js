const express = require('express');
const { OpenRouter } = require('@openrouter/sdk');

const app = express();
app.use(express.json()); // для парсинга JSON тел запросов

// Инициализация OpenRouter SDK с API ключом
const openrouter = new OpenRouter({
  apiKey: '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'
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Эндпоинт для получения описания растения
app.post('/api/plant', async (req, res) => {
  const { plantName } = req.body;

  if (!plantName) {
    return res.status(400).json({ error: 'plantName is required' });
  }

  const prompt = `
    Напиши название растения: ${plantName}
    Напиши название растения на латинском
    Напиши описание растения:
    Напиши фильтры под это растение (фильтры: 1. Полив: Умеренный, Частый, Редкий. 2. Размер: Крупный, Средний, Маленький. 3. Освещение: Много света, Полутень, Тень. 4. Сложность: Сложный, Средний, Простой.)
  `;

  try {
    // Отправляем запрос к модели Mistral
    const stream = await openrouter.chat.send({
      model: 'mistralai/devstral-2512:free',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    });

    // Объединяем поток
    let fullResponse = '';
    for await (const chunk of stream) {
      const contentPart = chunk.choices[0]?.delta?.content;
      if (contentPart) {
        fullResponse += contentPart;
      }
    }

    // Можно разделить полученное на части или сразу вернуть
    res.json({ description: fullResponse });

  } catch (error) {
    console.error('Ошибка при запросе к OpenRouter:', error);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

// Запуск сервера на порту 8080
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});