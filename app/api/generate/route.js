import { NextResponse } from 'next/server';

// DALL-E 3 работает дольше, поэтому ставим максимальный лимит ожидания
export const maxDuration = 60; 

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Ключ OpenAI не найден в настройках Vercel' }, { status: 500 });
    }

    // Формируем усиленный промпт для обхода "пластикового" стиля
    // Добавляем акценты на текстуры, винтажный свет и отсутствие 3D-глянца
    const styleModifiers = "Style: Magic realism. Cinematic shot on 35mm vintage film, heavy grain, muted colors, moody atmosphere, high contrast, 1970s aesthetic, intricate textures, masterpiece, no glossy look, no 3D render feel, natural lighting";
    const finalPrompt = `${prompt}. ${styleModifiers}`;

    console.log("Запуск генерации DALL-E 3 в формате Base64...");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json" // Получаем сам файл, а не временную ссылку
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Ошибка OpenAI API:', data.error);
      return NextResponse.json({ error: data.error?.message }, { status: response.status });
    }

    // Собираем готовую картинку из пришедшего кода
    const b64Data = data.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${b64Data}`;

    console.log("Генерация завершена. Картинка готова к вечному хранению.");

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критический сбой в route.js:', error);
    return NextResponse.json({ error: 'Сбой сервера генерации' }, { status: 500 });
  }
}
