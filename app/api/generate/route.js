import { NextResponse } from 'next/server';

// Для DALL-E 2 хватит и 30 секунд
export const maxDuration = 30; 

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: 'Ключ не найден' }, { status: 500 });

    // Усиливаем стиль, чтобы DALL-E 2 выдала максимум эстетики
    const styleModifiers = "70s vintage cinema, 35mm film grain, magic realism, moody lighting, highly detailed, artistic, no plastic look";
    const finalPrompt = `${prompt}. ${styleModifiers}`;

    console.log("Запрос к DALL-E 2 (Облегченная версия 512x512)...");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-2",
        prompt: finalPrompt,
        n: 1,
        size: "512x512", // Уменьшили разрешение для скорости
        response_format: "b64_json" // Оставляем вечное хранение
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Ошибка OpenAI:', data.error);
      return NextResponse.json({ error: data.error?.message }, { status: response.status });
    }

    const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
    console.log("Легкая картинка готова.");

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Сбой:', error);
    return NextResponse.json({ error: 'Сбой генератора' }, { status: 500 });
  }
}
