// app/api/generate/route.js

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Вспомогательная функция для перевода (простой хак без ключа)
async function translateRuToEn(text) {
  try {
    // Используем общедоступный endpoint Google Translate
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка перевода');
    const data = await response.json();
    // Google Translate возвращает вложенный массив, берем первую часть
    return data[0][0][0];
  } catch (error) {
    console.error('Ошибка перевода:', error);
    // В случае ошибки возвращаем оригинал (вдруг это уже английский)
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

    // ШАГ 1: Автоматический системный перевод на английский
    const translatedPrompt = await translateRuToEn(prompt);
    console.log("Промпт после перевода (EN):", translatedPrompt);

    // ШАГ 2: Усиление промпта (промпт-инъекция для качества)
    // Убираем таро-теги, добавляем универсальные теги качества
    const enhancedPrompt = `${translatedPrompt}, masterpiece, best quality, highly detailed, sharp focus, stunning visuals, 8k resolution, cinematic lighting, photorealistic`;

    console.log("Отправка в Fal.ai (Flux Schnell)...");

    // ШАГ 3: Обращение к fal.ai (переключаем на FLUX SCHNELL)
    // URL: https://fal.run/fal-ai/flux-schnell
    const response = await fetch('https://fal.run/fal-ai/flux-schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt, // Отправляем усиленный английский промпт
        image_size: "square_hd",
        enable_safety_checker: false,
        num_inference_steps: 4, // Ускоряет генерацию Flux Schnell
        seed: Math.floor(Math.random() * 1000000) // Добавляем случайность
      }),
      cache: 'no-store' 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка от Fal.ai:', errorText);
      return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
    }

    const data = await response.json();
    
    // fal.ai возвращает ответ в виде массива images
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
