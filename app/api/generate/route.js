import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Добавляем случайное число, чтобы картинки были разными
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СТИЛЬ: РЕАЛИСТИЧНЫЙ ИМПРЕССИОНИЗМ ---
    // Мы просим нейросеть добавить мазки масла, игру света, но оставить детали.
    const finalPrompt = `Realistic impressionism style, oil painting texture, visible brushstrokes, vibrant light, cinematic lighting, highly detailed masterpiece, 8k: ${prompt}`;
    
    // Используем Pollinations (Бесплатно, модель Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Импрессионизм):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
