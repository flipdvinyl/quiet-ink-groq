require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tts = require('./tts');
const generateTitle = require('./generate-title');
const translate = require('./index');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 서버리스 핸들러를 Express 라우터로 래핑
app.post('/api/tts', (req, res) => tts(req, res));
app.post('/api/generate-title', (req, res) => generateTitle(req, res));
app.post('/api/translate', (req, res) => translate(req, res));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`llm-api server running on http://localhost:${PORT}`);
  console.log('Environment variables loaded:');
  console.log('- SUPERTONE_API_KEY:', process.env.SUPERTONE_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✓ Set' : '✗ Missing');
}); 