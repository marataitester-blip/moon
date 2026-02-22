import { NextResponse } from 'next/server';

// Увеличиваем лимит времени для Vercel до 60 секунд, чтобы нейросеть успела
export const maxDuration = 60; 

export async function POST(request) {
  try {
    // 1. Получаем запрос от пользователя
    const body = await request.json();
    const { prompt } = body;
    
    // Проверяем ключ OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Критическая ошибка: OPENAI_API_KEY не найден в переменных окружения Vercel');
      return NextResponse.json({ error: 'Ключ OpenAI не настроен' }, { status: 500 });
    }

    // --- МАГИЯ СТИЛЯ ЗДЕСЬ ---
    // Мы добавляем эти теги к любому твоему запросу, чтобы получить нужную атмосферу.
    // Можно менять этот список, чтобы корректировать стиль.
    const styleModifiers = "magical realism, soft cinematic lighting, highly detailed artr, 16+";
    
    // Собираем итоговый промпт: запрос пользователя + стиль
    const finalPrompt = `${prompt}. Style: ${styleModifiers}`;

    console.log(`Отправляем в DALL-E 2 улучшенный промпт: "${finalPrompt}"`);

    // 2. Отправляем запрос в OpenAI
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-2",       // Используем быструю и недорогую модель
        prompt: finalPrompt,     // Передаем наш улучшенный промпт
        n: 1,                    // Одна картинка
        size: "512x512"          // Оптимальный размер
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Ошибка OpenAI API:', data.error);
      throw new Error(data.error?.message || 'Ошибка на стороне OpenAI');
    }

    // 3. Получаем прямую ссылку на готовую картинку
    const imageUrl = data.data[0].url;
    console.log("Картинка успешно создана. Ссылка получена.");

    // 4. Отдаем ссылку обратно в чат
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка в роуте генерации:', error);
    return NextResponse.json({ error: 'Генерация временно недоступна' }, { status: 500 });
  }
}
