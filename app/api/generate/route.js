import { NextResponse } from 'next/server';

// 1. ЖЕСТКИЙ ЗАПРЕТ КЭШИРОВАНИЯ ДЛЯ VERCEL
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log("ШАГ 1: Получен промпт от клиента:", prompt);

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт не указан' }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      console.error('ШАГ 2: Ошибка - FAL_KEY отсутствует в настройках Vercel!');
      return NextResponse.json({ error: 'FAL_KEY не настроен' }, { status: 500 });
    }

    console.log("ШАГ 3: Отправка запроса в Fal.ai...");
    
    const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "square_hd",
        num_inference_steps: 20,
        // 2. ОТКЛЮЧАЕМ ЦЕНЗОР (чтобы исключить зеленые заглушки)
        enable_safety_checker: false 
      }),
      // 3. ЗАПРЕЩАЕМ КЭШИРОВАНИЕ FETCH-ЗАПРОСА
      cache: 'no-store' 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ШАГ 4: Ошибка от Fal.ai:', errorText);
      return NextResponse.json({ error: 'Ошибка от fal.ai' }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      console.log("ШАГ 5: Успех! Сгенерирован URL:", data.images[0].url);
      return NextResponse.json({ imageUrl: data.images[0].url });
    } else {
      console.error("ШАГ 4: Fal.ai вернул странный ответ без картинок:", data);
      throw new Error("Fal.ai не вернул картинку");
    }

  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА API:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
