import { NextResponse } from 'next/server';

// Увеличиваем лимит времени до 60 секунд для Vercel
export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Ищем ключ от OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Ключ OPENAI_API_KEY не настроен в Vercel');
      return NextResponse.json({ error: 'Ключ OpenAI не настроен' }, { status: 500 });
    }

    // Ограничиваем длину (DALL-E 2 отлично работает с короткими и средними запросами)
    const safePrompt = prompt.substring(0, 800);
    const styleTags = "soft realism, aesthetic, beautiful, highly detailed, soft lighting";
    const finalPrompt = `${safePrompt}, ${styleTags}`;

    console.log("Отправляем запрос к OpenAI (DALL-E 2, эконом-режим)...");

    // Обращаемся к API OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          model: "dall-e-2",
          prompt: finalPrompt,
          n: 1,
          size: "512x512", // Уменьшенный размер для максимальной экономии
          response_format: "b64_json"
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Ошибка сервера OpenAI: ${data.error?.message || response.status}`);
    }

    // OpenAI сразу отдает готовую картинку в Base64 (в формате PNG)
    const base64Image = data.data[0].b64_json;
    
    // ИСПРАВЛЕНИЕ: ставим правильный формат (png), чтобы картинка отображалась в чате!
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критическая ошибка генератора:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
