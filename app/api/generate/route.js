import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Проверяем ключ
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("Ошибка: Не найден OPENROUTER_API_KEY в Vercel");
      return NextResponse.json({ error: 'Ключ API не настроен на сервере' }, { status: 500 });
    }

    // 2. Получаем промпт от пользователя
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт не получен' }, { status: 400 });
    }

    console.log("Начинаю генерацию для промпта:", prompt);

    // 3. Отправляем запрос в OpenRouter (Flux Schnell)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://luna-app.com", // Для OpenRouter
        "X-Title": "Luna Messenger",
      },
      body: JSON.stringify({
        "model": "black-forest-labs/flux-1-schnell",
        "messages": [
          {
            "role": "user",
            // Добавляем стиль "Романтический реализм"
            "content": `Romantic realism style, cinematic lighting, masterpiece photo of: ${prompt}`
          }
        ],
      })
    });

    // 4. Получаем сырой ответ
    const data = await response.json();

    // Если OpenRouter вернул ошибку (например, кончились деньги или неверный ключ)
    if (data.error) {
      console.error("Ошибка OpenRouter:", data.error);
      return NextResponse.json({ error: `OpenRouter Error: ${data.error.message}` }, { status: 500 });
    }

    // 5. Пытаемся найти картинку в ответе
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("Пустой ответ от нейросети:", JSON.stringify(data));
      return NextResponse.json({ error: 'Нейросеть вернула пустой ответ' }, { status: 500 });
    }

    // Flux обычно возвращает Markdown-ссылку вида: ![image](https://...) или просто ссылку (https://...)
    // Ищем URL с помощью регулярного выражения
    const urlMatch = content.match(/(https?:\/\/[^\s)\"]+)/);
    const imageUrl = urlMatch ? urlMatch[0] : null;

    if (!imageUrl) {
       console.error("Не удалось найти ссылку в ответе:", content);
       return NextResponse.json({ error: 'Картинка сгенерировалась, но ссылка не найдена', raw: content });
    }

    console.log("Успех! Картинка получена:", imageUrl);
    // 6. Возвращаем ссылку на фронтенд
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критическая ошибка сервера API:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера: ' + error.message }, { status: 500 });
  }
}
