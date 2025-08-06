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

  // 요청 본문에서 파라미터들을 추출합니다.
  const { text, voice_id, language, style, model, voice_settings } = req.body;

  // 상세한 요청 로깅 추가
  console.log('📥 받은 요청 본문:', JSON.stringify(req.body, null, 2));
  console.log('📥 받은 language 값:', language);
  console.log('📥 language 타입:', typeof language);
  console.log('📥 language 길이:', language ? language.length : 'undefined');

  if (!text) {
    console.log("오류: 텍스트 내용이 없어 400 에러 반환");
    return res.status(400).json({ error: '텍스트가 필요합니다.' });
  }

  const useVoiceId = voice_id || 'weKbNjMh2V5MuXziwHwjoT';
  
  // 기본값 설정 (하드코딩된 값들)
  const defaultLanguage = 'ko';
  const defaultStyle = 'neutral';
  const defaultModel = 'sona_speech_1';
  const defaultVoiceSettings = {
    'pitch_shift': 0,
    'pitch_variance': 1,
    'speed': 1
  };
  
  // 개선된 언어 처리 로직
  let useLanguage = defaultLanguage;
  
  // 언어 값이 유효한지 확인
  if (language && typeof language === 'string' && language.trim() !== '') {
    const trimmedLanguage = language.trim();
    // 지원하는 언어 코드인지 확인
    if (['ko', 'en', 'ja'].includes(trimmedLanguage)) {
      useLanguage = trimmedLanguage;
      console.log('✅ 유효한 언어 코드 감지:', useLanguage);
    } else {
      console.log('⚠️ 지원하지 않는 언어 코드:', trimmedLanguage, '-> 기본값 사용');
    }
  } else {
    console.log('⚠️ 언어 값이 유효하지 않음 -> 기본값 사용');
  }
  
  // 외부 요청 값이 있으면 사용, 없으면 기본값 사용
  const useStyle = (style && typeof style === 'string' && style.trim() !== '') ? style.trim() : defaultStyle;
  const useModel = (model && typeof model === 'string' && model.trim() !== '') ? model.trim() : defaultModel;
  const useVoiceSettings = (voice_settings && typeof voice_settings === 'object') ? voice_settings : defaultVoiceSettings;
  
  console.log('📥 받은 요청:', { language, style, voice_settings });
  console.log('🎤 사용할 값:', { useLanguage, useStyle, useVoiceSettings });
  
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

    console.log('🚀 Supertone API 요청 페이로드:', JSON.stringify(requestPayload, null, 2));
    console.log('🔑 Supertone API 요청 헤더:', JSON.stringify(requestHeaders, null, 2));

    const supertoneResponse = await axios.post(
      `https://supertoneapi.com/v1/text-to-speech/${useVoiceId}`,
      requestPayload,
      {
        headers: requestHeaders,
        responseType: 'arraybuffer'
      }
    );

    console.log('✅ Supertone API 응답 성공 - 데이터 크기:', supertoneResponse.data.byteLength, 'bytes');

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
      console.error('TTS 변환 실패(응답 헤더):', err.response.headers);
      console.error('TTS 변환 실패(응답 데이터):', errorResponseData);
      res.status(err.response.status).send(err.response.data);
    } else {
      console.error('TTS 변환 실패(전체 에러 메시지):', err.message);
      res.status(500).json({ error: 'TTS 변환 실패', details: err.message });
    }
  }
};