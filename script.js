class RandomQuoteGenerator {
    constructor() {
        // API Configuration
        this.API_URL = 'https://api.devnova.icu/api/tools/puppeteer';
        this.SOURCE_URL = 'https://quotes.toscrape.com';
        
        // State Management
        this.currentQuotes = [];
        this.currentPage = 1;
        this.totalQuotes = 0;
        this.quoteCounter = parseInt(localStorage.getItem('quoteCounter')) || 1;
        this.history = JSON.parse(localStorage.getItem('quotesHistory')) || [];
        
        // Canvas Configuration
        this.canvas = document.getElementById('quote-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasStyle = {
            width: 800,
            height: 400,
            backgroundColor: '#ffffff',
            padding: 40,
            fontFamily: 'Merriweather',
            primaryColor: '#4a6fa5',
            secondaryColor: '#6b8cbc',
            textColor: '#2c3e50',
            authorColor: '#4a6fa5'
        };
        
        // Initialize application
        this.initElements();
        this.setupEventListeners();
        this.loadInitialData();
        
        // Update timestamp
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 60000);
    }
    
    initElements() {
        // Quote Elements
        this.quoteText = document.getElementById('quote-text');
        this.quoteAuthor = document.getElementById('quote-author');
        this.authorLink = document.getElementById('author-link');
        this.quoteTags = document.getElementById('quote-tags');
        this.quoteNumber = document.getElementById('quote-number');
        this.totalQuotesEl = document.getElementById('total-quotes');
        this.quoteDate = document.getElementById('quote-date');
        this.lastUpdated = document.getElementById('last-updated');
        this.apiStatus = document.getElementById('api-status');
        
        // Containers
        this.loadingEl = document.getElementById('loading');
        this.quoteContainer = document.getElementById('quote-container');
        this.quotesHistory = document.getElementById('quotes-history');
        this.canvasOutput = document.getElementById('canvas-output');
        
        // Buttons
        this.newQuoteBtn = document.getElementById('new-quote-btn');
        this.copyQuoteBtn = document.getElementById('copy-quote-btn');
        this.tweetQuoteBtn = document.getElementById('tweet-quote-btn');
        this.downloadQuoteBtn = document.getElementById('download-quote-btn');
        this.scrapeNowBtn = document.getElementById('scrape-now-btn');
        this.apiTestBtn = document.getElementById('api-test-btn');
        this.saveImageBtn = document.getElementById('save-image-btn');
        this.shareImageBtn = document.getElementById('share-image-btn');
        
        // Controls
        this.pageSelect = document.getElementById('page-select');
        this.waitTimeSlider = document.getElementById('wait-time');
        this.waitTimeValue = document.getElementById('wait-time-value');
        this.includeTags = document.getElementById('include-tags');
        this.includeAuthor = document.getElementById('include-author');
        
        // Toast
        this.toast = document.getElementById('toast');
        this.toastIcon = document.getElementById('toast-icon');
        this.toastMessage = document.getElementById('toast-message');
    }
    
    setupEventListeners() {
        // Quote Actions
        this.newQuoteBtn.addEventListener('click', () => this.getRandomQuote());
        this.copyQuoteBtn.addEventListener('click', () => this.copyToClipboard());
        this.tweetQuoteBtn.addEventListener('click', () => this.shareOnTwitter());
        this.downloadQuoteBtn.addEventListener('click', () => this.generateCanvasImage());
        
        // Scraping Controls
        this.scrapeNowBtn.addEventListener('click', () => this.scrapeQuotes());
        this.apiTestBtn.addEventListener('click', () => this.testAPIConnection());
        
        // Canvas Actions
        this.saveImageBtn.addEventListener('click', () => this.saveCanvasImage());
        this.shareImageBtn.addEventListener('click', () => this.shareCanvasImage());
        
        // Settings
        this.waitTimeSlider.addEventListener('input', (e) => {
            this.waitTimeValue.textContent = `${e.target.value}ms`;
        });
        
        // History click events will be added dynamically
    }
    
    async loadInitialData() {
        this.showLoading();
        
        // Try to load cached quotes first
        const cachedQuotes = localStorage.getItem('cachedQuotes');
        const lastScrape = localStorage.getItem('lastScrapeTime');
        
        if (cachedQuotes && lastScrape) {
            const lastScrapeDate = new Date(lastScrape);
            const now = new Date();
            const hoursDiff = (now - lastScrapeDate) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) { // Cache valid for 24 hours
                this.currentQuotes = JSON.parse(cachedQuotes);
                this.totalQuotes = this.currentQuotes.length;
                this.showToast('Loaded quotes from cache', 'info');
                this.getRandomQuote();
                this.hideLoading();
                return;
            }
        }
        
        // If no cache or cache expired, scrape fresh quotes
        await this.scrapeQuotes();
    }
    
    async scrapeQuotes() {
        this.showLoading();
        this.apiStatus.textContent = 'Scraping...';
        this.apiStatus.style.color = this.canvasStyle.warningColor;
        
        const page = this.pageSelect.value === 'random' 
            ? Math.floor(Math.random() * 10) + 1 
            : this.pageSelect.value;
        
        const waitTime = parseInt(this.waitTimeSlider.value);
        
        const config = {
            url: `${this.SOURCE_URL}/page/${page}/`,
            type: 'data',
            waitUntil: 'networkidle2',
            timeout: 30000,
            waitForTimeout: waitTime,
            viewport: { width: 1920, height: 1080 },
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data?.standard?.custom?.quotes) {
                this.processQuotes(data.data.standard.custom.quotes, page);
                this.apiStatus.textContent = 'Live';
                this.apiStatus.style.color = this.canvasStyle.successColor;
                this.showToast(`Successfully scraped ${this.currentQuotes.length} quotes from page ${page}`, 'success');
                
                // Cache the quotes
                localStorage.setItem('cachedQuotes', JSON.stringify(this.currentQuotes));
                localStorage.setItem('lastScrapeTime', new Date().toISOString());
                
                // Update last updated time
                this.lastUpdated.textContent = new Date().toLocaleTimeString();
                
                // Display a random quote
                this.getRandomQuote();
            } else {
                throw new Error('Invalid response format from API');
            }
            
        } catch (error) {
            console.error('Scraping failed:', error);
            this.apiStatus.textContent = 'Offline';
            this.apiStatus.style.color = this.canvasStyle.accentColor;
            this.showToast(`Scraping failed: ${error.message}. Using fallback quotes.`, 'error');
            this.useFallbackQuotes();
        } finally {
            this.hideLoading();
        }
    }
    
    processQuotes(quotesHTML, page) {
        this.currentQuotes = [];
        
        const parser = new DOMParser();
        
        quotesHTML.forEach(html => {
            try {
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extract quote text
                const textEl = doc.querySelector('.text');
                let text = textEl ? textEl.textContent.trim() : '';
                
                // Remove surrounding quotes if present
                text = text.replace(/^"|"$/g, '');
                
                // Extract author
                const authorEl = doc.querySelector('.author');
                const author = authorEl ? authorEl.textContent.trim() : 'Unknown';
                
                // Extract author link
                const authorLinkEl = doc.querySelector('a[href^="/author/"]');
                const authorLink = authorLinkEl ? `${this.SOURCE_URL}${authorLinkEl.getAttribute('href')}` : '';
                
                // Extract tags
                const tags = [];
                const tagEls = doc.querySelectorAll('.tag');
                tagEls.forEach(tagEl => {
                    const tagText = tagEl.textContent.trim();
                    const tagLink = `${this.SOURCE_URL}${tagEl.getAttribute('href')}`;
                    if (tagText) {
                        tags.push({
                            text: tagText,
                            link: tagLink
                        });
                    }
                });
                
                if (text && author) {
                    this.currentQuotes.push({
                        id: Date.now() + Math.random(),
                        text,
                        author,
                        authorLink,
                        tags,
                        timestamp: new Date().toISOString(),
                        sourcePage: page
                    });
                }
            } catch (error) {
                console.warn('Failed to parse quote HTML:', error);
            }
        });
        
        this.totalQuotes = this.currentQuotes.length;
        this.totalQuotesEl.textContent = this.totalQuotes;
        this.currentPage = page;
    }
    
    getRandomQuote() {
        if (this.currentQuotes.length === 0) {
            this.showToast('No quotes available. Please scrape first.', 'warning');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * this.currentQuotes.length);
        const quote = this.currentQuotes[randomIndex];
        
        this.displayQuote(quote);
        this.addToHistory(quote);
        
        // Update counter
        this.quoteCounter++;
        this.quoteNumber.textContent = this.quoteCounter;
        localStorage.setItem('quoteCounter', this.quoteCounter);
    }
    
    displayQuote(quote) {
        // Update quote text
        this.quoteText.textContent = `"${quote.text}"`;
        
        // Update author
        this.quoteAuthor.textContent = quote.author;
        
        // Update author link
        if (quote.authorLink) {
            this.authorLink.href = quote.authorLink;
            this.authorLink.style.display = 'inline-flex';
        } else {
            this.authorLink.style.display = 'none';
        }
        
        // Update tags
        this.quoteTags.innerHTML = '';
        if (this.includeTags.checked && quote.tags.length > 0) {
            quote.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag-item';
                tagEl.textContent = tag.text;
                tagEl.addEventListener('click', () => {
                    window.open(tag.link, '_blank');
                });
                this.quoteTags.appendChild(tagEl);
            });
        } else if (this.includeTags.checked) {
            const noTags = document.createElement('span');
            noTags.className = 'text-muted small';
            noTags.textContent = 'No tags available';
            this.quoteTags.appendChild(noTags);
        }
        
        // Show the quote container
        this.hideLoading();
        this.quoteContainer.classList.remove('hidden');
        
        // Hide canvas output
        this.canvasOutput.classList.add('hidden');
    }
    
    addToHistory(quote) {
        // Check if quote already exists in history
        const existingIndex = this.history.findIndex(item => item.id === quote.id);
        
        if (existingIndex !== -1) {
            // Remove existing and add to beginning
            this.history.splice(existingIndex, 1);
        }
        
        // Add to beginning of history
        this.history.unshift({
            ...quote,
            displayNumber: this.quoteCounter
        });
        
        // Keep only last 15 quotes in history
        if (this.history.length > 15) {
            this.history = this.history.slice(0, 15);
        }
        
        localStorage.setItem('quotesHistory', JSON.stringify(this.history));
        this.renderHistory();
    }
    
    renderHistory() {
        this.quotesHistory.innerHTML = '';
        
        if (this.history.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-history';
            emptyState.innerHTML = `
                <i class="fas fa-inbox"></i>
                <p>No history yet. Start scraping!</p>
            `;
            this.quotesHistory.appendChild(emptyState);
            return;
        }
        
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.addEventListener('click', () => this.loadHistoryQuote(index));
            
            const quoteEl = document.createElement('p');
            quoteEl.className = 'history-quote';
            const shortText = item.text.length > 100 
                ? item.text.substring(0, 100) + '...' 
                : item.text;
            quoteEl.textContent = `"${shortText}"`;
            
            const authorEl = document.createElement('p');
            authorEl.className = 'history-author';
            authorEl.textContent = `— ${item.author} (#${item.displayNumber})`;
            
            historyItem.appendChild(quoteEl);
            historyItem.appendChild(authorEl);
            this.quotesHistory.appendChild(historyItem);
        });
    }
    
    loadHistoryQuote(index) {
        const quote = this.history[index];
        this.displayQuote(quote);
        this.showToast('Loaded quote from history', 'info');
    }
    
    async generateCanvasImage() {
        this.showToast('Generating image...', 'info');
        
        // Show loading state on canvas button
        const originalText = this.downloadQuoteBtn.innerHTML;
        this.downloadQuoteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        this.downloadQuoteBtn.disabled = true;
        
        try {
            // Use html2canvas to capture the quote card
            const quoteCard = document.querySelector('.quote-card');
            
            const canvas = await html2canvas(quoteCard, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                foreignObjectRendering: false
            });
            
            // Update the preview canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height);
            
            // Add watermark
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillText('Generated by DevNova-ID Random Quotes Generator', 20, this.canvas.height - 20);
            
            // Show canvas output
            this.canvasOutput.classList.remove('hidden');
            this.showToast('Image generated successfully!', 'success');
            
        } catch (error) {
            console.error('Canvas generation failed:', error);
            this.showToast('Failed to generate image', 'error');
        } finally {
            // Restore button state
            this.downloadQuoteBtn.innerHTML = originalText;
            this.downloadQuoteBtn.disabled = false;
        }
    }
    
    saveCanvasImage() {
        try {
            // Convert canvas to data URL
            const dataURL = this.canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `quote-${timestamp}.png`;
            link.href = dataURL;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Image saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save image:', error);
            this.showToast('Failed to save image', 'error');
        }
    }
    
    shareCanvasImage() {
        // For now, we'll just copy the data URL to clipboard
        // In a real app, you would integrate with social media APIs
        this.canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                this.showToast('Image copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy image:', err);
                this.showToast('Failed to share image', 'error');
            });
        });
    }
    
    async copyToClipboard() {
        const quote = this.quoteText.textContent;
        const author = this.quoteAuthor.textContent;
        const textToCopy = `${quote}\n\n— ${author}\n\nGenerated by DevNova-ID Random Quotes Generator`;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            this.showToast('Quote copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showToast('Quote copied to clipboard!', 'success');
        }
    }
    
    shareOnTwitter() {
        const quote = this.quoteText.textContent.replace(/^"|"$/g, '');
        const author = this.quoteAuthor.textContent;
        const text = `"${quote}" — ${author}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=Quotes,Inspiration,DevNova`;
        
        window.open(url, '_blank', 'width=550,height=420');
    }
    
    async testAPIConnection() {
        this.showToast('Testing API connection...', 'info');
        
        try {
            const response = await fetch(this.API_URL, {
                method: 'OPTIONS'
            });
            
            if (response.ok) {
                this.showToast('API connection successful!', 'success');
                this.apiStatus.textContent = 'Live';
                this.apiStatus.style.color = this.canvasStyle.successColor;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.showToast(`API connection failed: ${error.message}`, 'error');
            this.apiStatus.textContent = 'Offline';
            this.apiStatus.style.color = this.canvasStyle.accentColor;
        }
    }
    
    useFallbackQuotes() {
        // Fallback quotes in case API fails
        this.currentQuotes = [
            {
                id: 1,
                text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.",
                author: "Albert Einstein",
                authorLink: "https://quotes.toscrape.com/author/Albert-Einstein",
                tags: [
                    { text: "change", link: "https://quotes.toscrape.com/tag/change/" },
                    { text: "thinking", link: "https://quotes.toscrape.com/tag/thinking/" },
                    { text: "world", link: "https://quotes.toscrape.com/tag/world/" }
                ],
                timestamp: new Date().toISOString(),
                sourcePage: 1
            },
            {
                id: 2,
                text: "It is our choices, Harry, that show what we truly are, far more than our abilities.",
                author: "J.K. Rowling",
                authorLink: "https://quotes.toscrape.com/author/J-K-Rowling",
                tags: [
                    { text: "abilities", link: "https://quotes.toscrape.com/tag/abilities/" },
                    { text: "choices", link: "https://quotes.toscrape.com/tag/choices/" }
                ],
                timestamp: new Date().toISOString(),
                sourcePage: 1
            },
            {
                id: 3,
                text: "There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle.",
                author: "Albert Einstein",
                authorLink: "https://quotes.toscrape.com/author/Albert-Einstein",
                tags: [
                    { text: "inspirational", link: "https://quotes.toscrape.com/tag/inspirational/" },
                    { text: "life", link: "https://quotes.toscrape.com/tag/life/" },
                    { text: "live", link: "https://quotes.toscrape.com/tag/live/" }
                ],
                timestamp: new Date().toISOString(),
                sourcePage: 1
            }
        ];
        
        this.totalQuotes = this.currentQuotes.length;
        this.totalQuotesEl.textContent = this.totalQuotes;
        
        this.getRandomQuote();
        this.hideLoading();
    }
    
    updateTimestamp() {
        const now = new Date();
        this.quoteDate.textContent = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    showLoading() {
        this.loadingEl.classList.remove('hidden');
        this.quoteContainer.classList.add('hidden');
        this.canvasOutput.classList.add('hidden');
    }
    
    hideLoading() {
        this.loadingEl.classList.add('hidden');
        this.quoteContainer.classList.remove('hidden');
    }
    
    showToast(message, type = 'info') {
        // Set icon based on type
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        this.toastIcon.className = `fas ${icons[type]}`;
        this.toastMessage.textContent = message;
        
        // Set color based on type
        const colors = {
            success: '#2ecc71',
            error: '#ff6b6b',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        this.toast.style.borderLeftColor = colors[type];
        
        // Show toast
        this.toast.classList.add('show');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new RandomQuoteGenerator();
    
    // Expose app globally for debugging (optional)
    window.quoteApp = app;
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space for new quote
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            app.getRandomQuote();
        }
        
        // Ctrl+C for copy
        if (e.ctrlKey && e.code === 'KeyC') {
            app.copyToClipboard();
        }
        
        // Ctrl+S for scrape
        if (e.ctrlKey && e.code === 'KeyS') {
            e.preventDefault();
            app.scrapeQuotes();
        }
    });
});
