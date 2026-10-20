// Yokocho Games - Swipe Feed Controller
//
// Each game is a full-screen slide in a vertical scroll-snap feed, so phones
// swipe between games like a short-video app. While browsing, a tap layer sits
// over the live game so swipes move the feed; tapping hands every touch to the
// game until the "Games" button is pressed.

const SETTLE_DELAY = 200; // ms without scrolling before a slide counts as chosen

class GameArcade {
    constructor() {
        this.games = [];
        this.slides = [];
        this.currentIndex = null; // -1 means welcome slide
        this.pendingIndex = null; // target of a button/key scroll still in flight
        this.playing = false;
        this.hasSettled = false;
        this.settleTimer = null;
        this.lastWheelTime = -Infinity;
        this.wheelLocked = false;
        this.wheelDelta = 0;

        // Don't download game builds just for swiping past when data saver is on
        this.autoLoad = !(navigator.connection && navigator.connection.saveData);

        this.feed = document.getElementById('feed');
        this.indicators = document.getElementById('game-indicators');
        this.prevBtn = document.querySelector('.nav-prev');
        this.nextBtn = document.querySelector('.nav-next');
        this.exitBtn = document.getElementById('exit-play');
        this.themeColor = document.querySelector('meta[name="theme-color"]');
        this.grid = document.getElementById('profile-grid');
        this.toast = document.getElementById('toast');

        this.init();
    }

