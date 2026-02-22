import { NextResponse } from 'next/server';

// Увеличиваем лимит времени для Vercel до 60 секунд
export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Используем ключ OpenAI из настроек Vercel
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Критическая ошибка: OPENAI_API_KEY не найден в переменных окружения Vercel');
      return NextResponse.json({ error: 'Ключ OpenAI не настроен' }, { status: 500 });
    }

    console.log("Запрос к OpenAI (DALL-E 2) по промпту:", prompt);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "512x512" // Оптимальный размер для скорости и экономии баланса
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Ошибка OpenAI API:', data.error);
      throw new Error(data.error?.message || 'Ошибка на стороне OpenAI');
    }

    // OpenAI возвращает прямую временную ссылку на картинку
    const imageUrl = data.data[0].url;
    console.log("Картинка успешно создана. Ссылка получена.");

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка в роуте генерации:', error);
    return NextResponse.json({ error: 'Генерация временно недоступна' }, { status: 500 });
  }
}
