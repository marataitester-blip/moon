import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Ищем ключ от OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('Ключ OPENROUTER_API_KEY не настроен в Vercel');
      return NextResponse.json({ error: 'Ключ OpenRouter не настроен' }, { status: 500 });
    }

    const safePrompt = prompt.substring(0, 800);
    const styleTags = "soft realism, aesthetic, beautiful, highly detailed, soft lighting";
    const finalPrompt = `${safePrompt}, ${styleTags}`;

    console.log("Отправляем запрос к OpenRouter (модель Google Nano Banana)...");

    // Обращаемся к API OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Используем бесплатную модель из твоего списка
        model: "google/gemini-2.5-flash-lite-preview-02-05:free",
        messages: [
          { role: "system", content: "You are an image generator. Reply ONLY with a base64 encoded image string, no text." },
          { role: "user", content: finalPrompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Ошибка сервера OpenRouter: ${data.error?.message || response.status}`);
    }

    // OpenRouter отдает ответ в тексте, нам нужно вытащить оттуда саму картинку
    const base64Image = data.choices[0].message.content.trim();
    
    // Формируем формат (PNG)
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критическая ошибка генератора:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
