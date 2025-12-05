class RandomQuotes {
    constructor() {
        this.API_URL = 'https://api.devnova.icu/api/tools/puppeteer';
        this.SOURCE_URL = 'https://quotes.toscrape.com';
        
        this.currentQuotes = [];
        this.history = JSON.parse(localStorage.getItem('quotesHistory')) || [];
        this.quoteCounter = parseInt(localStorage.getItem('quoteCounter')) || 1;
        
        this.initElements();
        this.setupEventListeners();
        this.loadInitialQuotes();
        this.updateTimestamp();
    }
    
    initElements() {
        // Quote elements
        this.quoteText = document.getElementById('quote-text');
        this.quoteAuthor = document.getElementById('quote-author');
        this.authorLink = document.getElementById('author-link');
        this.quoteTags = document.getElementById('quote-tags');
        this.quoteNumber = document.getElementById('quote-number');
        this.totalQuotes = document.getElementById('total-quotes');
        this.quoteDate = document.getElementById('quote-date');
        this.lastUpdated = document.getElementById('last-updated');
        this.apiStatus = document.getElementById('api-status');
        
        // Containers
        this.loading = document.getElementById('loading');
        this.quoteContainer = document.getElementById('quote-container');
        this.canvasOutput = document.getElementById('canvas-output');
        this.quotesHistory = document.getElementById('quotes-history');
        
        // Buttons
        this.newQuoteBtn = document.getElementById('new-quote-btn');
        this.copyQuoteBtn = document.getElementById('copy-quote-btn');
        this.tweetQuoteBtn = document.getElementById('tweet-quote-btn');
        this.downloadQuoteBtn = document.getElementById('download-quote-btn');
        this.scrapeNowBtn = document.getElementById('scrape-now-btn');
        this.clearCacheBtn = document.getElementById('clear-cache-btn');
        this.saveImageBtn = document.getElementById('save-image-btn');
        this.copyImageBtn = document.getElementById('copy-image-btn');
        this.closePreviewBtn = document.getElementById('close-preview-btn');
        
        // Controls
        this.pageSelect = document.getElementById('page-select');
        this.waitTimeSlider = document.getElementById('wait-time');
        this.waitTimeValue = document.getElementById('wait-time-value');
        this.includeTags = document.getElementById('include-tags');
        this.includeAuthor = document.getElementById('include-author');
        
        // Canvas
        this.canvas = document.getElementById('quote-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Toast
        this.toast = document.getElementById('toast');
        this.toastIcon = document.getElementById('toast-icon');
        this.toastMessage = document.getElementById('toast-message');
    }
    
    setupEventListeners() {
        // Quote actions
        this.newQuoteBtn.addEventListener('click', () => this.getRandomQuote());
        this.copyQuoteBtn.addEventListener('click', () => this.copyQuote());
        this.tweetQuoteBtn.addEventListener('click', () => this.tweetQuote());
        this.downloadQuoteBtn.addEventListener('click', () => this.generateImage());
        
        // Scraping controls
        this.scrapeNowBtn.addEventListener('click', () => this.scrapeQuotes());
        this.clearCacheBtn.addEventListener('click', () => this.clearCache());
        
        // Canvas actions
        this.saveImageBtn.addEventListener('click', () => this.saveImage());
        this.copyImageBtn.addEventListener('click', () => this.copyImage());
        this.closePreviewBtn.addEventListener('click', () => this.closePreview());
        
        // Controls
        this.waitTimeSlider.addEventListener('input', (e) => {
            this.waitTimeValue.textContent = `${e.target.value}s`;
        });
    }
    
    async loadInitialQuotes() {
        const cached = localStorage.getItem('cachedQuotes');
        const lastScrape = localStorage.getItem('lastScrape');
        
        if (cached && lastScrape) {
            const hours = (Date.now() - new Date(lastScrape)) / (1000 * 60 * 60);
            if (hours < 6) { // 6 hours cache
                this.currentQuotes = JSON.parse(cached);
                this.updateStats();
                this.getRandomQuote();
                return;
            }
        }
        
        await this.scrapeQuotes();
    }
    
    async scrapeQuotes() {
        this.showLoading();
        
        const page = this.pageSelect.value === 'random' 
            ? Math.floor(Math.random() * 10) + 1 
            : parseInt(this.pageSelect.value);
        
        const waitTime = parseFloat(this.waitTimeSlider.value) * 1000;
        
        const config = {
            url: `${this.SOURCE_URL}/page/${page}/`,
            type: 'data',
            waitUntil: 'networkidle2',
            waitForTimeout: waitTime,
            extractors: {
                selectors: {
                    quotes: {
                        selector: '.quote',
                        multiple: true,
                        type: 'html'
                    }
                }
            }
        };
        
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data.success && data.data?.standard?.custom?.quotes) {
                this.processQuotes(data.data.standard.custom.quotes);
                this.showToast('Quotes scraped successfully!', 'success');
                this.apiStatus.textContent = 'Live';
                this.apiStatus.className = 'api-live';
                
                localStorage.setItem('cachedQuotes', JSON.stringify(this.currentQuotes));
                localStorage.setItem('lastScrape', new Date().toISOString());
                
                this.getRandomQuote();
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Scraping error:', error);
            this.showToast('Using cached quotes', 'warning');
            this.apiStatus.textContent = 'Offline';
            this.apiStatus.className = '';
            
            if (this.currentQuotes.length === 0) {
                this.useFallbackQuotes();
            }
            
            this.getRandomQuote();
        } finally {
            this.hideLoading();
        }
    }
    
    processQuotes(quotesHTML) {
        this.currentQuotes = [];
        const parser = new DOMParser();
        
        quotesHTML.forEach(html => {
            const doc = parser.parseFromString(html, 'text/html');
            
            const textEl = doc.querySelector('.text');
            const authorEl = doc.querySelector('.author');
            const authorLinkEl = doc.querySelector('a[href^="/author/"]');
            const tagEls = doc.querySelectorAll('.tag');
            
            if (textEl && authorEl) {
                const text = textEl.textContent.replace(/^"|"$/g, '').trim();
                const author = authorEl.textContent.trim();
                const authorLink = authorLinkEl ? 
                    `${this.SOURCE_URL}${authorLinkEl.getAttribute('href')}` : '';
                
                const tags = Array.from(tagEls).map(tag => ({
                    text: tag.textContent.trim(),
                    link: `${this.SOURCE_URL}${tag.getAttribute('href')}`
                }));
                
                this.currentQuotes.push({
                    id: Date.now() + Math.random(),
                    text,
                    author,
                    authorLink,
                    tags,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        this.updateStats();
    }
    
    getRandomQuote() {
        if (this.currentQuotes.length === 0) {
            this.showToast('No quotes available', 'warning');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * this.currentQuotes.length);
        const quote = this.currentQuotes[randomIndex];
        
        this.displayQuote(quote);
        this.addToHistory(quote);
        
        this.quoteCounter++;
        this.quoteNumber.textContent = this.quoteCounter;
        localStorage.setItem('quoteCounter', this.quoteCounter.toString());
    }
    
    displayQuote(quote) {
        this.quoteText.textContent = `"${quote.text}"`;
        this.quoteAuthor.textContent = quote.author;
        
        if (quote.authorLink) {
            this.authorLink.href = quote.authorLink;
            this.authorLink.style.display = 'flex';
        } else {
            this.authorLink.style.display = 'none';
        }
        
        // Update tags
        this.quoteTags.innerHTML = '';
        if (this.includeTags.checked && quote.tags.length > 0) {
            quote.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.textContent = tag.text;
                tagEl.title = tag.text;
                tagEl.addEventListener('click', () => window.open(tag.link, '_blank'));
                this.quoteTags.appendChild(tagEl);
            });
        }
        
        this.hideLoading();
        this.quoteContainer.classList.remove('hidden');
        this.canvasOutput.classList.add('hidden');
    }
    
    addToHistory(quote) {
        this.history.unshift({
            ...quote,
            displayNumber: this.quoteCounter
        });
        
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        
        localStorage.setItem('quotesHistory', JSON.stringify(this.history));
        this.renderHistory();
    }
    
    renderHistory() {
        this.quotesHistory.innerHTML = '';
        
        if (this.history.length === 0) {
            this.quotesHistory.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-inbox"></i>
                    <p>No history yet</p>
                </div>
            `;
            return;
        }
        
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.addEventListener('click', () => this.loadHistory(index));
            
            const quoteEl = document.createElement('p');
            quoteEl.className = 'history-quote';
            quoteEl.textContent = `"${item.text.substring(0, 80)}${item.text.length > 80 ? '...' : ''}"`;
            
            const authorEl = document.createElement('p');
            authorEl.className = 'history-author';
            authorEl.textContent = `— ${item.author} (#${item.displayNumber})`;
            
            historyItem.appendChild(quoteEl);
            historyItem.appendChild(authorEl);
            this.quotesHistory.appendChild(historyItem);
        });
    }
    
    loadHistory(index) {
        const quote = this.history[index];
        this.displayQuote(quote);
        this.showToast('Loaded from history', 'info');
    }
    
    async generateImage() {
        this.showToast('Generating image...', 'info');
        
        const originalText = this.downloadQuoteBtn.innerHTML;
        this.downloadQuoteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        this.downloadQuoteBtn.disabled = true;
        
        try {
            // Fixed canvas size to prevent distortion
            const width = 600;
            const height = 300;
            
            this.canvas.width = width;
            this.canvas.height = height;
            
            // Clear canvas
            this.ctx.clearRect(0, 0, width, height);
            
            // Draw background
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, width, height);
            
            // Draw quote card design
            this.ctx.fillStyle = '#4361ee';
            this.ctx.fillRect(0, 0, 6, height);
            
            // Draw quote text
            const text = this.quoteText.textContent;
            const author = this.quoteAuthor.textContent;
            
            this.ctx.fillStyle = '#212529';
            this.ctx.font = 'italic 24px Merriweather';
            this.ctx.textAlign = 'center';
            
            // Wrap text
            const maxWidth = width - 80;
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0];
            
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = this.ctx.measureText(currentLine + ' ' + word).width;
                if (width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            
            // Draw lines
            const lineHeight = 32;
            const startY = height / 2 - (lines.length * lineHeight) / 2;
            
            lines.forEach((line, index) => {
                this.ctx.fillText(line, width / 2, startY + index * lineHeight);
            });
            
            // Draw author
            this.ctx.fillStyle = '#4361ee';
            this.ctx.font = 'bold 18px Inter';
            this.ctx.fillText(`— ${author}`, width / 2, startY + lines.length * lineHeight + 20);
            
            // Draw watermark
            this.ctx.fillStyle = '#adb5bd';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'right';
            this.ctx.fillText('DevNova Quotes', width - 20, height - 15);
            
            // Show preview
            this.canvasOutput.classList.remove('hidden');
            this.showToast('Image generated!', 'success');
            
        } catch (error) {
            console.error('Image generation failed:', error);
            this.showToast('Failed to generate image', 'error');
        } finally {
            this.downloadQuoteBtn.innerHTML = originalText;
            this.downloadQuoteBtn.disabled = false;
        }
    }
    
    saveImage() {
        const link = document.createElement('a');
        link.download = `quote-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast('Image saved!', 'success');
    }
    
    async copyImage() {
        try {
            this.canvas.toBlob(async (blob) => {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                this.showToast('Image copied!', 'success');
            });
        } catch (error) {
            this.showToast('Failed to copy image', 'error');
        }
    }
    
    closePreview() {
        this.canvasOutput.classList.add('hidden');
    }
    
    copyQuote() {
        const text = `${this.quoteText.textContent}\n— ${this.quoteAuthor.textContent}`;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Copied to clipboard!', 'success');
        });
    }
    
    tweetQuote() {
        const text = encodeURIComponent(`${this.quoteText.textContent} — ${this.quoteAuthor.textContent}`);
        const url = `https://twitter.com/intent/tweet?text=${text}&hashtags=Quotes,DevNova`;
        window.open(url, '_blank', 'width=550,height=420');
    }
    
    clearCache() {
        localStorage.removeItem('cachedQuotes');
        localStorage.removeItem('lastScrape');
        localStorage.removeItem('quotesHistory');
        localStorage.removeItem('quoteCounter');
        
        this.currentQuotes = [];
        this.history = [];
        this.quoteCounter = 1;
        
        this.updateStats();
        this.renderHistory();
        this.showToast('Cache cleared!', 'success');
    }
    
    updateStats() {
        this.totalQuotes.textContent = this.currentQuotes.length;
        this.lastUpdated.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    updateTimestamp() {
        const now = new Date();
        this.quoteDate.textContent = now.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        setInterval(() => this.updateTimestamp(), 60000);
    }
    
    useFallbackQuotes() {
        this.currentQuotes = [
            {
                id: 1,
                text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.",
                author: "Albert Einstein",
                authorLink: "https://quotes.toscrape.com/author/Albert-Einstein",
                tags: [
                    { text: "change", link: "https://quotes.toscrape.com/tag/change/" },
                    { text: "thinking", link: "https://quotes.toscrape.com/tag/thinking/" }
                ]
            },
            {
                id: 2,
                text: "It is our choices, Harry, that show what we truly are, far more than our abilities.",
                author: "J.K. Rowling",
                authorLink: "https://quotes.toscrape.com/author/J-K-Rowling",
                tags: [
                    { text: "abilities", link: "https://quotes.toscrape.com/tag/abilities/" },
                    { text: "choices", link: "https://quotes.toscrape.com/tag/choices/" }
                ]
            },
            {
                id: 3,
                text: "There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle.",
                author: "Albert Einstein",
                authorLink: "https://quotes.toscrape.com/author/Albert-Einstein",
                tags: [
                    { text: "inspirational", link: "https://quotes.toscrape.com/tag/inspirational/" },
                    { text: "life", link: "https://quotes.toscrape.com/tag/life/" }
                ]
            }
        ];
        
        this.updateStats();
    }
    
    showLoading() {
        this.loading.classList.remove('hidden');
        this.quoteContainer.classList.add('hidden');
        this.canvasOutput.classList.add('hidden');
    }
    
    hideLoading() {
        this.loading.classList.add('hidden');
        this.quoteContainer.classList.remove('hidden');
    }
    
    showToast(message, type = 'info') {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: '#4cc9f0',
            error: '#f94144',
            warning: '#f8961e',
            info: '#4361ee'
        };
        
        this.toastIcon.className = `fas ${icons[type]}`;
        this.toast.style.borderLeftColor = colors[type];
        this.toastMessage.textContent = message;
        
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const app = new RandomQuotes();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            app.getRandomQuote();
        }
        if (e.ctrlKey && e.code === 'KeyC') {
            app.copyQuote();
        }
    });
});
