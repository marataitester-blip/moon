import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // 1. Жесткая защита от ошибки 1013 (особенно для русского языка)
    // Оставляем только первые 200 символов от твоего запроса
    const safePrompt = prompt.substring(0, 200);
    
    // 2. Добавляем твои стили
    const styleTags = "soft realism, aesthetic, beautiful, mild erotica, masterpiece, highly detailed, soft lighting";
    const finalPrompt = `${safePrompt}, ${styleTags}`;
    
    // 3. Уникальный сид, чтобы картинки всегда были разными
    const seed = Math.floor(Math.random() * 1000000);
    
    // 4. Прямая ссылка на генератор Pollinations (РАБОТАЕТ БЕЗ КЛЮЧЕЙ)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

    console.log("Сгенерирована ссылка:", imageUrl);

    // 5. Отдаем ссылку обратно в наш чат
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка в API генератора:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
