import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Ключ OPENROUTER_API_KEY не найден в Vercel' }, { status: 500 });

    const finalPrompt = `${prompt}, soft realism, cinematic lighting, masterpiece, 8k resolution`;

    console.log("Запрос к OpenRouter (FLUX.1-schnell)...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-1-schnell",
        messages: [
          { role: "user", content: finalPrompt }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Ошибка OpenRouter');

    // FLUX через OpenRouter обычно отдает ссылку в контенте или в поле image_url
    let imageUrl = data.choices[0].message.content.trim();

    // Если модель вдруг прислала текст с Markdown-ссылкой ![alt](url), вытаскиваем только URL
    const urlMatch = imageUrl.match(/\((https?:\/\/[^\)]+)\)/);
    if (urlMatch) imageUrl = urlMatch[1];

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критическая ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
