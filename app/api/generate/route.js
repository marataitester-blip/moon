import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Случайное число для уникальности
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- LUNA VISION: USER PRIORITY + SOFT SENSUALITY ---
    // Главный приоритет: Точное следование описанию пользователя.
    // Стиль: Мягкий, чувственный, реалистичный (без мистики и драмы).
    
    const styleSettings = `
    INSTRUCTION PRIORITY: USER PROMPT IS ABSOLUTE. Follow the user's description of characters, actions, and setting strictly.
    
    VISUAL STYLE (Atmosphere only):
    - Mood: Soft, sensual, intimate, tender, emotional, human.
    - Lighting: Soft natural light, golden hour, diffuse glow, flattering and gentle (no harsh dramatic shadows).
    - Colors: Warm pastel tones, soft golds, natural skin tones, muted elegance.
    - Composition: Focus on the main subject as described by user. Background is soft and complementary.
    - Texture: High-quality photorealism with a gentle touch.
    
    NEGATIVE CONSTRAINTS (Do NOT use):
    - No fantasy magic, no glowing eyes, no demon wings (unless asked).
    - No excessive drama or aggressive contrast.
    - No explicit "erotic art" tags, focus on natural sensuality instead.
    `;
    
    // Мы ставим ваш запрос (prompt) НА ПЕРВОЕ МЕСТО
    const finalPrompt = `Create an image strictly based on this description: "${prompt}". \n\n Apply this visual style delicately: ${styleSettings}`;
    
    // Генерируем ссылку (Flux Model)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Soft & Real):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json({ error: 'Ошибка генерации изображения' }, { status: 500 });
  }
}
