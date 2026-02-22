import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Ключ не найден' }, { status: 500 });

    console.log("Запрос к Nano Banana...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Используем точный ID модели из твоего списка
        model: "google/gemini-2.5-flash-lite-preview-02-05:free",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: `Generate a high-quality image: ${prompt}` }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error('Ошибка OpenRouter');

    // Nano Banana через OpenRouter часто отдает URL на готовую картинку
    // или base64. Этот код подхватит оба варианта.
    const output = data.choices[0].message.content.trim();
    
    let imageUrl = output;
    // Если это чистый base64 (без http), добавим префикс
    if (!output.startsWith('http') && !output.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${output.replace(/[^A-Za-z0-9+/=]/g, "")}`;
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
