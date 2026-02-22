import { NextResponse } from 'next/server';

// Увеличиваем лимит времени до 60 секунд для Vercel
export const maxDuration = 60; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Проверяем, есть ли ключ
    const hfKey = process.env.HF_API_KEY;
    if (!hfKey) {
      console.error('Ключ HF_API_KEY не настроен в Vercel');
      return NextResponse.json({ error: 'Ключ не настроен' }, { status: 500 });
    }

    // Ограничиваем длину и добавляем стили реализма
    const safePrompt = prompt.substring(0, 300);
    const styleTags = "soft realism, aesthetic, beautiful, mild erotica, masterpiece, highly detailed, soft lighting";
    const finalPrompt = `${safePrompt}, ${styleTags}`;

    console.log("Отправляем запрос к Hugging Face (SDXL)...");

    // Обращаемся к надежной модели Stable Diffusion XL
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        headers: {
          "Authorization": `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: finalPrompt }),
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка сервера HF: ${response.status}`);
    }

    // HF отдает саму картинку файлом (blob). Превращаем её в код (Base64) для базы данных
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    // Формируем формат, который сразу поймет тег <img> в чате
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Критическая ошибка генератора:', error);
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
