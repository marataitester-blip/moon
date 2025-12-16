import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СТИЛЬ: ЭПИЧЕСКАЯ КЛАССИКА И РОМАНТИЗМ ---
    // Референсы: "Pride and Prejudice", "Downton Abbey", "Gone with the Wind".
    // Ключевые слова: Cinematic period drama aesthetic, rich colors, soft dramatic lighting, elegant composition.
    // Мы просим "Atmospheric storytelling" (атмосферное повествование), чтобы избежать простых портретов.
    const finalPrompt = `Cinematic period drama aesthetic, style of Pride and Prejudice and Downton Abbey, romantic realism, rich textures, soft dramatic lighting, elegant composition, atmospheric storytelling, Gone with the Wind visual style, masterpiece, 8k, highly detailed: ${prompt}`;
    
    // Используем Pollinations (модель Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Кино-Романтика):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
