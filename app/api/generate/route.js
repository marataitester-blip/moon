import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Добавляем случайное число для вариативности
    const seed = Math.floor(Math.random() * 1000000);
    
    // --- НОВЫЙ СУПЕР-ПРОМПТ (GWTW + Harry Potter) ---
    // Мы берем ваше детальное описание стиля и технические требования.
    // Нейросеть получает команду: "Рисуй в ЭТОМ стиле, а содержание возьми из запроса пользователя".
    
    const styleSettings = `STYLE REFERENCE: Cinematic realism inspired by "Gone with the Wind" and "Harry Potter" film series. Dramatic chiaroscuro lighting, volumetric golden hour warmth, rich saturated color palette with deep shadows, painterly textures. Epic composition scale, theatrical mise-en-scène. High production value, period costume detail, atmospheric depth. Photorealistic rendering, sharp focus, 8k masterpiece. Mature themes and artistic nudity permitted.`;
    
    // Объединяем стиль и запрос пользователя
    const finalPrompt = `${styleSettings} EXECUTION CONTENT: ${prompt}`;
    
    // Используем Pollinations (модель Flux)
    // Мы кодируем промпт, чтобы спецсимволы не ломали ссылку
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log("Генерация (Супер-Промпт):", imageUrl);

    // Возвращаем ссылку на фронтенд
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json({ error: 'Ошибка генерации изображения' }, { status: 500 });
  }
}
