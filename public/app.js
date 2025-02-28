document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sourceText = document.getElementById('source-text');
    const translatedText = document.getElementById('translated-text');
    const targetLanguage = document.getElementById('target-language');
    const detectedLanguage = document.getElementById('detected-language');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const historyList = document.getElementById('history-list');
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // Translation history
    let translationHistory = [];
    let lastDetectedLanguage = 'en';
    
    // Initialize
    const init = async () => {
        // Load supported languages
        await loadLanguages();
        
        // Set default target language based on browser language
        const browserLang = navigator.language.split('-')[0];
        if (targetLanguage.querySelector(`option[value="${browserLang}"]`)) {
            targetLanguage.value = browserLang;
        } else {
            targetLanguage.value = 'en';
        }
        
        // Load translation history from localStorage
        loadTranslationHistory();
    };
    
    // Load supported languages
    const loadLanguages = async () => {
        try {
            const response = await fetch('/api/languages');
            const languages = await response.json();
            
            // Populate target language dropdown
            targetLanguage.innerHTML = '';
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = lang.name;
                targetLanguage.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading languages:', error);
            showError('Failed to load supported languages');
        }
    };
    
    // Translate text
    const translateText = async () => {
        const text = sourceText.value.trim();
        const target = targetLanguage.value;
        
        if (!text) {
            showError('Please enter text to translate');
            return;
        }
        
        showLoading(true);
        
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    targetLang: target
                })
            });
            
            if (!response.ok) {
                throw new Error('Translation failed');
            }
            
            const data = await response.json();
            
            // Update UI
            translatedText.textContent = data.translatedText;
            detectedLanguage.textContent = getLanguageName(data.detectedLanguage);
            lastDetectedLanguage = data.detectedLanguage;
            
            // Add to history
            addToHistory({
                sourceText: data.originalText,
                translatedText: data.translatedText,
                sourceLang: data.detectedLanguage,
                targetLang: data.targetLanguage,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Translation error:', error);
            showError('Failed to translate text. Please try again.');
        } finally {
            showLoading(false);
        }
    };
    
    // Get language name from code
    const getLanguageName = (code) => {
        const option = targetLanguage.querySelector(`option[value="${code}"]`);
        return option ? option.textContent : code.toUpperCase();
    };
    
    // Add translation to history
    const addToHistory = (translation) => {
        // Add to the beginning of the array
        translationHistory.unshift(translation);
        
        // Limit history to 10 items
        if (translationHistory.length > 10) {
            translationHistory.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
        
        // Update UI
        renderHistory();
    };
    
    // Load translation history from localStorage
    const loadTranslationHistory = () => {
        const savedHistory = localStorage.getItem('translationHistory');
        if (savedHistory) {
            try {
                translationHistory = JSON.parse(savedHistory);
                renderHistory();
            } catch (error) {
                console.error('Error loading history:', error);
                translationHistory = [];
            }
        }
    };
    
    // Render translation history
    const renderHistory = () => {
        historyList.innerHTML = '';
        
        if (translationHistory.length === 0) {
            historyList.innerHTML = '<div class="no-history">No translation history yet</div>';
            return;
        }
        
        translationHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.index = index;
            
            const sourceLangName = getLanguageName(item.sourceLang);
            const targetLangName = getLanguageName(item.targetLang);
            
            historyItem.innerHTML = `
                <div class="languages">${sourceLangName} → ${targetLangName}</div>
                <div class="text">${truncateText(item.sourceText, 50)}</div>
                <div class="translation">${truncateText(item.translatedText, 50)}</div>
            `;
            
            historyItem.addEventListener('click', () => loadFromHistory(index));
            historyList.appendChild(historyItem);
        });
    };
    
    // Load translation from history
    const loadFromHistory = (index) => {
        const item = translationHistory[index];
        
        sourceText.value = item.sourceText;
        translatedText.textContent = item.translatedText;
        detectedLanguage.textContent = getLanguageName(item.sourceLang);
        targetLanguage.value = item.targetLang;
        lastDetectedLanguage = item.sourceLang;
    };
    
    // Swap languages
    const swapLanguages = () => {
        // Can only swap if we have a translation
        if (translatedText.textContent === 'Translation will appear here...') {
            return;
        }
        
        const currentSourceText = sourceText.value;
        const currentTargetText = translatedText.textContent;
        const currentTargetLang = targetLanguage.value;
        
        // Swap text
        sourceText.value = currentTargetText;
        translatedText.textContent = 'Translation will appear here...';
        
        // Swap languages
        targetLanguage.value = lastDetectedLanguage;
        detectedLanguage.textContent = getLanguageName(currentTargetLang);
        lastDetectedLanguage = currentTargetLang;
    };
    
    // Clear source text
    const clearText = () => {
        sourceText.value = '';
        translatedText.textContent = 'Translation will appear here...';
        detectedLanguage.textContent = 'Auto-detect';
        sourceText.focus();
    };
    
    // Copy translated text to clipboard
    const copyTranslation = () => {
        if (translatedText.textContent === 'Translation will appear here...') {
            return;
        }
        
        navigator.clipboard.writeText(translatedText.textContent)
            .then(() => {
                // Show temporary success message
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text:', err);
            });
    };
    
    // Helper function to truncate text
    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    };
    
    // Show loading indicator
    const showLoading = (isLoading) => {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    };
    
    // Show error message
    const showError = (message) => {
        alert(message);
    };
    
    // Event Listeners
    translateBtn.addEventListener('click', translateText);
    
    sourceText.addEventListener('keydown', (e) => {
        // Ctrl+Enter or Cmd+Enter to translate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            translateText();
        }
    });
    
    swapBtn.addEventListener('click', swapLanguages);
    clearBtn.addEventListener('click', clearText);
    copyBtn.addEventListener('click', copyTranslation);
    
    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.classList.remove('hidden');
    });
    
    closeAboutBtn.addEventListener('click', () => {
        aboutModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.classList.add('hidden');
        }
    });
    
    // Initialize the app
    init();
});