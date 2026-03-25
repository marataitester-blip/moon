import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log("Получен промпт:", prompt);

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт не указан' }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: 'FAL_KEY не настроен' }, { status: 500 });
    }
    
    const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt, // ВАЖНО: Тестируй промпты на английском языке!
        image_size: "square_hd",
        enable_safety_checker: false
        // Я полностью удалил ручное управление шагами генерации. 
        // Fal.ai применит свои оптимизированные настройки.
      }),
      cache: 'no-store' 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка от Fal.ai:', errorText);
      return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      return NextResponse.json({ imageUrl: data.images[0].url });
    } else {
      throw new Error("Fal.ai не вернул картинку");
    }

  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА API:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
