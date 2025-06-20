const axios = require('axios');
const cors = require('cors');

const corsHandler = cors({ origin: true });

module.exports = async (req, res) => {
  // CORS pre-flight 요청을 처리합니다.
  if (req.method === 'OPTIONS') {
    return corsHandler(req, res, () => res.status(200).end());
  }

  // POST 요청만 처리합니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 요청 본문에서 text와 voice_id를 추출합니다.
  const { text, voice_id } = req.body;
  if (!text || !voice_id) {
    return res.status(400).json({ error: 'text and voice_id are required' });
  }

  // Supertone API 키를 환경 변수에서 안전하게 가져옵니다.
  const apiKey = process.env.SUPERTONE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SUPERTONE_API_KEY is not configured on the server.' });
  }

  try {
    // Supertone API에 TTS 요청을 보냅니다.
    const supertoneResponse = await axios.post(
      'https://api.supertone.ai/v1/speech',
      {
        text: text,
        voice_id: voice_id,
      },
      {
        headers: {
          'x-session-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // 오디오 데이터를 바이너리 형태로 받습니다.
      }
    );

    // Supertone으로부터 받은 오디오 데이터를 클라이언트에게 그대로 전달합니다.
    res.setHeader('Content-Type', 'audio/wav');
    res.status(200).send(supertoneResponse.data);

  } catch (error) {
    console.error('Error calling Supertone API:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: 'Failed to generate speech from Supertone API.',
      details: error.response ? Buffer.from(error.response.data).toString() : null,
    });
  }
};