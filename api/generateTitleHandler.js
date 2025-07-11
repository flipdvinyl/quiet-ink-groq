const Groq = require('groq-sdk');
const groq = new Groq();

module.exports = async function generateTitleHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required in the request body.' });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an API that generates a suitable title for the given text. Respond with only the title, without any additional explanation or quotation marks. The title should be in Korean. The title should be concise and no more than 12 characters.'
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
    res.status(500).json({ error: 'Failed to generate title from Groq API.' });
  }
}; 