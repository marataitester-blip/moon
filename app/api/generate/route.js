import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Добавляем те самые стили мягкого реализма
    const rules = "soft realism, aesthetic, beautiful, mild erotica, masterpiece, highly detailed, soft lighting";
    const finalPrompt = `${prompt}, ${rules}`;
    
    // Создаем случайный сид, чтобы картинки не повторялись
    const seed = Math.floor(Math.random() * 1000000);
    
    // Формируем прямую ссылку (Pollinations работает абсолютно БЕЗ ключей)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

    // Отправляем ссылку обратно в чат
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка в API генератора:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
