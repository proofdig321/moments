import { franc } from 'franc';

const SOUTH_AFRICAN_LANGUAGES = {
  'afr': 'Afrikaans',
  'eng': 'English', 
  'nso': 'Northern Sotho',
  'sot': 'Southern Sotho',
  'ssw': 'Swazi',
  'tsn': 'Tswana',
  'tso': 'Tsonga',
  'ven': 'Venda',
  'xho': 'Xhosa',
  'zul': 'Zulu',
  'nde': 'Ndebele'
};

export const detectLanguage = (text) => {
  if (!text || text.length < 10) {
    return { code: 'und', name: 'Undetermined', confidence: 0 };
  }
  
  try {
    // Check for common SA language patterns first
    if (/\b(sawubona|ngiyabonga|hamba|yebo)\b/i.test(text)) {
      return { code: 'zul', name: 'Zulu', confidence: 0.7 };
    }
    if (/\b(molo|enkosi|hamba|ewe)\b/i.test(text)) {
      return { code: 'xho', name: 'Xhosa', confidence: 0.7 };
    }
    if (/\b(dumela|ke|go|ga)\b/i.test(text)) {
      return { code: 'tsn', name: 'Tswana', confidence: 0.7 };
    }
    
    const detected = franc(text, { minLength: 3 });
    const languageName = SOUTH_AFRICAN_LANGUAGES[detected] || 'Unknown';
    
    return {
      code: detected,
      name: languageName,
      confidence: detected !== 'und' ? 0.8 : 0.1
    };
    
  } catch (error) {
    console.error('Language detection error:', error);
    return { code: 'und', name: 'Undetermined', confidence: 0 };
  }
};

export const preserveOriginalMessage = (message, detectedLanguage) => {
  // Never normalize or translate automatically
  // Preserve code-switching, slang, and mixed languages
  return {
    original: message,
    language: detectedLanguage,
    normalized: false,
    translated: false
  };
};