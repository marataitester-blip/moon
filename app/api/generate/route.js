import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СТИЛЬ: ФЭНТЕЗИ-РЕАЛИЗМ И ПСИХОЛОГИЗМ ---
    // Ключевые слова: cinematic, dramatic lighting, emotional atmosphere, mythic
    const finalPrompt = `High fantasy realism, cinematic, dramatic lighting, highly detailed masterpiece, 8k, emotional atmosphere, mythic: ${prompt}`;
    
    // Используем Pollinations (модель Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Фэнтези-Реализм):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
