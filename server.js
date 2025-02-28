const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Translation API endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // For demo purposes, we'll use a simple language detection algorithm
    // In a production app, you would use a proper API for this
    const detectedLang = detectLanguage(text);
    
    // Simulate translation (in a real app, you would use a translation API)
    const translatedText = await simulateTranslation(text, detectedLang, targetLang);
    
    res.json({
      originalText: text,
      translatedText,
      detectedLanguage: detectedLang,
      targetLanguage: targetLang
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

// Get supported languages
app.get('/api/languages', (req, res) => {
  res.json(getSupportedLanguages());
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Helper functions

// Simple language detection based on character sets and common words
// This is a simplified version for demo purposes
function detectLanguage(text) {
  const sample = text.toLowerCase().substring(0, 100);
  
  // Check for languages with distinct character sets
  const patterns = {
    ru: /[а-яё]/i,
    ja: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/,
    zh: /[\u4e00-\u9fff]/,
    ko: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
    ar: /[\u0600-\u06FF]/,
    hi: /[\u0900-\u097F]/,
    th: /[\u0E00-\u0E7F]/,
    he: /[\u0590-\u05FF]/,
    el: /[\u0370-\u03FF]/
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(sample)) {
      return lang;
    }
  }
  
  // Check for European languages based on common words and letter frequencies
  const commonWords = {
    en: ['the', 'and', 'is', 'in', 'to', 'it', 'of', 'that'],
    es: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'una'],
    fr: ['le', 'la', 'de', 'et', 'est', 'en', 'un', 'une', 'je', 'vous'],
    de: ['der', 'die', 'das', 'und', 'ist', 'in', 'zu', 'den', 'mit'],
    it: ['il', 'la', 'di', 'e', 'che', 'un', 'una', 'in', 'per'],
    pt: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para']
  };
  
  const words = sample.split(/\s+/);
  const langScores = {};
  
  for (const [lang, commonWordList] of Object.entries(commonWords)) {
    langScores[lang] = words.filter(word => commonWordList.includes(word)).length;
  }
  
  const detectedLang = Object.entries(langScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)[0];
  
  // Default to English if no language is detected
  return detectedLang ? detectedLang[0] : 'en';
}

// Simulate translation (in a real app, you would use a translation API)
async function simulateTranslation(text, sourceLang, targetLang) {
  // In a real app, you would call a translation API here
  // For demo purposes, we'll just append the language codes
  
  // Common phrases in different languages for demo
  const commonPhrases = {
    en: {
      en: text,
      es: text.length > 20 ? 'Traducción al español: ' + text : 'Hola mundo',
      fr: text.length > 20 ? 'Traduction en français: ' + text : 'Bonjour le monde',
      de: text.length > 20 ? 'Deutsche Übersetzung: ' + text : 'Hallo Welt',
      it: text.length > 20 ? 'Traduzione italiana: ' + text : 'Ciao mondo',
      ru: text.length > 20 ? 'Перевод на русский: ' + text : 'Привет, мир',
      zh: text.length > 20 ? '中文翻译: ' + text : '你好，世界',
      ja: text.length > 20 ? '日本語訳: ' + text : 'こんにちは世界',
      ko: text.length > 20 ? '한국어 번역: ' + text : '안녕하세요 세계',
      ar: text.length > 20 ? 'الترجمة العربية: ' + text : 'مرحبا بالعالم',
      hi: text.length > 20 ? 'हिंदी अनुवाद: ' + text : 'नमस्ते दुनिया'
    },
    es: {
      en: text.length > 20 ? 'English translation: ' + text : 'Hello world',
      es: text,
      fr: text.length > 20 ? 'Traduction en français: ' + text : 'Bonjour le monde'
    }
    // Add more languages as needed
  };
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return translation if available, otherwise return original text with a note
  if (commonPhrases[sourceLang] && commonPhrases[sourceLang][targetLang]) {
    return commonPhrases[sourceLang][targetLang];
  }
  
  return `[Translation from ${sourceLang} to ${targetLang}] ${text}`;
}

// Get supported languages
function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'th', name: 'Thai' },
    { code: 'he', name: 'Hebrew' },
    { code: 'el', name: 'Greek' }
  ];
}