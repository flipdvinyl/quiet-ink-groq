require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Groq 클라이언트를 초기화합니다.
// API 키는 환경 변수에서 자동으로 불러옵니다.
const groq = new Groq();

// Vercel에서 서버리스 함수로 작동하기 위한 래퍼
module.exports = async (req, res) => {
    // POST 요청만 처리하도록 강제합니다.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // Express의 라우팅 기능을 모방합니다.
    // 여기서는 /generate-title 경로만 처리합니다.
    if (req.url === '/generate-title') {
        try {
            const { text } = req.body;

            if (!text) {
                return res.status(400).json({ error: 'Text is required in the request body.' });
            }

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
                model: 'llama3-8b-8192', // Llama 3의 8B 모델 사용
                temperature: 0.7,
                max_tokens: 30, // 제목은 길 필요가 없으므로 토큰 수를 제한합니다.
            });

            const title = chatCompletion.choices[0]?.message?.content?.trim() || '제목 생성 실패';
            res.status(200).json({ title });

        } catch (error) {
            console.error('Error calling Groq API:', error);
            res.status(500).json({ error: 'Failed to generate title from Groq API.' });
        }
    } else {
        // 정의되지 않은 다른 모든 경로는 404 에러를 반환합니다.
        res.status(404).json({ error: 'Not Found' });
    }
};