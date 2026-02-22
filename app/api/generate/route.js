import { NextResponse } from 'next/server';

// Увеличиваем лимит времени до 60 секунд для Vercel
export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Теперь мы ищем ключ от Together AI
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      console.error('Ключ TOGETHER_API_KEY не настроен в Vercel');
      return NextResponse.json({ error: 'Ключ Together AI не настроен' }, { status: 500 });
    }

    // Ограничиваем длину и добавляем стили реализма
    const safePrompt = prompt.substring(0, 300);
    const styleTags = "soft realism, aesthetic, beautiful, mild erotica, masterpiece, highly detailed, soft lighting";
    const finalPrompt = `${safePrompt}, ${styleTags}`;

    console.log("Отправляем запрос к Together AI (модель FLUX)...");

    // Обращаемся к Together AI
    const response = await fetch(
      "https://api.together.xyz/v1/images/generations",
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell",
          prompt: finalPrompt,
          width: 1024,
          height: 1024,
          steps: 4,
          n: 1,
          response_format: "b64_json"
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Ошибка сервера Together: ${data.error?.message || response.status}`);
    }

    // Together AI по нашему запросу сразу отдает готовый код картинки (Base64)
    const base64Image = data.data[0].b64_json;
    
    // Формируем формат, который сразу поймет тег <img> в чате
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критическая ошибка генератора:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
