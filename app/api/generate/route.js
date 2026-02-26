import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY; // Используем OpenRouter

    if (!apiKey) return NextResponse.json({ error: 'Ключ OpenRouter не найден' }, { status: 500 });

    // Стиль "Кино 70-х" для FLUX
    const styleModifiers = "70s vintage cinema style, shot on 35mm film, grainy texture, warm natural lighting, unpolished realism, deep shadows, wide angle lens, highly detailed skin textures";
    const finalPrompt = `${prompt}, ${styleModifiers}`;

    console.log("Запрос к FLUX (только за ссылкой):", finalPrompt);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Добавляем заголовки, чтобы OpenRouter знал, откуда запрос
        "HTTP-Referer": "https://vercel.app", 
        "X-Title": "Luna Chat"
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-1-schnell",
        messages: [{ role: "user", content: finalPrompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Ошибка OpenRouter');

    // Вытаскиваем ссылку
    let rawContent = data.choices[0].message.content.trim();
    const urlMatch = rawContent.match(/\((https?:\/\/[^\)]+)\)/);
    const imageUrl = urlMatch ? urlMatch[1] : rawContent;

    console.log("Ссылка получена, отдаем клиенту.");
    // Отдаем просто ссылку, не скачиваем!
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
