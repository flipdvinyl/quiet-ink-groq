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
    if (req.url === '/generate-title' || req.url === '/api/generate-title') {
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
    } else if (req.url === '/translate' || req.url === '/api/translate') {
        try {
            const { text, targetLanguage } = req.body;

            if (!text) {
                return res.status(400).json({ error: 'Text is required in the request body.' });
            }

            if (!targetLanguage) {
                return res.status(400).json({ error: 'Target language is required in the request body.' });
            }

            let systemPrompt, userPrompt;
            
            if (targetLanguage === 'en') {
                systemPrompt = 'You are a professional translator. Translate the given Korean text to English. Maintain the original meaning and tone. Respond with only the translated text, without any additional explanation or quotation marks.';
                userPrompt = `Translate the following Korean text to English:\n\n${text}`;
            } else if (targetLanguage === 'ja') {
                systemPrompt = 'You are a professional translator. Translate the given Korean text to Japanese. Maintain the original meaning and tone. Respond with only the translated text, without any additional explanation or quotation marks.';
                userPrompt = `Translate the following Korean text to Japanese:\n\n${text}`;
            } else if (targetLanguage === 'ko') {
                systemPrompt = 'You are a professional translator. Translate the given English text to Korean. Maintain the original meaning and tone. Respond with only the translated text, without any additional explanation or quotation marks.';
                userPrompt = `Translate the following English text to Korean:\n\n${text}`;
            } else {
                return res.status(400).json({ error: 'Unsupported target language.' });
            }

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                model: 'llama3-8b-8192',
                temperature: 0.3,
                max_tokens: 2000,
            });

            const translatedText = chatCompletion.choices[0]?.message?.content?.trim() || '번역 실패';
            res.status(200).json({ translatedText });

        } catch (error) {
            console.error('Error calling Groq API for translation:', error);
            res.status(500).json({ error: 'Failed to translate text from Groq API.' });
        }
    } else {
        // 정의되지 않은 다른 모든 경로는 404 에러를 반환합니다.
        res.status(404).json({ error: 'Not Found' });
    }
};