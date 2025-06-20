const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(bodyParser.json());

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
  const { text, voice_id } = req.body;
  if (!text) {
    return res.status(400).json({ error: '텍스트가 필요합니다.' });
  }
  const useVoiceId = voice_id || 'weKbNjMh2V5MuXziwHwjoT';
  try {
    const response = await axios.post(
      `https://supertoneapi.com/v1/text-to-speech/${useVoiceId}`,
      {
        text,
        language: 'ko',
        style: 'neutral',
        model: 'sona_speech_1'
      },
      {
        headers: {
          'x-sup-api-key': '1f6f3292d2cee64b0402f7ce00bda08a',
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    res.set('Content-Type', 'audio/wav');
    res.send(response.data);
  } catch (err) {
    console.error('TTS 변환 실패(전체 에러):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    if (err.response) {
      console.error('TTS 변환 실패(응답 데이터):', err.response.data);
      console.error('TTS 변환 실패(응답 상태):', err.response.status);
      console.error('TTS 변환 실패(응답 헤더):', err.response.headers);
    }
    res.status(500).json({ error: 'TTS 변환 실패', details: err.message });
  }
});

app.listen(4000, '0.0.0.0', () => console.log('API 서버 실행중: http://0.0.0.0:4000'));