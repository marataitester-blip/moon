import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Ключ OpenRouter не найден в настройках Vercel' }, { status: 500 });
    }

    // Стиль: уходим от "магии" к качественной кино-эстетике
    const styleModifiers = "high-end cinema style, 35mm film, vintage texture, warm lighting, highly detailed, realistic skin, 8k";
    const finalPrompt = `${prompt}, ${styleModifiers}`;

    console.log("Запрос к OpenRouter...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Эти заголовки обязательны для некоторых моделей в OpenRouter
        "HTTP-Referer": "https://vercel.app", 
        "X-Title": "Luna AI Project"
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-1-schnell",
        messages: [{ role: "user", content: finalPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Детальная ошибка OpenRouter:', data);
      return NextResponse.json({ 
        error: 'OpenRouter Error', 
        details: data.error?.message || 'Unknown error' 
      }, { status: response.status });
    }

    // Извлекаем ссылку на картинку
    let rawContent = data.choices[0]?.message?.content?.trim() || '';
    
    // Если ссылка пришла в скобках (markdown), вырезаем её
    const urlMatch = rawContent.match(/\((https?:\/\/[^\)]+)\)/);
    const imageUrl = urlMatch ? urlMatch[1] : rawContent;

    if (!imageUrl.startsWith('http')) {
      throw new Error('Модель не вернула прямую ссылку на картинку');
    }

    console.log("Ссылка получена успешно:", imageUrl);
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критический сбой в route.js:', error);
    return NextResponse.json({ error: 'Сбой сервера генерации' }, { status: 500 });
  }
}
