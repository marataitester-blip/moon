import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    
    // Чистим ключ от лишних пробелов
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Ключ OPENROUTER_API_KEY не найден в Vercel' }, { status: 500 });
    }

    // Твоя любимая кино-эстетика без "магии"
    const styleModifiers = "70s vintage cinema style, shot on 35mm film, grainy texture, warm natural lighting, unpolished realism, deep shadows, wide angle lens, highly detailed textures";
    const finalPrompt = `${prompt}, ${styleModifiers}`;

    console.log("Запрос к OpenRouter с правильным ID (flux-schnell)...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.app", 
        "X-Title": "Luna AI"
      },
      body: JSON.stringify({
        // ИСПРАВЛЕННЫЙ ID МОДЕЛИ
        model: "black-forest-labs/flux-schnell",
        messages: [{ role: "user", content: finalPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Детальная ошибка OpenRouter:', data);
      return NextResponse.json({ 
        error: 'OpenRouter Error', 
        details: data.error?.message || 'Check balance or model ID' 
      }, { status: response.status });
    }

    // Вытаскиваем ссылку
    let rawContent = data.choices[0]?.message?.content?.trim() || '';
    const urlMatch = rawContent.match(/\((https?:\/\/[^\)]+)\)/);
    const imageUrl = urlMatch ? urlMatch[1] : rawContent;

    if (!imageUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Модель прислала текст вместо ссылки' }, { status: 400 });
    }

    console.log("Успех! Ссылка получена:", imageUrl);
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критический сбой в route.js:', error);
    return NextResponse.json({ error: 'Сбой сервера генерации' }, { status: 500 });
  }
}
