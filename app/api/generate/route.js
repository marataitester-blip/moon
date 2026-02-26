import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request) {
  try {
    const { prompt, quality } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: 'Ключ не найден' }, { status: 500 });

    // Выбираем модель и параметры в зависимости от выбора пользователя
    const isPremium = quality === 'premium';
    const model = isPremium ? "dall-e-3" : "dall-e-2";
    const size = isPremium ? "1024x1024" : "512x512";

    // Тот самый промпт, который тебе понравился
    const styleModifiers = "Style: Magic realism. Cinematic shot on 35mm vintage film, heavy grain, muted colors, moody atmosphere, high contrast, 1970s aesthetic, intricate textures, masterpiece, no glossy look, no 3D render feel, natural lighting";
    const finalPrompt = `${prompt}. ${styleModifiers}`;

    console.log(`Запрос [${model}]: ${prompt}`);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: finalPrompt,
        n: 1,
        size: size,
        response_format: "b64_json" 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Ошибка OpenAI:', data.error);
      return NextResponse.json({ error: data.error?.message }, { status: response.status });
    }

    const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Сбой:', error);
    return NextResponse.json({ error: 'Сбой генератора' }, { status: 500 });
  }
}
