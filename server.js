const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(bodyParser.json());

require('dotenv').config();

// (3) 요청 로깅 미들웨어 (운영시엔 제거 가능)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.post('/api/summarize-title', async (req, res) => {
  let { text } = req.body;
  if (text && text.length > 2000) {
    text = text.slice(0, 2000);
  }
  const prompt = `
  본문\n${text}
  \n------\n\n
 Generate a Korean book-style title based on the input text.

Constraints:
	•	The title must be in Korean only.
	•	Keep it under 15 characters (ideally under 10).
	•	Do not include any of the following banned words:
	•	제목
	•	Do not use any special characters or symbols.
	•	Output only the title, in a single line.
	•	Do not include any explanations, translations, or commentary.
	•	The title should feel natural, meaningful, and like a real book title.
  아래 단어는 포함되면 안되\n
  - 시스템, 언어, 한국어, 제목, Title, summary, language, characters, Korean
    `;
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt,
      stream: false
    });
    let title = response.data.response.trim().split('\n')[0];
    res.json({ title });
  } catch (e) {
    res.json({ title: '제목 생성 실패' });
    console.error('제목 생성 실패:', e.response?.data || e.message);
  }
});

app.post('/api/tts', async (req, res) => {
  console.log("--- /api/tts 요청 수신 ---");
  const { text, voice_id } = req.body;
  console.log("요청 받은 text (앞 20자):", text ? text.substring(0, 20) + '...' : '내용 없음');
  console.log("요청 받은 voice_id:", voice_id);

  if (!text) {
    console.log("오류: 텍스트 내용이 없어 400 에러 반환");
    return res.status(400).json({ error: '텍스트가 필요합니다.' });
  }
  const useVoiceId = voice_id || 'weKbNjMh2V5MuXziwHwjoT';
  const apiKey = process.env.SUPERTONE_API_KEY;

  console.log("TTS에 사용될 voice_id:", useVoiceId);
  console.log("환경변수에서 API 키를 로드했는가?:", !!apiKey);
  if (apiKey) {
    console.log("로드된 API 키 (앞 4자리만 표시):", apiKey.substring(0, 4) + '...');
  } else {
    console.log("경고: SUPERTONE_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  try {
    const requestPayload = {
      text,
      language: 'ko',
      style: 'neutral',
      model: 'sona_speech_1'
    };
    const requestHeaders = {
      'x-sup-api-key': apiKey,
      'Content-Type': 'application/json'
    };

    console.log("Supertone API로 요청 전송 시작...");

    const response = await axios.post(
      `https://supertoneapi.com/v1/text-to-speech/${useVoiceId}`,
      requestPayload,
      {
        headers: requestHeaders,
        responseType: 'arraybuffer'
      }
    );
    console.log("--- Supertone API 요청 성공 ---");
    console.log("응답 상태 코드:", response.status);
    res.set('Content-Type', 'audio/wav');
    res.send(response.data);
  } catch (err) {
    console.error("--- Supertone API 요청 실패 ---");
    if (err.response) {
      // 버퍼로 된 에러 데이터를 문자열로 변환하여 출력
      let errorResponseData = '(바이너리 데이터)';
      try {
        errorResponseData = err.response.data.toString('utf-8');
      } catch (e) {
        // 변환 실패시 그냥 둠
      }
      console.error('TTS 변환 실패(응답 상태):', err.response.status);
      console.error('TTS 변환 실패(응답 데이터):', errorResponseData);
    } else {
      console.error('TTS 변환 실패(전체 에러 메시지):', err.message);
    }
    res.status(500).json({ error: 'TTS 변환 실패', details: err.message });
  }
});

app.listen(4000, '0.0.0.0', () => console.log('API 서버 실행중: http://0.0.0.0:4000'));