import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СТИЛЬ: ФОКУС НА ПЕРСОНАЖЕ И ЭМОЦИЯХ ---
    // Мы говорим: "Фокус на портрете, дизайн персонажа, выразительное лицо".
    // Фон станет размытым или менее важным.
    const finalPrompt = `Character portrait, focus on subject, expressive face, high fantasy realism, dramatic lighting, detailed texture, masterpiece, 8k, emotional, psychological: ${prompt}`;
    
    // Используем Pollinations (модель Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Портретный фокус):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
