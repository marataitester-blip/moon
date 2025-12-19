import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Случайное число
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- ЖЕСТКИЙ РЕЖИМ (ТЕХНИЧЕСКИ ИСПРАВЛЕННЫЙ) ---
    // Мы пишем инструкцию в одну строку без спецсимволов.
    // Перевод инструкции: "СТРОГО: Рисуй ТОЧНО то, что описано. Фон и свет только из контекста. Никакой отсебятины."
    
    const rules = "STRICT MODE: Render EXACTLY what is described. Background and lighting must derive ONLY from the context of the subject. No random styles.";
    
    // Склеиваем
    const finalPrompt = `${rules} ${prompt}`;
    
    // Генерируем ссылку (Pollinations Flux)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация:", imageUrl);

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