    async init() {
        await this.loadGamesList();
        this.renderSlides();
        this.renderProfile();
        this.renderIndicators();
        this.bindEvents();
        this.scrollToIndex(this.indexFromURL(), { smooth: false });
        this.observeSlides();
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

    renderSlides() {
        this.slides = [this.feed.querySelector('.welcome-slide')];

        this.games.forEach((game, index) => {
            const slide = document.createElement('section');
            slide.className = 'slide game-slide';
            slide.dataset.index = index;
            slide.setAttribute('aria-label', game.title);
            if (game.color) slide.style.setProperty('--slide-bg', game.color);
            slide.innerHTML = `
                <div class="slide-stage"></div>
                <div class="slide-cover"><span class="cover-title"></span></div>
                <div class="slide-overlay">
                    <div class="slide-caption">
                        <span class="caption-handle">@yokocho.games</span>
                        <h2></h2>
                        <p></p>
                        <button class="play-btn" type="button">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>
                            <span>Play</span>
                        </button>
                    </div>
                </div>
            `;

            // games.json is editable from the admin page, so text goes in via textContent
            slide.querySelector('.cover-title').textContent = game.title;
            slide.querySelector('.slide-caption h2').textContent = game.title;
            slide.querySelector('.slide-caption p').textContent = game.description || '';
            slide.querySelector('.play-btn').setAttribute('aria-label', `Play ${game.title}`);
            const cover = slide.querySelector('.slide-cover');
            if (game.icon) cover.prepend(this.gameImage(game, game.icon, 'cover-icon'));
            if (game.poster) cover.prepend(this.gameImage(game, game.poster, 'cover-poster'));

            this.feed.appendChild(slide);
            this.slides.push(slide);
        });
    }

    // Profile-style home: game count plus a grid of tiles that jump to each game
    renderProfile() {
        document.getElementById('stat-games').textContent = this.games.length;
        this.grid.innerHTML = '';

        this.games.forEach((game, index) => {
            const tile = document.createElement('a');
            tile.className = 'grid-tile';
            tile.href = this.gameURL(index);
            tile.dataset.index = index;
            if (game.color) tile.style.setProperty('--slide-bg', game.color);

            if (game.poster) tile.appendChild(this.gameImage(game, game.poster));
            else if (game.icon) tile.appendChild(this.gameImage(game, game.icon, 'tile-icon'));

            const label = document.createElement('span');
            label.className = 'tile-label';
            label.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>';
            label.append(game.title);
            tile.appendChild(label);

            this.grid.appendChild(tile);
        });
    }

    gameImage(game, file, className = '') {
        const img = document.createElement('img');
        img.src = this.gameAsset(game, file);
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        if (className) img.className = className;
        return img;
    }

    async share() {
        const url = location.origin + '/';
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Yokocho Games', text: 'A cozy collection of games', url });
            } catch (error) {
                // Closing the share sheet rejects; nothing to do
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            this.showToast('Link copied');
        } catch (error) {
            this.showToast(url);
        }
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.classList.remove('show'), 1800);
    }

    renderIndicators() {
        this.indicators.innerHTML = '';

        this.slides.forEach(slide => {
            const index = Number(slide.dataset.index);
            const title = index < 0 ? 'Welcome' : this.games[index].title;
            const dot = document.createElement('a');
            dot.href = this.gameURL(index);
            dot.setAttribute('aria-label', title);
            dot.className = 'indicator-dot';
            dot.dataset.index = index;
            dot.title = title;
            this.indicators.appendChild(dot);
        });
    }

    bindEvents() {
        window.addEventListener('popstate', () => {
            this.setPlaying(false);
            this.scrollToIndex(this.indexFromURL(), { smooth: false });
        });

        // A slide is only "chosen" once the swipe comes to rest
        this.feed.addEventListener('scroll', () => this.scheduleSettle(), { passive: true });

        // Keep the current slide aligned through rotation and window resizes
        new ResizeObserver(() => {
            if (this.currentIndex !== null) this.feed.scrollTop = this.slideAt(this.currentIndex).offsetTop;
        }).observe(this.feed);

        // Tapping anywhere on a slide's overlay starts that game
        this.feed.addEventListener('click', (e) => {
            const overlay = e.target.closest('.slide-overlay');
            if (overlay) this.play(Number(overlay.closest('.slide').dataset.index));
        });

        // One wheel gesture moves one slide; snap alone lets small notches spring back
        this.feed.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        this.exitBtn.addEventListener('click', () => this.setPlaying(false));
        document.querySelector('.start-btn').addEventListener('click', () => this.scrollToIndex(0));
        document.querySelector('.share-btn').addEventListener('click', () => this.share());

        // Grid tiles are real links (new tab, copy) but scroll the feed on a plain click
        this.grid.addEventListener('click', (e) => {
            const tile = e.target.closest('.grid-tile');
            if (!tile || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            this.scrollToIndex(Number(tile.dataset.index));
        });
        this.prevBtn.addEventListener('click', () => this.navigate(-1));
        this.nextBtn.addEventListener('click', () => this.navigate(1));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.playing) {
                if (e.key === 'Escape') this.setPlaying(false);
                return;
            }
            if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) {
                e.preventDefault();
                this.navigate(1);
            } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
                e.preventDefault();
                this.navigate(-1);
            } else if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a, button') && this.currentIndex >= 0) {
                e.preventDefault();
                this.play(this.currentIndex);
            }
        });

        // Indicator dots
        this.indicators.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            if (e.target.classList.contains('indicator-dot')) {
                e.preventDefault();
                this.scrollToIndex(Number(e.target.dataset.index));
            }
        });
    }

    observeSlides() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                    this.setActive(Number(entry.target.dataset.index));
                }
            });
        }, { root: this.feed, threshold: 0.6 });

        this.slides.forEach(slide => observer.observe(slide));
    }

    onWheel(e) {
        if (this.playing || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

        // Let a long home grid scroll on its own before the feed moves
        const inner = e.target.closest('.profile');
        if (inner && (e.deltaY > 0
            ? inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1
            : inner.scrollTop > 0)) return;

        e.preventDefault();

        // Trackpad momentum keeps firing events; a pause marks the next gesture.
        // Event timestamps stay accurate even when a booting game stalls the page.
        if (e.timeStamp - this.lastWheelTime > 300) {
            this.wheelLocked = false;
            this.wheelDelta = 0;
        }
        this.lastWheelTime = e.timeStamp;
        if (this.wheelLocked) return;

        this.wheelDelta += e.deltaY;
        if (Math.abs(this.wheelDelta) >= 40) {
            this.wheelLocked = true;
            this.navigate(Math.sign(this.wheelDelta));
        }
    }

    navigate(direction) {
        if (this.playing || this.currentIndex === null) return;
        const from = this.pendingIndex !== null ? this.pendingIndex : this.currentIndex;
        this.scrollToIndex(from + direction);
    }

    scrollToIndex(index, { smooth = true } = {}) {
        const slide = this.slideAt(index);
        if (!slide) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.pendingIndex = index;
        this.feed.scrollTo({ top: slide.offsetTop, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
        this.scheduleSettle();
    }

    // Cheap UI updates happen as soon as a slide fills most of the screen
    setActive(index) {
        if (index === this.currentIndex) return;
        this.currentIndex = index;
        this.slides.forEach(slide => slide.classList.toggle('active', Number(slide.dataset.index) === index));
        document.body.classList.toggle('on-welcome', index < 0);
        this.updateIndicators();
        this.updateNavButtons();
        this.updateTitle();
        this.scheduleSettle();
    }

    scheduleSettle() {
        clearTimeout(this.settleTimer);
        this.settleTimer = setTimeout(() => this.settle(), SETTLE_DELAY);
    }

    // Heavy work waits until the feed stops, so flicking past a game never loads it
    settle() {
        if (this.currentIndex === null) return;
        this.pendingIndex = null;

        // Only one game runs at a time to keep phones responsive
        this.slides.forEach(slide => {
            if (Number(slide.dataset.index) !== this.currentIndex) this.unmountGame(slide);
        });
        if (this.currentIndex >= 0 && this.autoLoad) this.mountGame(this.currentIndex);

        const url = this.gameURL(this.currentIndex);
        if (location.pathname !== url) {
            history[this.hasSettled ? 'pushState' : 'replaceState']({ game: this.currentIndex }, '', url);
        }
        this.hasSettled = true;
    }

    play(index) {
        // Ignore taps on a slide that is only partly scrolled into view
        if (index !== this.currentIndex || index < 0) return;
        this.mountGame(index);
        this.setPlaying(true);
    }

    setPlaying(playing) {
        if (this.playing === playing) return;
        this.playing = playing;
        document.body.classList.toggle('playing', playing);
        this.feed.classList.toggle('locked', playing);

        const iframe = this.currentIndex >= 0 ? this.slideAt(this.currentIndex).querySelector('iframe') : null;
        if (iframe) iframe.inert = !playing;
        if (playing) {
            if (iframe) iframe.focus();
        } else {
            this.feed.focus({ preventScroll: true });
        }
    }

    mountGame(index) {
        const slide = this.slideAt(index);
        const stage = slide.querySelector('.slide-stage');
        if (stage.firstChild) return;

        const game = this.games[index];
        const iframe = document.createElement('iframe');
        iframe.src = this.gameAsset(game, game.entry || 'index.html');
        iframe.allow = 'fullscreen; autoplay';
        iframe.title = game.title;
        // Previews can't take focus or input until the player taps in
        iframe.inert = !this.playing;
        iframe.addEventListener('load', () => {
            slide.classList.remove('loading');
            slide.classList.add('ready');
        }, { once: true });

        slide.classList.add('loading');
        stage.appendChild(iframe);
    }

    unmountGame(slide) {
        const stage = slide.querySelector('.slide-stage');
        if (!stage || !stage.firstChild) return;
        stage.innerHTML = '';
        slide.classList.remove('loading', 'ready');
    }

    slideAt(index) {
        return this.slides[index + 1];
    }

    gameAsset(game, file) {
        return `/games/${game.folder}/${file}`;
    }

    gameURL(index) {
        return index < 0 ? '/' : `/${this.games[index].slug || this.games[index].folder}/`;
    }

    indexFromURL() {
        const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
        return this.games.findIndex((game, index) => this.gameURL(index).replace(/\/$/, '') === path);
    }

    updateIndicators() {
        const dots = this.indicators.querySelectorAll('.indicator-dot');
        dots.forEach(dot => {
            const active = Number(dot.dataset.index) === this.currentIndex;
            dot.classList.toggle('active', active);
            if (active) dot.setAttribute('aria-current', 'page');
            else dot.removeAttribute('aria-current');
        });
    }

    updateNavButtons() {
        this.prevBtn.disabled = this.currentIndex <= -1;
        this.nextBtn.disabled = this.currentIndex >= this.games.length - 1;
    }

    updateTitle() {
        const game = this.games[this.currentIndex];
        document.title = game ? `${game.title} · Yokocho Games` : 'Yokocho Games';
        if (this.themeColor) this.themeColor.content = game ? (game.color || '#10111b') : '#0f0f14';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.arcade = new GameArcade();
});
