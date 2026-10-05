// ==========================================
// Café Bliss - Accessibility & Audio Engine
// ==========================================

const A11yEngine = {
  state: {
    fontSize: 'normal', // normal, large, xlarge
    contrast: 'normal', // normal, high
    reducedMotion: false,
    soundEnabled: true,
    theme: 'light' // light, dark
  },

  init() {
    this.loadPreferences();
    this.applyPreferences();
    this.bindEvents();
  },

  loadPreferences() {
    try {
      const saved = localStorage.getItem('bliss_a11y_prefs');
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      } else {
        // Check system preference for reduced motion
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.state.reducedMotion = true;
        }
        // Check system preference for dark theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.state.theme = 'dark';
        }
      }
    } catch (e) {
      console.warn('A11y storage read error:', e);
    }
  },

  savePreferences() {
    try {
      localStorage.setItem('bliss_a11y_prefs', JSON.stringify(this.state));
    } catch (e) {
      console.warn('A11y storage write error:', e);
    }
  },

  applyPreferences() {
    const root = document.documentElement;
    const body = document.body;

    // 1. Theme
    if (this.state.theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    // 2. Font Size
    root.classList.remove('font-size-large', 'font-size-xlarge');
    if (this.state.fontSize === 'large') {
      root.classList.add('font-size-large');
    } else if (this.state.fontSize === 'xlarge') {
      root.classList.add('font-size-xlarge');
    }

    // 3. High Contrast
    if (this.state.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 4. Reduced Motion
    if (this.state.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    this.updateUIControls();
  },

  updateUIControls() {
    // Update theme toggle buttons if present
    const themeToggles = document.querySelectorAll('.theme-toggle-btn');
    themeToggles.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        if (this.state.theme === 'dark') {
          icon.className = 'fa-solid fa-sun';
          btn.setAttribute('aria-label', 'Switch to light mode');
          btn.setAttribute('title', 'Switch to light mode');
        } else {
          icon.className = 'fa-solid fa-moon';
          btn.setAttribute('aria-label', 'Switch to dark mode');
          btn.setAttribute('title', 'Switch to dark mode');
        }
      }
    });

    // Update A11y panel inputs if open
    const motionToggle = document.getElementById('a11y-motion-toggle');
    if (motionToggle) motionToggle.checked = this.state.reducedMotion;

    const soundToggle = document.getElementById('a11y-sound-toggle');
    if (soundToggle) soundToggle.checked = this.state.soundEnabled;

    const contrastToggle = document.getElementById('a11y-contrast-toggle');
    if (contrastToggle) contrastToggle.checked = this.state.contrast === 'high';

    const fontButtons = document.querySelectorAll('.a11y-font-btn');
    fontButtons.forEach(btn => {
      const size = btn.getAttribute('data-size');
      if (size === this.state.fontSize) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  },

  toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.applyPreferences();
    this.savePreferences();
    this.playTone(440, 0.08); // pleasant subtle blip
    if (window.Toast) {
      Toast.show(this.state.theme === 'dark' ? '🌙 Dark Espresso Mode Activated' : '☀️ Warm Cream Latte Mode Activated', 'info');
    }
  },

  setFontSize(size) {
    if (['normal', 'large', 'xlarge'].includes(size)) {
      this.state.fontSize = size;
      this.applyPreferences();
      this.savePreferences();
      this.playTone(520, 0.05);
    }
  },

  toggleContrast() {
    this.state.contrast = this.state.contrast === 'high' ? 'normal' : 'high';
    this.applyPreferences();
    this.savePreferences();
    this.playTone(480, 0.05);
  },

  toggleReducedMotion() {
    this.state.reducedMotion = !this.state.reducedMotion;
    this.applyPreferences();
    this.savePreferences();
    if (window.Toast) {
      Toast.show(this.state.reducedMotion ? 'Reduced motion enabled' : 'Smooth animations enabled', 'info');
    }
  },

  toggleSound() {
    this.state.soundEnabled = !this.state.soundEnabled;
    this.savePreferences();
    if (this.state.soundEnabled) {
      this.playSuccessChime();
    }
  },

  // Synthesized Web Audio API Chimes (0 external audio dependencies!)
  playTone(freq = 440, duration = 0.1, type = 'sine') {
    if (!this.state.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  },

  playSuccessChime() {
    if (!this.state.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Two warm ascending notes (E5 -> G#5 -> B5) - warm cafe bell chime
      [659.25, 830.61, 987.77].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.04, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.28);
      });
    } catch (e) {}
  },

  bindEvents() {
    // Accessibility toggle button in header or quick button
    document.addEventListener('click', (e) => {
      const a11yTrigger = e.target.closest('#a11y-trigger-btn');
      if (a11yTrigger) {
        const modal = document.getElementById('a11y-modal');
        if (modal) {
          modal.classList.toggle('active');
          if (modal.classList.contains('active')) {
            modal.querySelector('button, input')?.focus();
          }
        }
      }

      // Close a11y modal
      const closeA11y = e.target.closest('#close-a11y-modal');
      if (closeA11y) {
        document.getElementById('a11y-modal')?.classList.remove('active');
      }

      // Theme toggle buttons
      const themeBtn = e.target.closest('.theme-toggle-btn');
      if (themeBtn) {
        this.toggleTheme();
      }

      // Font size buttons
      const fontBtn = e.target.closest('.a11y-font-btn');
      if (fontBtn) {
        const size = fontBtn.getAttribute('data-size');
        this.setFontSize(size);
      }
    });

    // Checkboxes inside a11y modal
    const motionToggle = document.getElementById('a11y-motion-toggle');
    if (motionToggle) {
      motionToggle.addEventListener('change', (e) => {
        this.state.reducedMotion = e.target.checked;
        this.applyPreferences();
        this.savePreferences();
      });
    }

    const contrastToggle = document.getElementById('a11y-contrast-toggle');
    if (contrastToggle) {
      contrastToggle.addEventListener('change', (e) => {
        this.state.contrast = e.target.checked ? 'high' : 'normal';
        this.applyPreferences();
        this.savePreferences();
      });
    }

    const soundToggle = document.getElementById('a11y-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        this.state.soundEnabled = e.target.checked;
        this.savePreferences();
        if (this.state.soundEnabled) this.playSuccessChime();
      });
    }
  }
};

window.A11yEngine = A11yEngine;
