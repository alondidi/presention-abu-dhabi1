// ============================================
// ABU DHABI PRESENTATION - INTERACTIVE SCRIPT
// ============================================

class PresentationController {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 9;
        this.isAnimating = false;

        this.slides = document.querySelectorAll('.slide');
        this.navDots = document.querySelectorAll('.nav-dot');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.slideCounter = document.getElementById('currentSlide');

        // Socket.io for Remote Control
        this.setupRemoteControl();

        this.init();
    }

    setupRemoteControl() {
        if (typeof io !== 'undefined') {
            // Dynamic connection: 
            // 1. If opened as a local file, connect to the local Python server
            // 2. If opened via a web server (like Render), connect to the current host
            const socketUrl = window.location.protocol === 'file:' ? 'http://localhost:5000' : undefined;
            const socket = io(socketUrl);

            socket.on('connect', () => {
                console.log('📡 Connected to Remote Control Server');
                if (socketUrl) console.log('Connecting to local development server...');
            });

            socket.on('remote-command', (cmd) => {
                console.log('Received remote command:', cmd);
                this.showRemoteFeedback(cmd);

                // Navigation
                if (cmd === 'next') this.nextSlide();
                if (cmd === 'prev') this.prevSlide();

                // Accessibility (delegated to window.a11y)
                if (window.a11y) {
                    if (cmd === 'font-up') window.a11y.updateFontScale(0.1);
                    if (cmd === 'font-down') window.a11y.updateFontScale(-0.1);
                    if (cmd === 'font-reset') window.a11y.setFontScale(1);
                    if (cmd === 'contrast-toggle') window.a11y.setContrast(!window.a11y.isHighContrast);
                }
            });
        }
    }

    showRemoteFeedback(cmd) {
        let feedback = document.getElementById('remoteFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'remoteFeedback';
            feedback.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 40px;
                background: var(--gold-primary, #C5A059);
                color: #0A0E17;
                padding: 10px 25px;
                border-radius: 50px;
                font-size: 13px;
                font-weight: 700;
                z-index: 9999;
                pointer-events: none;
                transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
                opacity: 0;
                transform: translateY(20px) scale(0.9);
                box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                gap: 10px;
                border: 1px solid rgba(255,255,255,0.2);
            `;
            document.body.appendChild(feedback);
        }

        const iconMap = {
            'next': '⮕',
            'prev': '⬅',
            'font-up': 'A+',
            'font-down': 'A-',
            'font-reset': '↺',
            'contrast-toggle': '🌓'
        };

        const icon = iconMap[cmd] || '📡';
        feedback.innerHTML = `<span style="opacity: 0.7">REMOTE</span> <b>${icon} ${cmd.toUpperCase()}</b>`;
        feedback.style.opacity = '1';
        feedback.style.transform = 'translateY(0) scale(1)';

        clearTimeout(this.feedbackTimeout);
        this.feedbackTimeout = setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(20px) scale(0.9)';
        }, 2000);
    }

    init() {
        // Navigation dot clicks
        this.navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // Arrow button clicks
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Mouse wheel navigation
        document.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Touch navigation for mobile
        this.setupTouchNavigation();

        // Initial animations
        this.animateCurrentSlide();

        // Update navigation visibility
        this.updateNavigation();
    }

    handleKeyboard(e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides - 1);
                break;
        }
    }

    handleWheel(e) {
        if (this.isAnimating) return;

        e.preventDefault();

        if (e.deltaY > 0) {
            this.nextSlide();
        } else if (e.deltaY < 0) {
            this.prevSlide();
        }
    }

    setupTouchNavigation() {
        let touchStartY = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        }, { passive: true });
    }

    goToSlide(index) {
        if (this.isAnimating || index === this.currentSlide) return;
        if (index < 0 || index >= this.totalSlides) return;

        this.isAnimating = true;

        // Remove active class from current slide
        this.slides[this.currentSlide].classList.remove('active');
        this.navDots[this.currentSlide].classList.remove('active');

        // Update current slide index
        this.currentSlide = index;

        // Add active class to new slide
        this.slides[this.currentSlide].classList.add('active');
        this.navDots[this.currentSlide].classList.add('active');

        // Update counter
        this.slideCounter.textContent = this.currentSlide + 1;

        // Update navigation
        this.updateNavigation();

        // Animate elements in the new slide
        this.animateCurrentSlide();

        // Reset animation lock
        setTimeout(() => {
            this.isAnimating = false;
        }, 800);
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    updateNavigation() {
        // Update arrow visibility
        this.prevBtn.style.opacity = this.currentSlide === 0 ? '0.3' : '1';
        this.prevBtn.style.pointerEvents = this.currentSlide === 0 ? 'none' : 'auto';

        this.nextBtn.style.opacity = this.currentSlide === this.totalSlides - 1 ? '0.3' : '1';
        this.nextBtn.style.pointerEvents = this.currentSlide === this.totalSlides - 1 ? 'none' : 'auto';
    }

    animateCurrentSlide() {
        const currentSlideEl = this.slides[this.currentSlide];
        const animatedElements = currentSlideEl.querySelectorAll('.glass-card, .stat-box, .culture-card, .attraction-card, .essential-card, .souvenir-item');

        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';

            setTimeout(() => {
                el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 100 + (index * 100));
        });
    }
}

// ============================================
// PARTICLE BACKGROUND EFFECT
// ============================================

class ParticleBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 50;

        this.init();
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '0';
        document.body.prepend(this.canvas);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(212, 175, 55, ${particle.opacity})`;
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// ACCESSIBILITY MANAGER
// ============================================

class AccessibilityManager {
    constructor() {
        this.fontScale = parseFloat(localStorage.getItem('a11y-font-scale')) || 1;
        this.isHighContrast = localStorage.getItem('a11y-contrast') === 'true';

        this.widget = document.getElementById('accessibilityWidget');
        this.toggleBtn = document.getElementById('a11yToggle');
        this.menu = document.getElementById('a11yMenu');

        this.init();
    }

    init() {
        // Toggle menu
        this.toggleBtn.addEventListener('click', () => {
            this.menu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.widget.contains(e.target)) {
                this.menu.classList.remove('active');
            }
        });

        // Font scaling
        document.getElementById('fontIncrease').addEventListener('click', () => this.updateFontScale(0.1));
        document.getElementById('fontDecrease').addEventListener('click', () => this.updateFontScale(-0.1));
        document.getElementById('fontReset').addEventListener('click', () => this.setFontScale(1));

        // Contrast
        document.getElementById('contrastDefault').addEventListener('click', () => this.setContrast(false));
        document.getElementById('contrastHigh').addEventListener('click', () => this.setContrast(true));

        // Apply initial settings
        this.applySettings();
    }

    updateFontScale(delta) {
        const newScale = Math.min(Math.max(this.fontScale + delta, 0.8), 1.5);
        this.setFontScale(newScale);
    }

    setFontScale(scale) {
        this.fontScale = scale;
        localStorage.setItem('a11y-font-scale', this.fontScale);
        this.applySettings();
    }

    setContrast(isHigh) {
        this.isHighContrast = isHigh;
        localStorage.setItem('a11y-contrast', this.isHighContrast);
        this.applySettings();
    }

    applySettings() {
        // Apply font scale to document root
        document.documentElement.style.setProperty('--font-scale', this.fontScale);

        // Apply high contrast class
        if (this.isHighContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }
}

// ============================================
// INITIALIZE ON DOM LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize presentation controller
    const presentation = new PresentationController();

    // Initialize particle background
    const particles = new ParticleBackground();

    // Initialize accessibility manager
    window.a11y = new AccessibilityManager();

    // Add loading animation
    document.body.classList.add('loaded');

    console.log('🌴 Abu Dhabi Presentation Loaded Successfully!');
});

// ============================================
// PRELOAD IMAGES
// ============================================

const imagesToPreload = [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1920',
    'https://images.unsplash.com/photo-1548690596-f1722c190938?w=1920',
    'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=1920',
    'https://images.unsplash.com/photo-1546412414-e1885259563a?w=1920',
    'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800',
    'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
];

imagesToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
});
