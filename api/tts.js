require('dotenv').config();
const axios = require('axios');

module.exports = async (req, res) => {
  // CORS pre-flight 요청을 포함하여 모든 요청에 CORS 헤더를 적용합니다.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-sup-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 처리합니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 요청 본문에서 text와 voice_id를 추출합니다.
  const { text, voice_id, language, style, model, voice_settings } = req.body;

  if (!text) {
    console.log("오류: 텍스트 내용이 없어 400 에러 반환");
    return res.status(400).json({ error: '텍스트가 필요합니다.' });
  }
  
  // 기본값 설정
  const useVoiceId = voice_id || 'weKbNjMh2V5MuXziwHwjoT';
  const useLanguage = language || 'ko';
  const useStyle = style || 'neutral';
  const useModel = model || 'sona_speech_1';
  
  // voice_settings 기본값
  const defaultVoiceSettings = {
    'pitch_shift': 0,
    'pitch_variance': 1,
    'speed': 1
  };
  
  // 외부에서 요청된 voice_settings가 있으면 기본값과 병합
  const useVoiceSettings = voice_settings 
    ? { ...defaultVoiceSettings, ...voice_settings }
    : defaultVoiceSettings;
    
  const apiKey = process.env.SUPERTONE_API_KEY;

  if (!apiKey) {
    console.error("경고: SUPERTONE_API_KEY 환경변수가 서버에 설정되지 않았습니다.");
    return res.status(500).json({ error: 'SUPERTONE_API_KEY is not configured on the server.' });
  }

  try {
    const requestPayload = {
      text,
      language: useLanguage,
      style: useStyle,
      model: useModel,
      voice_settings: useVoiceSettings
    };
    const requestHeaders = {
      'x-sup-api-key': apiKey,
      'Content-Type': 'application/json'
    };

    const supertoneResponse = await axios.post(
      `https://supertoneapi.com/v1/text-to-speech/${useVoiceId}`,
      requestPayload,
      {
        headers: requestHeaders,
        responseType: 'arraybuffer'
      }
    );

    res.setHeader('Content-Type', 'audio/wav');
    res.status(200).send(supertoneResponse.data);

  } catch (err) {
    console.error("--- Supertone API 요청 실패 ---");
    if (err.response) {
      let errorResponseData = '(바이너리 데이터)';
      try {
        errorResponseData = err.response.data.toString('utf-8');
      } catch (e) {
        // 변환 실패시 그냥 둠
      }
      console.error('TTS 변환 실패(응답 상태):', err.response.status);
      console.error('TTS 변환 실패(응답 데이터):', errorResponseData);
      res.status(err.response.status).send(err.response.data);
    } else {
      console.error('TTS 변환 실패(전체 에러 메시지):', err.message);
      res.status(500).json({ error: 'TTS 변환 실패', details: err.message });
    }
  }
};