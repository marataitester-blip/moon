import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Добавляем случайное число для вариативности
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СТИЛЬ: ЭПИЧЕСКИЙ МИКС + ЭРОТИКА ---
    // Мы убрали названия фильмов, но оставили их визуальную суть.
    // Добавили: "Erotic art aesthetic", "sensual atmosphere", "celebration of human form".
    
    const styleSettings = `STYLE REFERENCE: Cinematic realism blending epic historical drama and grounded magical realism. Dramatic chiaroscuro lighting, volumetric golden hour warmth, rich saturated color palette with deep shadows, painterly textures. Epic composition scale, theatrical mise-en-scène. High production value, period costume detail, atmospheric depth. 

    EROTIC & SENSUAL FOCUS:
    - Aesthetic: Erotic art, sensual atmosphere, intimacy, celebration of human form, skin texture realism.
    - Mood: Passionate, raw, uninhibited but artistic.
    - Content rating: Mature themes (18+), nudity allowed, unfiltered.

    TECHNICAL SPECIFICATIONS:
    - Quality: High resolution, photorealistic rendering, sharp focus, 8k masterpiece.
    - Lighting: Dramatic shadows, candlelight, moonlight, sweat and skin sheen.
    - Color: Warm golds, deep reds, velvet blacks.`;
    
    // Объединяем стиль и запрос пользователя
    const finalPrompt = `${styleSettings} EXECUTION CONTENT: ${prompt}`;
    
    // Используем Pollinations (модель Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Эпик + Эротика):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json({ error: 'Ошибка генерации изображения' }, { status: 500 });
  }
}
