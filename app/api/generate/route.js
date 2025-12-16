import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Ключ API не найден' }, { status: 500 });
    }

    const body = await request.json();
    const { prompt } = body;

    console.log("Генерация для:", prompt);

    // ИСПОЛЬЗУЕМ STABLE DIFFUSION XL (Самая надежная модель)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://luna-app.com",
        "X-Title": "Luna Messenger",
      },
      body: JSON.stringify({
        "model": "stabilityai/stable-diffusion-xl-base-1.0",
        "messages": [
          {
            "role": "user",
            // Добавляем стиль для красоты
            "content": `Cinematic shot, masterpiece, romantic realism, 8k, highly detailed: ${prompt}`
          }
        ],
      })
    });

    const data = await response.json();

    // Проверка на ошибки от самого OpenRouter
    if (data.error) {
      console.error("OpenRouter Error:", data.error);
      return NextResponse.json({ error: `Ошибка нейросети: ${data.error.message}` }, { status: 500 });
    }

    // Ищем картинку в ответе
    const content = data.choices?.[0]?.message?.content;
    const urlMatch = content?.match(/(https?:\/\/[^\s)\"]+)/);
    const imageUrl = urlMatch ? urlMatch[0] : null;

    if (!imageUrl) {
       console.error("Нет ссылки в ответе:", JSON.stringify(data));
       return NextResponse.json({ error: 'Картинка не создалась (пустой ответ)' });
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка сервера:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
