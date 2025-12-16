import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СТИЛЬ: ЖЕСТКИЙ РЕАЛИЗМ И ТОЧНОСТЬ ---
    // Мы убираем фэнтези и киношность.
    // Ключевые слова:
    // - "Raw photograph" (сырая фотография, без фильтров)
    // - "gritty realism" (суровый/зернистый реализм)
    // - "natural light" (естественный свет)
    // - "documentary style" (документальный стиль, фиксация реальности)
    // - "STRICTLY accurate to description" (СТРОГО точно по описанию - это приказ нейросети не выдумывать)
    const finalPrompt = `Raw photograph, gritty realism, natural light, documentary style, highly detailed, sharp focus, 8k, STRICTLY accurate to description: ${prompt}`;
    
    // Используем Pollinations (модель Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Жесткий реализм):", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
