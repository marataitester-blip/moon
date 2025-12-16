import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Случайное число для уникальности
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- LUNA VISION: EPIC MAGICAL REALISM STYLE ---
    // На основе анализа ваших изображений:
    // 1. Свет: Контровой (Rim light), свечение кожи, драматичные лучи.
    // 2. Композиция: Строго по центру, фон "обнимает" героя.
    // 3. Атмосфера: Мифическая, чувственная, "больше чем жизнь".
    
    const styleSettings = `
    STYLE DEFINITION: Epic Magical Realism with High-End Cinematography.
    
    COMPOSITION RULES (STRICT):
    - Center-Weighted Composition: The main subject (character/object) MUST be in the absolute center.
    - Background Logic: The environment is built AROUND the subject to frame and highlight them, creating a halo effect, swirl, or depth behind them. The background serves the subject.
    - Depth of Field: Sharp focus on the central subject, slightly softer/atmospheric background (bokeh, fog, clouds, light rays, fire).
    
    VISUAL AESTHETICS:
    - Lighting: Divine/Dramatic backlighting (rim light), glowing skin effect, volumetric god rays, golden hour or mystic moonlight, high contrast (chiaroscuro).
    - Texture: Hyper-realistic skin and materials, but with a painterly, mythic touch.
    - Mood: Emotional, ethereal, sensual, powerful, "Larger than life".
    - Content: Mature themes allowed (18+), unfiltered beauty, artistic nudity.
    
    EXECUTION INSTRUCTION:
    Create a masterpiece image based on the user's description, ensuring the subject is the focal point of the universe with glowing, dramatic lighting.
    `;
    
    // Объединяем настройки и запрос пользователя
    const finalPrompt = `${styleSettings} USER PROMPT: ${prompt}`;
    
    // Генерируем ссылку (Flux Model)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (LUNA Style):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json({ error: 'Ошибка генерации изображения' }, { status: 500 });
  }
}
