const express = require('express');
const cors = require('cors');
const tts = require('./tts');
const generateTitle = require('./generate-title');

const app = express();
app.use(cors());
app.use(express.json());

// 서버리스 핸들러를 Express 라우터로 래핑
app.post('/api/tts', (req, res) => tts(req, res));
app.post('/api/generate-title', (req, res) => generateTitle(req, res));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`llm-api server running on http://localhost:${PORT}`);
}); 