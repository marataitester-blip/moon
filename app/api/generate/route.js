import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    // Получаем "сырой" запрос пользователя
    const { prompt } = body;
    
    // Случайное число для уникальности генераций при одинаковом запросе
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- ПОЛНАЯ СВОБОДА ---
    // Мы больше ничего не добавляем к вашим словам.
    // Ваш запрос отправляется в нейросеть в чистом виде.
    const finalPrompt = prompt;
    
    // Генерируем ссылку (Flux Model)
    // encodeURIComponent нужен, чтобы спецсимволы в тексте не ломали ссылку
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Raw Input):", finalPrompt);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json({ error: 'Ошибка генерации изображения' }, { status: 500 });
  }
}
