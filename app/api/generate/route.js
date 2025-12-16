import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СТИЛЬ: СЮЖЕТ, ПОЛНЫЙ РОСТ, КОМПОЗИЦИЯ ---
    // Мы добавляем ключевые слова:
    // - "Narrative scene" (повествовательная сцена - для сюжета)
    // - "full body view or three-quarter view" (полный рост или три четверти)
    // - "masterful composition" (мастерская композиция)
    // - "cinematic lighting" (киношный свет)
    // - "detailed environment conveying plot" (детализированное окружение, раскрывающее сюжет)
    const finalPrompt = `Narrative scene, full body view or three-quarter view character, masterful composition, cinematic storytelling, dramatic lighting, high fantasy realism, detailed environment conveying plot, expressive pose, masterpiece, 8k, emotional atmosphere: ${prompt}`;
    
    // Используем Pollinations (модель Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Сюжет и композиция):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
