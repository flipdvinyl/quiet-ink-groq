require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ttsHandler = require('./ttsHandler');
const generateTitleHandler = require('./generateTitleHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/tts', ttsHandler);
app.post('/api/generate-title', generateTitleHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});