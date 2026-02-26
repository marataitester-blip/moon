import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY; // Используем OpenRouter

    if (!apiKey) return NextResponse.json({ error: 'Ключ не найден' }, { status: 500 });

    // --- СТИЛИЗАЦИЯ БЕЗ МАГИИ ---
    // Вместо имен режиссеров используем описание их стиля: 
    // теплый свет, пленка 35мм, винтажная эстетика, естественные текстуры.
    const styleModifiers = "70s vintage cinema style, shot on 35mm film, grainy texture, warm natural lighting, unpolished realism, deep shadows, wide angle lens, highly detailed skin textures";
    const finalPrompt = `${prompt}, ${styleModifiers}`;

    console.log("Запрос к FLUX:", finalPrompt);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-1-schnell",
        messages: [{ role: "user", content: finalPrompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Ошибка OpenRouter');

    // Вытаскиваем ссылку из ответа (OpenRouter часто присылает её в markdown)
    let rawContent = data.choices[0].message.content.trim();
    const urlMatch = rawContent.match(/\((https?:\/\/[^\)]+)\)/);
    const tempUrl = urlMatch ? urlMatch[1] : rawContent;

    // --- СОХРАНЯЕМ НАВЕЧНО ---
    console.log("Скачиваем шедевр...");
    const imageRes = await fetch(tempUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    return NextResponse.json({ imageUrl: base64Image });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
