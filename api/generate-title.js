const Groq = require('groq-sdk');
const cors = require('cors');

const corsHandler = cors({ origin: true });
const groq = new Groq();

module.exports = async (req, res) => {
  // CORS pre-flight 요청을 처리
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required in the request body.' });
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an API that generates a suitable title for the given text. Respond with only the title, without any additional explanation or quotation marks. The title should be in Korean. The title should be concise and no more than 10 characters.'
          },
          {
            role: 'user',
            content: `다음 글의 제목을 지어줘:\n\n${text}`
          }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 30,
      });

      const title = chatCompletion.choices[0]?.message?.content?.trim() || '제목 생성 실패';
      res.status(200).json({ title });

    } catch (error) {
      console.error('Error calling Groq API:', error);
      res.status(500).json({ error: 'Failed to generate title from Groq API.' });
    }
  });
};