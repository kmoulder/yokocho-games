// Yokocho Games - Navigation Controller

class GameArcade {
    constructor() {
        this.games = [];
        this.currentIndex = -1; // -1 means welcome screen
        this.isLoading = false;
        this.navigationRevision = 0;

        this.gameFrame = document.getElementById('game-frame');
        this.gameTitle = document.querySelector('.game-title');
        this.indicators = document.getElementById('game-indicators');
        this.prevBtn = document.querySelector('.nav-prev');
        this.nextBtn = document.querySelector('.nav-next');

        this.init();
    }

    async init() {
        await this.loadGamesList();
        this.renderIndicators();
        this.bindEvents();
        this.updateNavButtons();
        await this.goToGame(this.indexFromURL(), { historyMode: 'replace' });
    }

    async loadGamesList() {
        try {
            const response = await fetch('/games.json');
            const data = await response.json();
            this.games = data.games || [];
        } catch (error) {
            console.log('No games.json found or error loading:', error);
            this.games = [];
        }
    }

    renderIndicators() {
        this.indicators.innerHTML = '';

        // Welcome dot
        const welcomeDot = document.createElement('a');
        welcomeDot.href = '/';
        welcomeDot.setAttribute('aria-label', 'Welcome');
        welcomeDot.className = 'indicator-dot active';
        welcomeDot.dataset.index = -1;
        welcomeDot.title = 'Welcome';
        this.indicators.appendChild(welcomeDot);

        // Game dots
        this.games.forEach((game, index) => {
            const dot = document.createElement('a');
            dot.href = this.gameURL(index);
            dot.setAttribute('aria-label', game.title);
            dot.className = 'indicator-dot';
            dot.dataset.index = index;
            dot.title = game.title;
            this.indicators.appendChild(dot);
        });
    }

    bindEvents() {
        window.addEventListener('popstate', () => this.goToGame(this.indexFromURL(), { historyMode: null }));
        // Arrow buttons
        this.prevBtn.addEventListener('click', () => this.navigate(-1));
        this.nextBtn.addEventListener('click', () => this.navigate(1));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigate(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigate(1);
            }
        });

        // Indicator dots
        this.indicators.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            if (e.target.classList.contains('indicator-dot')) {
                e.preventDefault();
                const index = parseInt(e.target.dataset.index);
                this.goToGame(index);
            }
        });
    }

    navigate(direction) {
        if (this.isLoading) return;

        const newIndex = this.currentIndex + direction;

        // Bounds check
        if (newIndex < -1 || newIndex >= this.games.length) return;

        this.goToGame(newIndex);
    }

    gameURL(index) {
        return index < 0 ? '/' : `/${this.games[index].slug || this.games[index].folder}/`;
    }

    indexFromURL() {
        const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
        return this.games.findIndex((game, index) => this.gameURL(index).replace(/\/$/, '') === path);
    }

    async goToGame(index, { historyMode = 'push' } = {}) {
        if (index < -1 || index >= this.games.length) return;
        const revision = ++this.navigationRevision;
        if (index === this.currentIndex) {
            this.isLoading = false;
            this.gameFrame.classList.remove('fade-in', 'fade-out');
            return;
        }

        this.isLoading = true;

        // Fade out
        this.gameFrame.classList.add('fade-out');
        await this.wait(200);
        if (revision !== this.navigationRevision) return;

        // Update current index
        this.currentIndex = index;
        document.body.classList.toggle('game-active', index >= 0);

        // Load content
        if (index === -1) {
            this.showWelcome();
        } else {
            this.loadGame(this.games[index]);
        }

        // Update UI
        this.updateIndicators();
        this.updateNavButtons();
        this.updateTitle();
        if (historyMode) history[historyMode === 'replace' ? 'replaceState' : 'pushState']({ game: index }, '', this.gameURL(index));

        // Fade in
        this.gameFrame.classList.remove('fade-out');
        this.gameFrame.classList.add('fade-in');
        await this.wait(200);
        if (revision !== this.navigationRevision) return;
        this.gameFrame.classList.remove('fade-in');

        this.isLoading = false;
    }

    showWelcome() {
        this.gameFrame.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-content">
                    <h2>Yokocho Games</h2>
                    <p>A cozy collection of games</p>
                    <p class="welcome-hint">Use arrow keys or click the arrows to browse</p>
                </div>
            </div>
        `;
    }

    loadGame(game) {
        // Create iframe to load the game
        const iframe = document.createElement('iframe');
        // Use custom entry point if specified, otherwise try index.html
        const entryPoint = game.entry || 'index.html';
        iframe.src = `/games/${game.folder}/${entryPoint}`;
        iframe.allow = 'fullscreen; autoplay';
        iframe.title = game.title;

        this.gameFrame.innerHTML = '';
        this.gameFrame.appendChild(iframe);
    }

    updateIndicators() {
        const dots = this.indicators.querySelectorAll('.indicator-dot');
        dots.forEach(dot => {
            const index = parseInt(dot.dataset.index);
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    updateNavButtons() {
        this.prevBtn.disabled = this.currentIndex <= -1;
        this.nextBtn.disabled = this.currentIndex >= this.games.length - 1;
    }

    updateTitle() {
        document.title = this.currentIndex < 0 ? 'Yokocho Games' : `${this.games[this.currentIndex].title} · Yokocho Games`;
        if (this.currentIndex === -1) {
            this.gameTitle.textContent = 'Welcome to Yokocho';
        } else {
            this.gameTitle.textContent = this.games[this.currentIndex].title;
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.arcade = new GameArcade();
});
