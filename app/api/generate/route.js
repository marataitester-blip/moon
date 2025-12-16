import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Случайное число для вариативности
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- РЕЖИМ: STRICT GROUND TRUTH ---
    // Мы создаем жесткую инструкцию: "Смотри только на запрос".
    // Фон и свет должны быть "по контексту" (Contextual), а не случайными.
    
    const rules = `
    CRITICAL INSTRUCTION:
    1. The USER PROMPT is the absolute law. Render EXACTLY what is described.
    2. CONTEXTUAL LOGIC: Derive the background, lighting, and composition *solely* from the subject and mood implied in the prompt. Do not add random artistic styles unless asked.
    3. FOCUS: The subject described by the user is the highest priority.
    `;
    
    // Формируем итоговый запрос
    const finalPrompt = `${rules} USER PROMPT: ${prompt}`;
    
    // Генерируем ссылку (Flux Model)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Строгий режим):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json({ error: 'Ошибка генерации изображения' }, { status: 500 });
  }
}
