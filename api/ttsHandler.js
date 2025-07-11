const axios = require('axios');

module.exports = async function ttsHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-sup-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // 디버깅을 위한 로그 추가
  console.log('=== TTS API Debug ===');
  console.log('req.body:', req.body);
  console.log('req.body.language:', req.body.language);
  console.log('req.body type:', typeof req.body);
  console.log('req.body.language type:', typeof req.body.language);
  
  const { text, voice_id, language } = req.body;
  if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });

  const useVoiceId = voice_id || 'weKbNjMh2V5MuXziwHwjoT';
  const apiKey = process.env.SUPERTONE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SUPERTONE_API_KEY is not configured on the server.' });

  try {
    // 언어 설정 (기본값: 한국어)
    const detectedLanguage = language || 'ko';
    console.log('Final language to use:', detectedLanguage);
    
    const requestPayload = {
      text,
      language: detectedLanguage,
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