import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Ключ не найден' }, { status: 500 });

    const finalPrompt = `${prompt}, soft realism, high quality, digital art`;

    console.log("Запрос к OpenRouter...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { 
            role: "system", 
            content: "You are an image generator. Reply ONLY with the raw base64 string. No markdown, no quotes, no explanations. Just the base64 data." 
          },
          { role: "user", content: finalPrompt }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error('Ошибка OpenRouter');

    // --- МОМЕНТ ИСТИНЫ: ОЧИСТКА ---
    let rawContent = data.choices[0].message.content.trim();
    
    // Убираем возможные markdown обертки ``` или кавычки
    const cleanBase64 = rawContent.replace(/```[a-z]*\n?|```|^["']|["']$/g, "").trim();
    
    // Формируем финальную строку
    const imageUrl = `data:image/png;base64,${cleanBase64}`;

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
