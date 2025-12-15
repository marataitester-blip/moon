import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Нет ключа API (OPENROUTER_API_KEY)' }, { status: 500 });
    }

    // Добавляем стиль к промпту
    const fullPrompt = `Romantic realism style, cinematic lighting, masterpiece, ${prompt}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "model": "black-forest-labs/flux-1-schnell",
        "messages": [
          { "role": "user", "content": fullPrompt }
        ],
      })
    });

    const data = await response.json();
    
    // Пытаемся достать картинку из ответа
    const content = data.choices?.[0]?.message?.content;
    
    // Ищем ссылку в тексте (обычно Flux отдает Markdown с ссылкой)
    const urlMatch = content?.match(/\((https?:\/\/.*?)\)/) || content?.match(/(https?:\/\/.*?)(\s|$)/);
    const imageUrl = urlMatch ? urlMatch[1] : null;

    if (!imageUrl) {
       console.error("OpenRouter Response:", JSON.stringify(data));
       return NextResponse.json({ error: 'Картинка не сгенерировалась', raw: content });
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
