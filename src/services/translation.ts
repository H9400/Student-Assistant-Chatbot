import type { Message } from '../types/chat';

export async function translate(
  text: string,
  targetLanguage: string
): Promise<string> {
  try {
    const response = await fetch('http://localhost:5000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_lang: targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

export async function translateMessage(
  message: Message,
  targetLanguage: string
): Promise<Message> {
  if (targetLanguage === 'en') {
    return message;
  }

  const translatedContent = await translate(message.content, targetLanguage);
  
  return {
    ...message,
    content: translatedContent,
  };
}