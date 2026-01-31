// Yokocho Games - Navigation Controller

class GameArcade {
    constructor() {
        this.games = [];
        this.currentIndex = -1; // -1 means welcome screen
        this.isLoading = false;

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
    }

    async loadGamesList() {
        try {
            const response = await fetch('games.json');
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
        const welcomeDot = document.createElement('div');
        welcomeDot.className = 'indicator-dot active';
        welcomeDot.dataset.index = -1;
        welcomeDot.title = 'Welcome';
        this.indicators.appendChild(welcomeDot);

        // Game dots
        this.games.forEach((game, index) => {
            const dot = document.createElement('div');
            dot.className = 'indicator-dot';
            dot.dataset.index = index;
            dot.title = game.title;
            this.indicators.appendChild(dot);
        });
    }

    bindEvents() {
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
            if (e.target.classList.contains('indicator-dot')) {
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

    async goToGame(index) {
        if (this.isLoading || index === this.currentIndex) return;
        if (index < -1 || index >= this.games.length) return;

        this.isLoading = true;

        // Fade out
        this.gameFrame.classList.add('fade-out');
        await this.wait(200);

        // Update current index
        this.currentIndex = index;

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

        // Fade in
        this.gameFrame.classList.remove('fade-out');
        this.gameFrame.classList.add('fade-in');
        await this.wait(200);
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
        iframe.src = `games/${game.folder}/index.html`;
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
