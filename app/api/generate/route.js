import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Вспомогательная функция для перевода
async function translateRuToEn(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка перевода');
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    console.error('Ошибка перевода:', error);
    return text; 
  }
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log("Получен промпт (RU):", prompt);

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт не указан' }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: 'FAL_KEY не настроен' }, { status: 500 });
    }

    const translatedPrompt = await translateRuToEn(prompt);
    console.log("Промпт после перевода (EN):", translatedPrompt);

    const enhancedPrompt = `${translatedPrompt}, masterpiece, best quality, highly detailed, sharp focus, stunning visuals, 8k resolution, cinematic lighting, photorealistic`;

    console.log("Отправка в Fal.ai (Flux Schnell)...");

    // ИСПРАВЛЕНО: URL изменен на fal-ai/flux/schnell
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_size: "square_hd",
        enable_safety_checker: false,
        num_inference_steps: 4, 
        seed: Math.floor(Math.random() * 1000000) 
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
      console.log("Успех! Сгенерирован URL:", data.images[0].url);
      return NextResponse.json({ imageUrl: data.images[0].url });
    } else {
      throw new Error("Fal.ai не вернул картинку");
    }

  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА API:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
