import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Твои базовые стили (мягкий реализм)
    const styleTags = "soft realism, aesthetic, beautiful, mild erotica, masterpiece, highly detailed, soft lighting";
    let finalPrompt = `${prompt}, ${styleTags}`;

    // 1. Используем твой ключ OpenRouter для перевода на английский
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    
    if (openRouterKey) {
      try {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Используем бесплатную модель для перевода, чтобы не тратить твой баланс
            model: 'meta-llama/llama-3.1-8b-instruct:free', 
            messages: [
              { 
                role: 'system', 
                content: `Translate the user's image request to English. Return strictly ONLY the English translation. No intro, no quotes. Then append this exact text: , ${styleTags}` 
              },
              { role: 'user', content: prompt }
            ]
          })
        });
        
        const aiData = await aiResponse.json();
        if (aiData.choices && aiData.choices[0]) {
           finalPrompt = aiData.choices[0].message.content.trim();
           console.log("Промпт переведен:", finalPrompt);
        }
      } catch (e) {
        console.error("Ошибка перевода OpenRouter:", e);
      }
    }

    // 2. Защита от ошибки 1013 (обрезаем длину)
    if (finalPrompt.length > 800) {
        finalPrompt = finalPrompt.substring(0, 800);
    }
    
    // 3. Формируем чистую ссылку на картинку
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Ошибка в API генератора:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
