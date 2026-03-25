import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт не указан' }, { status: 400 });
    }

    // Инженерная проверка: если FAL_KEY не задан в Vercel, возвращаем явную ошибку
    if (!process.env.FAL_KEY) {
      console.error('Критическая ошибка: FAL_KEY отсутствует в переменных окружения Vercel.');
      return NextResponse.json({ error: 'Ошибка конфигурации сервера' }, { status: 500 });
    }

    // Обращение к fal.ai (используем их модель Fast SDXL)
    // ФИКС: Увеличиваем num_inference_steps, чтобы ИИ успел сгенерировать картинку.
    const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "square_hd",
        // num_inference_steps: 4, // БЫЛО (слишком быстро, вызывало артефакты)
        num_inference_steps: 20,  // СТАЛО (фикс для качественной генерации)
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка fal.ai:', errorText);
      return NextResponse.json({ error: 'Ошибка генерации от fal.ai' }, { status: 500 });
    }

    const data = await response.json();
    
    // fal.ai возвращает ответ в виде массива images
    if (data.images && data.images.length > 0) {
      // Возвращаем URL первой сгенерированной картинки
      return NextResponse.json({ imageUrl: data.images[0].url });
    } else {
      throw new Error("Fal.ai не вернул картинку");
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
