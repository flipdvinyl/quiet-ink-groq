const axios = require('axios');

module.exports = async function ttsHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-sup-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { text, voice_id, language } = req.body;
  if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });

  const useVoiceId = voice_id || 'weKbNjMh2V5MuXziwHwjoT';
  const apiKey = process.env.SUPERTONE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SUPERTONE_API_KEY is not configured on the server.' });

  try {
    const requestPayload = {
      text,
      language: language || 'ko',
      style: 'neutral',
      model: 'sona_speech_1'
    };
    const requestHeaders = {
      'x-sup-api-key': apiKey,
      'Content-Type': 'application/json'
    };
    const supertoneResponse = await axios.post(
      `https://supertoneapi.com/v1/text-to-speech/${useVoiceId}`,
      requestPayload,
      { headers: requestHeaders, responseType: 'arraybuffer' }
    );
    res.setHeader('Content-Type', 'audio/wav');
    res.status(200).send(supertoneResponse.data);
  } catch (err) {
    res.status(500).json({ error: 'TTS 변환 실패', details: err.message });
  }
}; 