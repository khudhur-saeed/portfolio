/**
 * Main Application Script (High Performance Optimized)
 * 1. PullCord - Physics-driven Ceiling Pull-Cord Component (mortspace / FeralUI)
 * 2. LetterGlitch - Canvas Glitch Background (React Bits - Performance Optimized)
 * 3. ProfileCard - 3D Tilt Card with Holographic Sheen (React Bits - Idle Sleep Optimized)
 */

(function () {
  'use strict';

  /* Safe LocalStorage Helper with in-memory fallback for Android Incognito / WebViews */
  const memoryStore = {};
  const safeStorage = {
    get: (key, fallback = null) => {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? val : (key in memoryStore ? memoryStore[key] : fallback);
      } catch (_) {
        return key in memoryStore ? memoryStore[key] : fallback;
      }
    },
    set: (key, val) => {
      memoryStore[key] = String(val);
      try {
        localStorage.setItem(key, val);
      } catch (_) {}
    }
  };

  /* =========================================================================
     ProfileCard Component (React Bits - Optimized with Idle Sleep)
     ========================================================================= */

  const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
  const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
  const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

  class ProfileCardComponent {
    constructor(wrapperEl, options = {}) {
      this.wrapper = wrapperEl;
      this.shell = wrapperEl.querySelector('.pc-card-shell');
      this.card = wrapperEl.querySelector('.pc-card');
      this.enableTilt = options.enableTilt !== false;
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!this.shell || !this.enableTilt || this.reduceMotion) return;

      this.running = false;
      this.lastTs = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.initialUntil = 0;
      this.rafId = null;

      this.DEFAULT_TAU = 0.14;
      this.INITIAL_TAU = 0.6;

      this.init();
    }

    setVarsFromXY(x, y) {
      if (!this.shell || !this.wrapper) return;
      const width = this.shell.clientWidth || 1;
      const height = this.shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      this.wrapper.style.setProperty('--pointer-x', `${percentX}%`);
      this.wrapper.style.setProperty('--pointer-y', `${percentY}%`);
      this.wrapper.style.setProperty('--background-x', `${adjust(percentX, 0, 100, 35, 65)}%`);
      this.wrapper.style.setProperty('--background-y', `${adjust(percentY, 0, 100, 35, 65)}%`);
      this.wrapper.style.setProperty('--pointer-from-center', `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`);
      this.wrapper.style.setProperty('--pointer-from-top', `${percentY / 100}`);
      this.wrapper.style.setProperty('--pointer-from-left', `${percentX / 100}`);
      this.wrapper.style.setProperty('--rotate-x', `${round(-(centerX / 6))}deg`);
      this.wrapper.style.setProperty('--rotate-y', `${round(centerY / 5)}deg`);
    }

    step(ts) {
      if (!this.running) return;
      if (this.lastTs === 0) this.lastTs = ts;
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;

      const tau = ts < this.initialUntil ? this.INITIAL_TAU : this.DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      this.currentX += (this.targetX - this.currentX) * k;
      this.currentY += (this.targetY - this.currentY) * k;

      this.setVarsFromXY(this.currentX, this.currentY);

      const stillFar = Math.abs(this.targetX - this.currentX) > 0.08 || Math.abs(this.targetY - this.currentY) > 0.08;

      // Critical optimization: Stop RAF loop completely when settled to free CPU/GPU
      if (stillFar) {
        this.rafId = requestAnimationFrame((t) => this.step(t));
      } else {
        this.running = false;
        this.lastTs = 0;
        this.rafId = null;
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTs = 0;
      this.rafId = requestAnimationFrame((ts) => this.step(ts));
    }

    setTarget(x, y) {
      this.targetX = x;
      this.targetY = y;
      this.start();
    }

    toCenter() {
      if (!this.shell) return;
      this.setTarget(this.shell.clientWidth / 2, this.shell.clientHeight / 2);
    }

    init() {
      const getOffsets = (evt) => {
        const rect = this.shell.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
      };

      this.shell.addEventListener('pointerenter', (e) => {
        this.shell.classList.add('active');
        this.wrapper.classList.add('active');
        const { x, y } = getOffsets(e);
        this.setTarget(x, y);
      });

      this.shell.addEventListener('pointermove', (e) => {
        const { x, y } = getOffsets(e);
        this.setTarget(x, y);
      });

      this.shell.addEventListener('pointerleave', () => {
        this.toCenter();
        const checkSettle = () => {
          const settled = Math.hypot(this.targetX - this.currentX, this.targetY - this.currentY) < 0.6;
          if (settled) {
            this.shell.classList.remove('active');
            this.wrapper.classList.remove('active');
          } else {
            requestAnimationFrame(checkSettle);
          }
        };
        requestAnimationFrame(checkSettle);
      });

      // Contact button smooth scroll
      const contactBtn = this.wrapper.querySelector('.pc-contact-btn');
      if (contactBtn) {
        contactBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector('#contact');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.location.href = '#contact';
          }
        });
      }

      // Initial intro tilt animation (runs once for 1.2s then sleeps)
      const initialX = (this.shell.clientWidth || 300) - 70;
      const initialY = 60;
      this.currentX = initialX;
      this.currentY = initialY;
      this.setVarsFromXY(initialX, initialY);
      this.toCenter();
      this.initialUntil = performance.now() + 1200;
      this.start();
    }
  }


  /* =========================================================================
     LetterGlitch Background Canvas Component (Performance Optimized)
     - Increased cell spacing (lowers draw call count by 70%)
     - Capped devicePixelRatio
     - 30FPS throttling (saves 75% GPU/CPU time)
     - IntersectionObserver to sleep when out of view
     ========================================================================= */

  const FALLBACK_RGB = { r: 171, g: 170, b: 173 };

  class LetterGlitch {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.glitchSpeed = options.glitchSpeed ?? 70;
      this.smooth = options.smooth ?? true;
      this.characters = options.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';
      this.lettersAndSymbols = Array.from(this.characters);

      // Web page color matched palettes
      this.glitchColorsDark = ['#1e1e23', '#2d2d35', '#4d4c55', '#787780', '#abaaad'];
      this.glitchColorsLight = ['#b8b7ba', '#8c8b90', '#5c5b60', '#323136', '#121214'];

      this.isLight = options.isLight ?? false;
      this.glitchColors = this.isLight ? this.glitchColorsLight : this.glitchColorsDark;

      // Larger cell size for crisp readability and massive performance savings
      this.fontSize = 17;
      this.charWidth = 20;
      this.charHeight = 32;

      this.letters = [];
      this.grid = { columns: 0, rows: 0 };
      this.lastGlitchTime = Date.now();
      this.lastFrameTime = 0;
      this.frameInterval = 1000 / 28; // Cap animation at smooth 28 FPS

      this.isVisible = true;
      this.animId = null;
      this.resizeTimeout = null;

      this.init();
    }

    hexToRgb(hex) {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          }
        : null;
    }

    mixRgb(start, end, factor) {
      return {
        r: Math.round(start.r + (end.r - start.r) * factor),
        g: Math.round(start.g + (end.g - start.g) * factor),
        b: Math.round(start.b + (end.b - start.b) * factor)
      };
    }

    rgbToCss({ r, g, b }) {
      return `rgb(${r}, ${g}, ${b})`;
    }

    getRandomChar() {
      return this.lettersAndSymbols[Math.floor(Math.random() * this.lettersAndSymbols.length)];
    }

    getRandomColor() {
      return this.glitchColors[Math.floor(Math.random() * this.glitchColors.length)];
    }

    getRandomRgb() {
      return this.hexToRgb(this.getRandomColor()) || FALLBACK_RGB;
    }

    calculateGrid(width, height) {
      const columns = Math.ceil(width / this.charWidth);
      const rows = Math.ceil(height / this.charHeight);
      return { columns, rows };
    }

    initializeLetters(columns, rows) {
      this.grid = { columns, rows };
      const totalLetters = columns * rows;
      this.letters = Array.from({ length: totalLetters }, () => {
        const rgb = this.getRandomRgb();
        return {
          char: this.getRandomChar(),
          rgb,
          fromRgb: rgb,
          targetRgb: this.getRandomRgb(),
          colorProgress: 1
        };
      });
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const parent = this.canvas.parentElement;
      if (!parent) return;

      const isMobile = window.innerWidth < 768;
      // Cap DPR to 1.0 on mobile to drastically reduce GPU fill overhead; up to 1.5 on desktop
      const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = parent.getBoundingClientRect();

      // Optimize cell dimensions on mobile to reduce text draw calls by ~40%
      this.charWidth = isMobile ? 25 : 20;
      this.charHeight = isMobile ? 36 : 32;

      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;

      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const { columns, rows } = this.calculateGrid(rect.width, rect.height);
      this.initializeLetters(columns, rows);
      this.drawLetters();
    }

    drawLetters() {
      if (!this.ctx || this.letters.length === 0) return;
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.ctx.font = `${this.fontSize}px 'Geist Mono', monospace`;
      this.ctx.textBaseline = 'top';

      const cols = this.grid.columns;
      const cw = this.charWidth;
      const ch = this.charHeight;

      for (let i = 0; i < this.letters.length; i++) {
        const letter = this.letters[i];
        const x = (i % cols) * cw;
        const y = Math.floor(i / cols) * ch;
        this.ctx.fillStyle = this.rgbToCss(letter.rgb);
        this.ctx.fillText(letter.char, x, y);
      }
    }

    updateLetters() {
      if (!this.letters || this.letters.length === 0) return;
      const updateCount = Math.max(1, Math.floor(this.letters.length * 0.04));
      for (let i = 0; i < updateCount; i++) {
        const index = Math.floor(Math.random() * this.letters.length);
        const l = this.letters[index];
        if (!l) continue;
        l.char = this.getRandomChar();
        l.fromRgb = l.rgb;
        l.targetRgb = this.getRandomRgb();
        if (!this.smooth) {
          l.rgb = l.targetRgb;
          l.colorProgress = 1;
        } else {
          l.colorProgress = 0;
        }
      }
    }

    handleSmoothTransitions() {
      let needsRedraw = false;
      for (let i = 0; i < this.letters.length; i++) {
        const letter = this.letters[i];
        if (letter.colorProgress < 1) {
          letter.colorProgress += 0.08;
          if (letter.colorProgress > 1) letter.colorProgress = 1;
          letter.rgb = this.mixRgb(letter.fromRgb, letter.targetRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
      return needsRedraw;
    }

    animate(now = Date.now()) {
      if (!this.isVisible) return;

      this.animId = requestAnimationFrame((t) => this.animate(t));

      // Throttle to 28 FPS for buttery smooth performance without CPU load
      if (now - this.lastFrameTime < this.frameInterval) return;
      this.lastFrameTime = now;

      let shouldRedraw = false;

      if (now - this.lastGlitchTime >= this.glitchSpeed) {
        this.updateLetters();
        this.lastGlitchTime = now;
        shouldRedraw = true;
      }

      if (this.smooth) {
        const transitioned = this.handleSmoothTransitions();
        if (transitioned) shouldRedraw = true;
      }

      if (shouldRedraw) {
        this.drawLetters();
      }
    }

    startAnimation() {
      if (this.animId) cancelAnimationFrame(this.animId);
      this.isVisible = true;
      this.animId = requestAnimationFrame((t) => this.animate(t));
    }

    stopAnimation() {
      this.isVisible = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    setTheme(isLight) {
      this.isLight = isLight;
      this.glitchColors = this.isLight ? this.glitchColorsLight : this.glitchColorsDark;
      if (this.letters) {
        this.letters.forEach(letter => {
          letter.fromRgb = letter.rgb;
          letter.targetRgb = this.getRandomRgb();
          letter.colorProgress = 0;
        });
      }
      this.drawLetters();
    }

    init() {
      this.resizeCanvas();
      this.startAnimation();

      // Debounced resize handler
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.resizeCanvas();
        }, 120);
      });

      // Pause when hero is not visible on screen
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.startAnimation();
            } else {
              this.stopAnimation();
            }
          });
        }, { threshold: 0.05 });

        const heroEl = document.getElementById('hero');
        if (heroEl) observer.observe(heroEl);
      }

      // Pause when tab is inactive
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopAnimation();
        } else {
          this.startAnimation();
        }
      });
    }
  }


  /* =========================================================================
     PullCord Physics-driven Ceiling Rope Switch (Theme Switcher)
     ========================================================================= */

  const DEFAULT_CONFIG = {
    gravity: 1250,
    damping: 0.94,
    iterations: 20,
    stretchMax: 26,
    stretchToggle: 20,
    maxVelocity: 22,
    sleepVelocity: 0.15
  };

  const W = 64;
  const ANCHOR_X = W / 2; // 32
  const REST_Y = 176;
  const SEGMENTS = 16;
  const REST_SEG = REST_Y / SEGMENTS; // 11

  function playDetentSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        try { ctx.resume(); } catch (_) {}
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (_) {}
  }

  function buildPath(p) {
    let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
    for (let i = 1; i < p.length - 1; i++) {
      const xc = (p[i].x + p[i + 1].x) / 2;
      const yc = (p[i].y + p[i + 1].y) / 2;
      d += ` Q ${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${xc.toFixed(1)} ${yc.toFixed(1)}`;
    }
    const n = p.length - 1;
    d += ` L ${p[n].x.toFixed(1)} ${p[n].y.toFixed(1)}`;
    return d;
  }

  function makeNodes() {
    const arr = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const y = REST_SEG * i;
      arr.push({ x: ANCHOR_X, y, ox: ANCHOR_X, oy: y, fixed: i === 0 });
    }
    return arr;
  }

  class PullCordComponent {
    constructor(element, options = {}) {
      this.container = element;
      this.config = Object.assign({}, DEFAULT_CONFIG, options.config || {});
      this.onPull = options.onPull || (() => {});
      this.pulled = !!options.pulled;

      this.inner = this.container.querySelector('.pullcord-inner');
      this.cordPath = this.container.querySelector('.pullcord-path');
      this.knobGroup = this.container.querySelector('.pullcord-knob-group');
      this.knobBtn = this.container.querySelector('.pullcord-knob-btn');

      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.nodes = makeNodes();
      this.dragging = false;
      this.didDrag = false;
      this.clicked = false;
      this.target = { x: ANCHOR_X, y: REST_Y };
      this.dropDone = false;
      this.dragStartPos = { x: 0, y: 0 };

      this.running = false;
      this.raf = 0;
      this.prevT = 0;
      this.prevDt = 0;

      this.init();
    }

    init() {
      this.render();

      if (this.inner) {
        this.inner.addEventListener('animationend', (e) => {
          if (e.animationName === 'pullcord-drop') {
            this.endDrop();
          }
        });
        setTimeout(() => this.endDrop(), 1600);
      }

      if (this.knobBtn && !this.reduceMotion) {
        this.knobBtn.addEventListener('pointerdown', (e) => this.onPanStart(e));
        this.knobBtn.addEventListener('click', (e) => this.onClick(e));
        this.knobBtn.addEventListener('keydown', (e) => this.onKeyDown(e));
      } else if (this.knobBtn) {
        this.knobBtn.addEventListener('click', (e) => this.onClick(e));
        this.knobBtn.addEventListener('keydown', (e) => this.onKeyDown(e));
      }
    }

    render() {
      const pts = this.nodes;
      const last = pts.length - 1;
      if (this.cordPath) {
        this.cordPath.setAttribute('d', buildPath(pts));
      }
      if (this.knobGroup) {
        const tx = (pts[last].x - ANCHOR_X).toFixed(2);
        const ty = (pts[last].y - REST_Y).toFixed(2);
        this.knobGroup.setAttribute('transform', `translate(${tx} ${ty})`);
      }
      if (this.knobBtn) {
        const tx = pts[last].x - ANCHOR_X;
        const ty = pts[last].y - REST_Y;
        this.knobBtn.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      }
    }

    wake() {
      if (this.running) return;
      this.running = true;
      this.prevT = 0;
      this.prevDt = 0;
      this.raf = requestAnimationFrame((now) => this.step(now));
    }

    step(now) {
      const { gravity, damping, iterations, sleepVelocity } = this.config;
      const dt = this.prevT ? Math.min(0.04, Math.max(0.004, (now - this.prevT) / 1000)) : 1 / 60;
      this.prevT = now;
      const tc = this.prevDt > 0 ? dt / this.prevDt : 1;
      const velCoef = tc * Math.pow(damping, dt * 60);
      const accCoef = dt * dt;
      const pts = this.nodes;
      const last = pts.length - 1;

      pts[last].fixed = this.dragging;

      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p.fixed) continue;
        const vx = p.x - p.ox;
        const vy = p.y - p.oy;
        p.ox = p.x;
        p.oy = p.y;
        p.x += vx * velCoef;
        p.y += vy * velCoef + gravity * accCoef;
      }

      pts[0].x = ANCHOR_X;
      pts[0].y = 0;

      if (this.dragging) {
        pts[last].ox = pts[last].x;
        pts[last].oy = pts[last].y;
        pts[last].x = this.target.x;
        pts[last].y = this.target.y;
      }

      for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < last; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = ((REST_SEG - dist) / dist) * 0.5;
          const ox = dx * diff;
          const oy = dy * diff;

          if (!a.fixed) {
            a.x -= ox;
            a.y -= oy;
          }
          if (!b.fixed) {
            b.x += ox;
            b.y += oy;
          }
        }
      }

      this.prevDt = dt;
      this.render();

      let speed = 0;
      for (let i = 1; i < pts.length; i++) {
        speed += Math.abs(pts[i].x - pts[i].ox) + Math.abs(pts[i].y - pts[i].oy);
      }

      if (!this.dragging && speed < sleepVelocity * dt * 60) {
        this.render();
        this.running = false;
        return;
      }

      this.raf = requestAnimationFrame((n) => this.step(n));
    }

    triggerPull() {
      this.pulled = !this.pulled;
      if (this.knobBtn) {
        this.knobBtn.setAttribute('aria-pressed', String(this.pulled));
      }
      playDetentSound();
      if (typeof this.onPull === 'function') {
        this.onPull(this.pulled);
      }
    }

    scriptedPull() {
      this.triggerPull();
      if (this.reduceMotion) return;
      const pts = this.nodes;
      pts[pts.length - 1].oy -= 22;
      this.wake();
    }

    endDrop() {
      if (this.dropDone) return;
      this.dropDone = true;
      if (this.inner) {
        this.inner.classList.remove('pullcord-inner--drop');
      }
      if (this.reduceMotion) return;
      const pts = this.nodes;
      if (!pts) return;
      pts[pts.length - 1].oy -= 14;
      pts[pts.length - 1].ox -= 7;
      this.wake();
    }

    onPanStart(e) {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      
      this.dragging = true;
      this.hasMoved = false;
      this.didDrag = false;
      this.clicked = false;
      this.dragStartPos = { x: e.clientX, y: e.clientY };

      const pointerId = e.pointerId;
      if (this.knobBtn && pointerId !== undefined && typeof this.knobBtn.setPointerCapture === 'function') {
        try {
          this.knobBtn.setPointerCapture(pointerId);
        } catch (_) {}
      }

      const onPointerMove = (evt) => {
        if (!this.dragging) return;
        const dx = evt.clientX - this.dragStartPos.x;
        const dy = evt.clientY - this.dragStartPos.y;
        
        if (!this.hasMoved && Math.hypot(dx, dy) > 4) {
          this.hasMoved = true;
          this.didDrag = true;
        }

        if (!this.hasMoved) return;

        const rx = dx;
        const ry = REST_Y + dy;
        const dist = Math.hypot(rx, ry) || 0.0001;
        const maxD = REST_Y + this.config.stretchMax;
        const k = dist > maxD ? maxD / dist : 1;
        this.target = { x: ANCHOR_X + rx * k, y: ry * k };

        const clickAt = Math.min(this.config.stretchToggle, this.config.stretchMax - 1);
        if (!this.clicked && dist - REST_Y >= clickAt) {
          this.clicked = true;
          this.triggerPull();
        }
      };

      const onPointerUp = (evt) => {
        if (!this.dragging) return;
        this.dragging = false;

        if (this.knobBtn && pointerId !== undefined && typeof this.knobBtn.releasePointerCapture === 'function') {
          try {
            this.knobBtn.releasePointerCapture(pointerId);
          } catch (_) {}
        }

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        // If the user tapped without dragging, trigger smooth toggle immediately:
        if (!this.hasMoved && !this.clicked) {
          this.clicked = true;
          this.didDrag = true;
          this.scriptedPull();
          setTimeout(() => {
            this.didDrag = false;
          }, 350);
          return;
        }

        const pts = this.nodes;
        const p = pts[pts.length - 1];
        const vx = p.x - p.ox;
        const vy = p.y - p.oy;
        const v = Math.hypot(vx, vy);
        if (v > this.config.maxVelocity) {
          const k = this.config.maxVelocity / v;
          p.ox = p.x - vx * k;
          p.oy = p.y - vy * k;
        }
        this.wake();
        setTimeout(() => {
          this.didDrag = false;
        }, 200);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      this.wake();
    }

    onClick(e) {
      if (this.didDrag) return;
      this.scriptedPull();
    }

    onKeyDown(e) {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
        e.preventDefault();
        this.scriptedPull();
      }
    }
  }

  /* =========================================================================
     Parallax Layers Component
     Multi-depth compositor-friendly scroll & pointer parallax
     ========================================================================= */
  class ParallaxLayers {
    constructor(container, options = {}) {
      this.container = container;
      this.options = Object.assign({
        maxPointerShiftX: 35,
        maxPointerShiftY: 25,
        maxScrollShiftY: 75,
        pointerSpring: 0.08,
        scrollSpring: 0.1
      }, options);

      this.layers = Array.from(this.container.querySelectorAll('[data-depth]')).map(el => {
        const depth = parseFloat(el.getAttribute('data-depth')) || 0;
        return {
          element: el,
          depth: Math.min(1, Math.max(0, depth))
        };
      });

      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      // Pointer coordinates (-1 to 1)
      this.targetPointerX = 0;
      this.targetPointerY = 0;
      this.currentPointerX = 0;
      this.currentPointerY = 0;

      // Scroll progress (-1 to 1)
      this.targetScrollProgress = 0;
      this.currentScrollProgress = 0;

      this.isVisible = false;
      this.running = false;
      this.rafId = null;

      this.init();
    }

    init() {
      if (this.reduceMotion) {
        this.resetLayers();
        return;
      }

      this.setupObservers();
      this.bindEvents();
      this.calculateScroll();
      this.start();
    }

    resetLayers() {
      this.layers.forEach(({ element }) => {
        element.style.transform = '';
      });
    }

    setupObservers() {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
              this.start();
            } else {
              this.stop();
            }
          });
        }, { threshold: 0.05 });
        this.observer.observe(this.container);
      } else {
        this.isVisible = true;
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else if (this.isVisible) {
          this.start();
        }
      });
    }

    bindEvents() {
      if (this.hoverCapable) {
        window.addEventListener('pointermove', (e) => {
          if (!this.isVisible) return;
          const rect = this.container.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const nx = (e.clientX - cx) / (window.innerWidth / 2);
          const ny = (e.clientY - cy) / (window.innerHeight / 2);
          this.targetPointerX = Math.max(-1, Math.min(1, nx));
          this.targetPointerY = Math.max(-1, Math.min(1, ny));
          this.start();
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
          this.targetPointerX = 0;
          this.targetPointerY = 0;
          this.start();
        });
      }

      window.addEventListener('scroll', () => {
        if (!this.isVisible) return;
        this.calculateScroll();
        this.start();
      }, { passive: true });

      window.addEventListener('resize', () => {
        this.calculateScroll();
      }, { passive: true });
    }

    calculateScroll() {
      const rect = this.container.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 800;
      const containerCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const progress = (viewportCenter - containerCenter) / (viewportHeight / 2 + rect.height / 2);
      this.targetScrollProgress = Math.max(-1.5, Math.min(1.5, progress));
    }

    start() {
      if (this.running || !this.isVisible || this.reduceMotion) return;
      this.running = true;
      this.tick();
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    tick() {
      if (!this.running) return;

      const pSpring = this.options.pointerSpring;
      const sSpring = this.options.scrollSpring;

      this.currentPointerX += (this.targetPointerX - this.currentPointerX) * pSpring;
      this.currentPointerY += (this.targetPointerY - this.currentPointerY) * pSpring;
      this.currentScrollProgress += (this.targetScrollProgress - this.currentScrollProgress) * sSpring;

      const dx = Math.abs(this.targetPointerX - this.currentPointerX);
      const dy = Math.abs(this.targetPointerY - this.currentPointerY);
      const ds = Math.abs(this.targetScrollProgress - this.currentScrollProgress);

      const maxPX = this.options.maxPointerShiftX;
      const maxPY = this.options.maxPointerShiftY;
      const maxSY = this.options.maxScrollShiftY;

      for (let i = 0; i < this.layers.length; i++) {
        const { element, depth } = this.layers[i];
        if (depth === 0) continue;

        const posX = this.currentPointerX * depth * maxPX;
        const posY = (this.currentPointerY * depth * maxPY) + (this.currentScrollProgress * depth * maxSY);

        element.style.transform = `translate3d(${posX.toFixed(2)}px, ${posY.toFixed(2)}px, 0)`;
      }

      // Check if settled to stop running loop when idle (saves CPU / battery)
      if (dx < 0.001 && dy < 0.001 && ds < 0.001) {
        this.currentPointerX = this.targetPointerX;
        this.currentPointerY = this.targetPointerY;
        this.currentScrollProgress = this.targetScrollProgress;
        this.running = false;
        this.rafId = null;
        return;
      }

      this.rafId = requestAnimationFrame(() => this.tick());
    }
  }

  /* =========================================================================
     Terminal Animation Controller (Magic UI Inspired)
     Typed commands, sequential output reveal, clipboard copy & replay
     ========================================================================= */
  class TerminalAnimationController {
    constructor(terminalEl) {
      this.terminal = terminalEl;
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.block1 = document.getElementById('termBlock1');
      this.cmd1 = document.getElementById('cmdWhoami');
      this.out1 = document.getElementById('outWhoami');

      this.block2 = document.getElementById('termBlock2');
      this.cmd2 = document.getElementById('cmdCat');
      this.out2 = document.getElementById('outCat');

      this.block3 = document.getElementById('termBlock3');
      this.cmd3 = document.getElementById('cmdEcho');
      this.out3 = document.getElementById('outEcho');

      this.activePrompt = document.getElementById('termActivePrompt');
      this.copyBtn = document.getElementById('termCopyBtn');
      this.copyText = document.getElementById('termCopyText');
      this.replayBtn = document.getElementById('termReplayBtn');

      this.commands = [
        { block: this.block1, cmdEl: this.cmd1, outEl: this.out1, text: 'whoami', delayBefore: 200 },
        { block: this.block2, cmdEl: this.cmd2, outEl: this.out2, text: 'cat about.txt', delayBefore: 300 },
        { block: this.block3, cmdEl: this.cmd3, outEl: this.out3, text: 'echo $PASSION', delayBefore: 300 }
      ];

      this.isTyping = false;
      this.hasPlayed = false;
      this.timeouts = [];

      this.cursorEl = document.createElement('span');
      this.cursorEl.className = 'term-inline-cursor';
      this.cursorEl.setAttribute('aria-hidden', 'true');

      this.init();
    }

    init() {
      this.bindActions();

      if (this.reduceMotion) {
        this.showAllInstantly();
        return;
      }

      // Trigger animation when terminal enters viewport
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.hasPlayed) {
              this.hasPlayed = true;
              this.play();
            }
          });
        }, { threshold: 0.15 });
        observer.observe(this.terminal);
      } else {
        this.play();
      }
    }

    bindActions() {
      // Replay button
      if (this.replayBtn) {
        this.replayBtn.addEventListener('click', () => {
          this.reset();
          this.play();
        });
      }

      // Copy button
      if (this.copyBtn) {
        this.copyBtn.addEventListener('click', () => {
          this.copyToClipboard();
        });
      }
    }

    reset() {
      this.timeouts.forEach(t => clearTimeout(t));
      this.timeouts = [];
      this.isTyping = false;

      if (this.cursorEl.parentNode) {
        this.cursorEl.parentNode.removeChild(this.cursorEl);
      }

      if (this.cmd1) this.cmd1.textContent = '';
      if (this.cmd2) this.cmd2.textContent = '';
      if (this.cmd3) this.cmd3.textContent = '';

      if (this.out1) this.out1.classList.remove('visible');
      if (this.out2) this.out2.classList.remove('visible');
      if (this.out3) this.out3.classList.remove('visible');

      if (this.block2) this.block2.classList.add('term-hidden');
      if (this.block3) this.block3.classList.add('term-hidden');
      if (this.activePrompt) this.activePrompt.classList.add('term-hidden');
    }

    showAllInstantly() {
      if (this.cmd1) this.cmd1.textContent = 'whoami';
      if (this.cmd2) this.cmd2.textContent = 'cat about.txt';
      if (this.cmd3) this.cmd3.textContent = 'echo $PASSION';

      if (this.block2) this.block2.classList.remove('term-hidden');
      if (this.block3) this.block3.classList.remove('term-hidden');

      if (this.out1) this.out1.classList.add('visible');
      if (this.out2) this.out2.classList.add('visible');
      if (this.out3) this.out3.classList.add('visible');

      if (this.activePrompt) this.activePrompt.classList.remove('term-hidden');
    }

    play() {
      this.reset();
      this.isTyping = true;
      this.runStep(0);
    }

    runStep(index) {
      if (index >= this.commands.length) {
        if (this.cursorEl.parentNode) {
          this.cursorEl.parentNode.removeChild(this.cursorEl);
        }
        if (this.activePrompt) {
          this.activePrompt.classList.remove('term-hidden');
        }
        this.isTyping = false;
        return;
      }

      const step = this.commands[index];
      if (!step || !step.cmdEl) return;

      const timer = setTimeout(() => {
        step.block.classList.remove('term-hidden');
        step.cmdEl.textContent = '';
        step.cmdEl.parentNode.appendChild(this.cursorEl);

        let charIdx = 0;
        const text = step.text;

        const typeChar = () => {
          if (charIdx < text.length) {
            step.cmdEl.textContent += text.charAt(charIdx);
            charIdx++;
            const speed = 35 + Math.random() * 30;
            const t = setTimeout(typeChar, speed);
            this.timeouts.push(t);
          } else {
            const t = setTimeout(() => {
              step.outEl.classList.add('visible');
              const nextT = setTimeout(() => {
                this.runStep(index + 1);
              }, 400);
              this.timeouts.push(nextT);
            }, 160);
            this.timeouts.push(t);
          }
        };

        typeChar();
      }, step.delayBefore);

      this.timeouts.push(timer);
    }

    copyToClipboard() {
      const bioText = `khedr@dev:~$ whoami
> Khedr Mohammed — Security Analyst | Backend Developer

khedr@dev:~$ cat about.txt
Computer Engineering graduate candidate with a dual focus on Cybersecurity/Network Analysis and Secure Backend Development. Proficient in vulnerability assessment, OWASP Top 10 mitigation, and network inspection using tools like Burp Suite, Nmap, and Metasploit. Experienced in designing scalable, secure backend systems and databases utilizing Python, FastAPI, PostgreSQL, Elasticsearch, and Docker, with a strong background in Zero-Knowledge architectures and authenticated cryptography (AES-256-GCM, Argon2id). Aimed at bridging analytical threat detection with secure-by-default software engineering.

khedr@dev:~$ echo $PASSION
> "Building resilient systems and writing code that is secure by default."`;

      const onSuccess = () => {
        if (this.copyText) this.copyText.textContent = 'Copied!';
        if (this.copyBtn) this.copyBtn.classList.add('copied');
        setTimeout(() => {
          if (this.copyText) this.copyText.textContent = 'Copy';
          if (this.copyBtn) this.copyBtn.classList.remove('copied');
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(bioText).then(onSuccess).catch(() => {
          this.fallbackCopy(bioText, onSuccess);
        });
      } else {
        this.fallbackCopy(bioText, onSuccess);
      }
    }

    fallbackCopy(text, cb) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        cb();
      } catch (_) {}
      document.body.removeChild(textarea);
    }
  }

  /* =========================================================================
     AnimatedContent Component (React Bits Inspired)
     Smooth scroll-triggered entrance with distance, scale, and staggered delay
     ========================================================================= */
  class AnimatedContentController {
    constructor(selector = '.skill-category-card', options = {}) {
      this.elements = Array.from(document.querySelectorAll(selector));
      if (!this.elements.length) return;

      this.options = Object.assign({
        threshold: 0.12,
        staggerDelay: 85, // ms between consecutive cards
        initialDelay: 100 // ms before sequence starts
      }, options);

      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.init();
    }

    init() {
      if (this.reduceMotion) {
        this.elements.forEach(el => el.classList.add('is-animated'));
        return;
      }

      if ('IntersectionObserver' in window) {
        let triggered = false;
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !triggered) {
              triggered = true;
              this.animateSequence();
              observer.disconnect();
            }
          });
        }, {
          threshold: this.options.threshold,
          rootMargin: '0px 0px -40px 0px'
        });

        const grid = document.querySelector('.skills-grid');
        if (grid) {
          observer.observe(grid);
        } else {
          this.elements.forEach(el => observer.observe(el));
        }
      } else {
        this.animateSequence();
      }
    }

    animateSequence() {
      this.elements.forEach((el, index) => {
        const delay = this.options.initialDelay + index * this.options.staggerDelay;
        el.style.transitionDelay = `${delay}ms`;

        requestAnimationFrame(() => {
          el.classList.add('is-animated');
        });

        // Clear transition-delay after animation finishes so hover effects remain snappy and immediate
        setTimeout(() => {
          el.style.transitionDelay = '';
        }, delay + 800);
      });
    }
  }

  /* =========================================================================
     StackSectionController
     Handles segmented category tabs, smooth active pill transition,
     and animated filtering of tech stack chips.
     ========================================================================= */
  class StackSectionController {
    constructor(containerSelector = '#stackInteractiveContainer') {
      this.container = document.querySelector(containerSelector);
      if (!this.container) return;

      this.tabButtons = Array.from(this.container.querySelectorAll('.stack-tab-btn'));
      this.chips = Array.from(this.container.querySelectorAll('.stack-chip'));
      this.activeTab = 'all';

      this.init();
    }

    init() {
      if (!this.tabButtons.length || !this.chips.length) return;

      this.tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetTab = btn.getAttribute('data-tab');
          if (targetTab && targetTab !== this.activeTab) {
            this.setTab(targetTab, btn);
          }
        });
      });
    }

    setTab(tabName, clickedBtn) {
      this.activeTab = tabName;

      // Update Tab Buttons UI
      this.tabButtons.forEach(btn => {
        const isCurrent = btn === clickedBtn;
        btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');

        const indicator = btn.querySelector('.stack-tab-indicator');
        const label = btn.querySelector('.stack-tab-label');

        if (isCurrent) {
          if (!indicator) {
            // Move/create active indicator pill
            const activeIndicator = document.createElement('div');
            activeIndicator.className = 'stack-tab-indicator absolute inset-0 rounded-md bg-[var(--fg)] shadow-sm';
            activeIndicator.style.transform = 'none';
            btn.insertBefore(activeIndicator, btn.firstChild);
          }
          if (label) {
            label.classList.remove('text-[var(--muted)]');
            label.classList.add('font-semibold', 'text-[var(--bg)]');
          }
        } else {
          if (indicator) {
            indicator.remove();
          }
          if (label) {
            label.classList.remove('font-semibold', 'text-[var(--bg)]');
            label.classList.add('text-[var(--muted)]');
          }
        }
      });

      // Filter Chips (Instant Visibility Toggling, No Staggered Animation)
      this.chips.forEach(chip => {
        const category = chip.getAttribute('data-category');
        const matches = (tabName === 'all' || category === tabName);

        if (matches) {
          chip.classList.remove('is-filtered-out');
        } else {
          chip.classList.add('is-filtered-out');
        }
      });
    }
  }

  /* =========================================================================
     SpecularCardController Component (React Bits Inspired)
     Dynamic cursor-following specular border highlight across all cards
     ========================================================================= */
  class SpecularCardController {
    constructor(selector = '.specular-card', options = {}) {
      this.cards = Array.from(document.querySelectorAll(selector));
      if (!this.cards.length) return;

      this.options = Object.assign({
        proximity: 320, // distance in pixels where shine fades in
        maxIntensity: 1.0
      }, options);

      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      this.visibleCards = new Set();
      this.running = false;
      this.pointer = { x: -9999, y: -9999 };

      this.init();
    }

    init() {
      if (this.reduceMotion || !this.hoverCapable) return;

      this.setupIntersectionObserver();
      this.bindEvents();
    }

    setupIntersectionObserver() {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.visibleCards.add(entry.target);
            } else {
              this.visibleCards.delete(entry.target);
              entry.target.style.setProperty('--spec-opacity', '0');
            }
          });
        }, { threshold: 0.05, rootMargin: '100px' });

        this.cards.forEach(card => this.observer.observe(card));
      } else {
        this.cards.forEach(card => this.visibleCards.add(card));
      }
    }

    bindEvents() {
      window.addEventListener('pointermove', (e) => {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;

        if (!this.running) {
          this.running = true;
          requestAnimationFrame(() => this.update());
        }
      }, { passive: true });

      window.addEventListener('pointerleave', () => {
        this.visibleCards.forEach(card => {
          card.style.setProperty('--spec-opacity', '0');
        });
      });
    }

    update() {
      this.running = false;
      const px = this.pointer.x;
      const py = this.pointer.y;
      const prox = this.options.proximity;

      this.visibleCards.forEach(card => {
        const rect = card.getBoundingClientRect();

        // Distance from cursor to nearest point on the card's bounding box
        const dx = Math.max(rect.left - px, 0, px - rect.right);
        const dy = Math.max(rect.top - py, 0, py - rect.bottom);
        const dist = Math.hypot(dx, dy);

        if (dist <= prox) {
          // Smooth Hermite proximity curve (identical to SpecularButton)
          const t = Math.max(0, 1 - dist / prox);
          const proximityT = t * t * (3 - 2 * t);

          const relX = px - rect.left;
          const relY = py - rect.top;

          card.style.setProperty('--spec-x', `${relX.toFixed(1)}px`);
          card.style.setProperty('--spec-y', `${relY.toFixed(1)}px`);
          card.style.setProperty('--spec-opacity', proximityT.toFixed(3));
          card.style.setProperty('--spec-intensity', (proximityT * this.options.maxIntensity).toFixed(3));
        } else {
          if (card.style.getPropertyValue('--spec-opacity') !== '0') {
            card.style.setProperty('--spec-opacity', '0');
          }
        }
      });
    }
  }

  /* =========================================================================
     ProjectStackScrollController Component
     Scroll-driven Sticky Stacking Effect:
     Cards stick at stepped offsets as the page scrolls naturally.
     As succeeding cards overlap preceding cards, subtle scale-down and
     brightness dimming are applied for physical depth.
     Optimized for mobile performance without layout thrashing.
     ========================================================================= */
  class ProjectStackScrollController {
    constructor(selector = '.project-sticky-card-wrap') {
      this.items = Array.from(document.querySelectorAll(selector));
      this.container = document.getElementById('projectsStack');
      if (!this.items.length || !this.container) return;

      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.reduceMotion) return;

      this.isSectionVisible = false;
      this.ticking = false;
      this.stickyTops = [];
      this.isMobile = false;
      this.isShortViewport = false;

      this.init();
    }

    init() {
      this.updateDimensions();

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isSectionVisible = entry.isIntersecting;
            if (this.isSectionVisible) {
              this.requestUpdate();
            }
          });
        }, { rootMargin: '200px 0px' });

        this.observer.observe(this.container);
      } else {
        this.isSectionVisible = true;
      }

      window.addEventListener('scroll', () => {
        if (this.isSectionVisible) {
          this.requestUpdate();
        }
      }, { passive: true });

      window.addEventListener('resize', () => {
        this.updateDimensions();
        if (this.isSectionVisible) {
          this.requestUpdate();
        }
      }, { passive: true });

      // Handle orientation changes on mobile devices
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.updateDimensions();
          this.requestUpdate();
        }, 150);
      }, { passive: true });

      // Initial layout pass
      this.update();
    }

    updateDimensions() {
      this.isMobile = window.innerWidth <= 768;
      this.isShortViewport = window.innerHeight <= 560;

      // Cache sticky tops once per resize to eliminate layout thrashing during scroll
      this.stickyTops = this.items.map((card, i) => {
        const topVal = parseFloat(window.getComputedStyle(card).top);
        return isNaN(topVal) ? (72 + 24 + i * 36) : topVal;
      });
    }

    requestUpdate() {
      if (!this.ticking) {
        this.ticking = true;
        requestAnimationFrame(() => this.update());
      }
    }

    update() {
      this.ticking = false;
      const count = this.items.length;
      if (count === 0) return;

      // In landscape mobile or very short viewports, cards scroll naturally without transform
      if (this.isShortViewport) {
        for (let i = 0; i < count; i++) {
          this.items[i].style.transform = '';
          this.items[i].style.filter = '';
        }
        return;
      }

      // Responsive depth tuning for silky-smooth rendering
      const maxScaleFactor = this.isMobile ? 0.03 : 0.05;
      const maxBrightFactor = this.isMobile ? 0.08 : 0.14;
      const range = this.isMobile ? 240 : 320;
      const minScale = this.isMobile ? 0.94 : 0.90;
      const minBrightness = this.isMobile ? 0.85 : 0.78;

      // Calculate overlap progress for each card based on following cards
      for (let i = 0; i < count; i++) {
        const card = this.items[i];
        if (i === count - 1) {
          // Last card is never covered by any card
          card.style.transform = '';
          card.style.filter = '';
          continue;
        }

        let totalDepthProgress = 0;

        for (let j = i + 1; j < count; j++) {
          const nextCard = this.items[j];
          const nextRect = nextCard.getBoundingClientRect();
          const targetTop = this.stickyTops[j] || 96;

          // Transition begins 'range' pixels before next card settles into sticky position
          const distToSticky = nextRect.top - targetTop;
          const overlapProgress = Math.max(0, Math.min(1, (range - distToSticky) / range));

          totalDepthProgress += overlapProgress * (j === i + 1 ? 1 : 0.6);
        }

        const scale = Math.max(minScale, 1 - (totalDepthProgress * maxScaleFactor));
        const brightness = Math.max(minBrightness, 1 - (totalDepthProgress * maxBrightFactor));

        card.style.transform = `scale(${scale.toFixed(4)})`;
        card.style.filter = `brightness(${brightness.toFixed(3)})`;
      }
    }
  }

  // =========================================================================
  // ContactPhysicsChips Controller (Matter.js 2D Rigid Body Physics)
  // =========================================================================
  class ContactPhysicsChips {
    constructor(containerSelector = '#physicsContainer') {
      this.container = document.querySelector(containerSelector);
      if (!this.container) return;

      this.chips = Array.from(this.container.querySelectorAll('[data-stack-chip="true"]'));
      if (this.chips.length === 0) return;

      if (typeof Matter === 'undefined') {
        console.warn('Matter.js not loaded. Falling back to static layout.');
        return;
      }

      this.initPhysics();
    }

    initPhysics() {
      const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body } = Matter;

      let width = Math.max(300, this.container.clientWidth || 450);
      let height = Math.max(300, this.container.clientHeight || 380);

      // Create engine with zero-gravity floating field so chips stay beautifully distributed
      this.engine = Engine.create({
        gravity: { x: 0, y: 0, scale: 0 }
      });
      this.runner = Runner.create();

      // Bounding walls with ample padding
      const wallThickness = 100;
      this.walls = {
        floor: Bodies.rectangle(width / 2, height + wallThickness / 2, width * 3, wallThickness, { isStatic: true, restitution: 0.8 }),
        left: Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 3, { isStatic: true, restitution: 0.8 }),
        right: Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 3, { isStatic: true, restitution: 0.8 }),
        ceiling: Bodies.rectangle(width / 2, -wallThickness / 2, width * 3, wallThickness, { isStatic: true, restitution: 0.8 })
      };

      Composite.add(this.engine.world, [
        this.walls.floor,
        this.walls.left,
        this.walls.right,
        this.walls.ceiling
      ]);

      // Well-balanced initial positions across upper, middle, and lower areas
      const spawnConfig = [
        { xRatio: 0.28, yRatio: 0.28, angle: -0.15 }, // GitHub (top-left)
        { xRatio: 0.72, yRatio: 0.26, angle: 0.14 },  // Gmail (top-right)
        { xRatio: 0.50, yRatio: 0.52, angle: -0.05 }, // LinkedIn (center)
        { xRatio: 0.26, yRatio: 0.76, angle: 0.12 },  // Instagram (bottom-left)
        { xRatio: 0.74, yRatio: 0.75, angle: -0.10 }  // X (bottom-right)
      ];

      this.chipItems = [];

      this.chips.forEach((chipEl, idx) => {
        const chipRect = chipEl.getBoundingClientRect();
        const bw = Math.max(105, chipRect.width || 130);
        const bh = Math.max(38, chipRect.height || 42);

        const config = spawnConfig[idx] || { xRatio: 0.5, yRatio: 0.5, angle: 0 };
        const x = Math.max(bw / 2 + 10, Math.min(width - bw / 2 - 10, width * config.xRatio));
        const y = Math.max(bh / 2 + 10, Math.min(height - bh / 2 - 10, height * config.yRatio));

        const body = Bodies.rectangle(x, y, bw, bh, {
          chamfer: { radius: 14 },
          restitution: 0.75,
          friction: 0.1,
          frictionAir: 0.016,
          density: 0.0018,
          angle: config.angle
        });

        // Gentle initial angular drift
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);

        chipEl.style.position = 'absolute';
        chipEl.style.top = '0px';
        chipEl.style.left = '0px';
        chipEl.style.pointerEvents = 'auto';

        this.chipItems.push({
          body,
          el: chipEl,
          halfW: bw / 2,
          halfH: bh / 2,
          href: chipEl.getAttribute('data-href')
        });

        Composite.add(this.engine.world, body);
      });

      // Mouse constraint for dragging and tossing
      const mouse = Mouse.create(this.container);
      const mouseConstraint = MouseConstraint.create(this.engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.7,
          render: { visible: false }
        }
      });

      // Remove wheel listener to allow page scrolling
      if (mouse.element) {
        mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
        mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
        mouse.element.removeEventListener('wheel', mouse.mousewheel);
      }

      Composite.add(this.engine.world, mouseConstraint);

      // Distinguish tap to open link vs drag/toss
      let pointerDownPos = { x: 0, y: 0 };
      let pointerDownTime = 0;

      const handlePointerDown = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        pointerDownPos = { x: clientX, y: clientY };
        pointerDownTime = Date.now();
      };

      const handlePointerUp = (e) => {
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dist = Math.hypot(clientX - pointerDownPos.x, clientY - pointerDownPos.y);
        const duration = Date.now() - pointerDownTime;

        if (dist < 8 && duration < 500) {
          const target = e.target.closest('[data-stack-chip="true"]');
          if (target && target.dataset.href) {
            const url = target.dataset.href;
            if (url.startsWith('mailto:')) {
              window.location.href = url;
            } else {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }
        }
      };

      this.container.addEventListener('mousedown', handlePointerDown);
      this.container.addEventListener('mouseup', handlePointerUp);
      this.container.addEventListener('touchstart', handlePointerDown, { passive: true });
      this.container.addEventListener('touchend', handlePointerUp);

      let isInteracting = false;
      let settledFrames = 0;

      const wakePhysics = () => {
        if (!this.runner.enabled) {
          this.runner.enabled = true;
          settledFrames = 0;
        }
      };

      this.container.addEventListener('mousedown', wakePhysics);
      this.container.addEventListener('touchstart', wakePhysics, { passive: true });
      this.container.addEventListener('pointerenter', wakePhysics, { passive: true });

      Events.on(mouseConstraint, 'startdrag', () => {
        isInteracting = true;
        wakePhysics();
        this.container.classList.add('is-grabbing');
      });
      Events.on(mouseConstraint, 'enddrag', () => {
        isInteracting = false;
        this.container.classList.remove('is-grabbing');
      });

      // Strict boundary keeper on every frame & automatic idle sleep
      Events.on(this.engine, 'afterUpdate', () => {
        const cw = this.container.clientWidth;
        const ch = this.container.clientHeight;

        let maxSpeed = 0;
        for (let i = 0; i < this.chipItems.length; i++) {
          const item = this.chipItems[i];
          const b = item.body;
          const spd = Math.hypot(b.velocity.x, b.velocity.y);
          if (spd > maxSpeed) maxSpeed = spd;

          const minX = item.halfW + 4;
          const maxX = cw - item.halfW - 4;
          const minY = item.halfH + 4;
          const maxY = ch - item.halfH - 4;

          if (b.position.x < minX) {
            Matter.Body.setPosition(b, { x: minX, y: b.position.y });
            Matter.Body.setVelocity(b, { x: Math.abs(b.velocity.x) * 0.7, y: b.velocity.y });
          } else if (b.position.x > maxX) {
            Matter.Body.setPosition(b, { x: maxX, y: b.position.y });
            Matter.Body.setVelocity(b, { x: -Math.abs(b.velocity.x) * 0.7, y: b.velocity.y });
          }

          if (b.position.y < minY) {
            Matter.Body.setPosition(b, { x: b.position.x, y: minY });
            Matter.Body.setVelocity(b, { x: b.velocity.x, y: Math.abs(b.velocity.y) * 0.7 });
          } else if (b.position.y > maxY) {
            Matter.Body.setPosition(b, { x: b.position.x, y: maxY });
            Matter.Body.setVelocity(b, { x: b.velocity.x, y: -Math.abs(b.velocity.y) * 0.5 });
          }

          item.el.style.transform = `translate3d(${b.position.x - item.halfW}px, ${b.position.y - item.halfH}px, 0px) rotate(${b.angle}rad)`;
        }

        // Put physics engine to sleep once chips settle to save CPU & battery
        if (!isInteracting) {
          if (maxSpeed < 0.08) {
            settledFrames++;
            if (settledFrames > 50) {
              this.runner.enabled = false;
            }
          } else {
            settledFrames = 0;
          }
        } else {
          settledFrames = 0;
        }
      });

      // Start physics runner
      Runner.run(this.runner, this.engine);

      // Pause when offscreen
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.runner.enabled = true;
            } else {
              this.runner.enabled = false;
            }
          });
        }, { threshold: 0.05 });

        observer.observe(this.container);
      }

      // Dynamic resize handler
      const updateDimensions = () => {
        const newW = this.container.clientWidth;
        const newH = this.container.clientHeight;
        if (newW && newH) {
          Matter.Body.setPosition(this.walls.floor, { x: newW / 2, y: newH + wallThickness / 2 });
          Matter.Body.setPosition(this.walls.right, { x: newW + wallThickness / 2, y: newH / 2 });
          Matter.Body.setPosition(this.walls.ceiling, { x: newW / 2, y: -wallThickness / 2 });
          Matter.Body.setPosition(this.walls.left, { x: -wallThickness / 2, y: newH / 2 });
        }
      };

      if ('ResizeObserver' in window) {
        new ResizeObserver(updateDimensions).observe(this.container);
      } else {
        window.addEventListener('resize', updateDimensions);
      }
    }
  }

  /* =========================================================================
     Cinematic Hero Controller (Audio-Reactive SoftAurora + Kinetic Subtitles)
     ========================================================================= */

  class CinematicHeroController {
    constructor() {
      this.playBtn = document.getElementById('pcPlayBtn');
      this.audioEl = document.getElementById('heroCinematicAudio');
      this.auroraContainer = document.getElementById('heroAurora');
      this.auroraCanvas = document.getElementById('auroraCanvas');
      this.heroSection = document.getElementById('hero');
      this.navbar = document.getElementById('navbar');
      this.kineticWrapper = document.getElementById('kineticTextWrapper');
      this.statusBadge = document.querySelector('.pc-status');
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!this.playBtn || !this.audioEl || !this.auroraCanvas) return;

      this.subtitles = [
        { start: 0.0, end: 2.0, text: "I am not like everybody else." },
        { start: 2.0, end: 5.0, text: "I don't want to be like everybody else." },
        { start: 5.0, end: 7.0, text: "I have something inside burning." },
        { start: 7.0, end: 10.0, text: "I'm supposed to be something different." },
        { start: 10.0, end: 12.75, text: "I have to be something different!" }
      ];

      // Exact Audio-VFX Synchronized Impact Cues
      this.impactCues = [
        { time: 2.00, intensity: 0.45, isApex: false, triggered: false },
        { time: 4.80, intensity: 0.60, isApex: false, triggered: false },
        { time: 7.00, intensity: 1.00, isApex: true,  triggered: false },
        { time: 8.65, intensity: 0.65, isApex: false, triggered: false },
        { time: 10.00, intensity: 0.85, isApex: false, triggered: false }
      ];

      this.audioMissing = false;
      this.isPlaying = false;
      this.isStarting = false;
      this.swapTimeout = null;
      this.currentSubtitleIndex = -1;
      this.rafId = null;

      // Predictive Arc Clock & Timing
      this.clock = 0;
      this.lastTime = performance.now();

      // Impact Shockwave State
      this.impactState = {
        active: false,
        startTime: 0,
        maxIntensity: 0,
        intensity: 0,
        progress: 0,
        duration: 0.8
      };

      // Pointer Repulsion State
      this.pointerState = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        active: 0,
        targetActive: 0
      };

      // Smooth Fluid Fire Shader Configurations
      this.config = {
        speed: 1.35,
        pointerRadius: 280,
        pointerStrength: 0.40,
        bg: [0.012, 0.010, 0.016],     // Deep obsidian ash
        base: [0.96, 0.12, 0.24],      // Radiant Crimson #f43f5e
        accent: [1.0, 0.44, 0.08],     // Molten Amber Orange
        high: [1.0, 0.98, 0.92]        // Incandescent White Heat Core
      };

      // WebGL State
      this.gl = null;
      this.program = null;
      this.locs = {};

      // Web Audio API State
      this.audioCtx = null;
      this.analyser = null;
      this.sourceNode = null;
      this.dataArray = null;
      this.audioValues = { volume: 0, bass: 0, mid: 0 };

      this.initEvents();
    }

    initWebGL() {
      if (this.gl) return true;
      const canvas = this.auroraCanvas;
      const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false })
              || canvas.getContext('experimental-webgl');
      if (!gl) return false;
      this.gl = gl;

      const VERT_SRC = `
        attribute vec2 a_pos;
        void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
      `;

      const FRAG_SRC = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        uniform vec2  uRes;
        uniform float uTime;
        uniform float uDpr;
        uniform vec3  uBg, uBase, uAccent, uHigh;
        uniform vec2  uMouse;
        uniform float uMouseRadius, uMouseStrength;

        // Shockwave Impact & Real-time Audio Breathing
        uniform float uImpact;         // 0.0 to 1.0 (apex cue blast)
        uniform float uImpactProgress; // 0.0 to 1.0 (expanding ring)
        uniform float uAudioEnergy;    // 0.0 to 1.0 (continuous voice/bass intensity)

        // 2D Hash & Noise Functions for Organic Fluid Fire
        vec2 hash(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                         dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                     mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                         dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.02 + vec2(1.7, 9.2);
            a *= 0.5;
          }
          return v;
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / uRes.xy;
          // Normalized aspect-corrected coordinates: (0,0) at bottom-center
          vec2 p = (gl_FragCoord.xy - vec2(uRes.x * 0.5, 0.0)) / uRes.y;

          // 1. Interactive Pointer Heat Distortion
          vec2 m = (uMouse - vec2(uRes.x * 0.5, 0.0)) / uRes.y;
          vec2 toMouse = p - m;
          float dMouse = length(toMouse);
          float mRadius = max(0.05, uMouseRadius / uRes.y);
          float mForce = uMouseStrength * exp(- (dMouse * dMouse) / (2.0 * mRadius * mRadius));
          if (dMouse > 0.001) {
            p += (toMouse / dMouse) * (mForce * 0.18);
          }

          // 2. Shockwave blast ring & outward displacement
          float shockRadius = uImpactProgress * 1.8;
          float dCenter = length(p - vec2(0.0, 0.25));
          float ringDist = abs(dCenter - shockRadius);
          float ringWidth = 0.08 + uImpact * 0.12;
          float ring = (uImpact > 0.01) ? (smoothstep(ringWidth, 0.0, ringDist) * uImpact) : 0.0;
          if (uImpact > 0.01 && dCenter > 0.001) {
            vec2 blastDir = (p - vec2(0.0, 0.25)) / dCenter;
            p += blastDir * (smoothstep(ringWidth * 1.4, 0.0, ringDist) * uImpact * 0.16);
          }

          // 3. Fluid Flame Coordinate System (Rising Upwards with Audio Acceleration)
          float flameSpeed = uTime * (0.75 + uAudioEnergy * 0.85 + uImpact * 1.5);
          vec2 fireCoord = vec2(p.x * 2.2, p.y * 1.6);
          fireCoord.y -= flameSpeed;

          // Domain warping: creates curling tongues of fire and turbulent flame plumes
          vec2 q = vec2(fbm(fireCoord), fbm(fireCoord + vec2(4.3, 1.8)));
          vec2 r = vec2(fbm(fireCoord + 2.5 * q + vec2(1.7, 3.2) - vec2(0.0, flameSpeed * 0.5)),
                        fbm(fireCoord + 2.5 * q + vec2(8.3, 2.8) + vec2(0.0, flameSpeed * 0.3)));
          float flameNoise = fbm(fireCoord + 3.0 * r);

          // 4. Smooth Fire Geometry & Vertical Dissipation
          // Fire originates from bottom / center and rises gracefully
          float horizontalTaper = 1.0 - smoothstep(0.0, 1.1 + uAudioEnergy * 0.4, abs(p.x) * (1.2 + p.y * 0.6));
          float verticalFade = smoothstep(1.3 + uImpact * 0.4 + uAudioEnergy * 0.3, 0.05, p.y);
          
          // Organic flame body
          float fireIntensity = clamp((flameNoise * 1.25 + 0.35) * horizontalTaper * verticalFade, 0.0, 1.6);
          fireIntensity += (1.0 - smoothstep(0.0, 0.35, p.y)) * horizontalTaper * 0.65; // Molten base glow
          fireIntensity *= (1.0 + uAudioEnergy * 0.75 + uImpact * 1.2); // Audio reactivity boost

          // 5. Fire Color Palette Grading (Charred ember -> Crimson -> Fiery Orange -> Radiant Gold -> White Heat)
          vec3 darkEmber  = mix(uBg, vec3(0.35, 0.02, 0.05), 0.7);
          vec3 crimson    = uBase;                                    // Radiant Crimson #f43f5e
          vec3 flameAmber = uAccent;                                  // Molten Amber Orange
          vec3 goldHeat   = vec3(1.0, 0.84, 0.25);                    // Pure Golden Flame
          vec3 whiteHot   = uHigh;                                    // Blinding White Core #ffffff

          vec3 col = uBg;

          // Layer 1: Ambient ember smoke / deep heat aura
          float aura = smoothstep(0.05, 0.45, fireIntensity);
          col = mix(col, darkEmber, aura * 0.85);

          // Layer 2: Rich crimson and scarlet flame tongues
          float midFlame = smoothstep(0.30, 0.75, fireIntensity);
          col = mix(col, crimson, midFlame);

          // Layer 3: Blazing amber-orange heat
          float hotFlame = smoothstep(0.65, 1.05, fireIntensity);
          col = mix(col, flameAmber, hotFlame);

          // Layer 4: Radiant golden heat core
          float coreFlame = smoothstep(0.95, 1.35, fireIntensity);
          col = mix(col, goldHeat, coreFlame);

          // Layer 5: Incandescent white-hot sparks and inner furnace
          float whiteCore = smoothstep(1.30, 1.65, fireIntensity);
          col = mix(col, whiteHot, whiteCore);

          // 6. Shockwave Blast Wave Overlay (Fiery Golden Ring & Apex Flash)
          if (ring > 0.01) {
            col = mix(col, goldHeat, ring * 0.75);
            col += whiteHot * (ring * 0.6);
          }
          if (uImpact > 0.01) {
            col += flameAmber * (pow(uImpact, 2.0) * 0.35);
            col += whiteHot * (pow(uImpact, 3.0) * 0.25);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `;

      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.warn('PredictiveArc shader compile warning:', gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };

      try {
        const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
        const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
        if (!vs || !fs) return false;

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          console.warn('PredictiveArc link warning:', gl.getProgramInfoLog(prog));
          return false;
        }

        gl.useProgram(prog);
        this.program = prog;

        // Full-screen triangle buffer
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        this.locs = {};
        this.u = (name) => {
          if (!(name in this.locs)) this.locs[name] = gl.getUniformLocation(prog, name);
          return this.locs[name];
        };

        // Pointer move / leave listeners for flame heat swirl & repulsion
        const handlePointer = (e) => {
          const rect = this.auroraCanvas.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          this.pointerState.targetX = (e.clientX - rect.left) * dpr;
          this.pointerState.targetY = (rect.height - (e.clientY - rect.top)) * dpr;
          this.pointerState.targetActive = 1;
        };

        if (this.heroSection) {
          this.heroSection.addEventListener('pointermove', handlePointer, { passive: true });
          this.heroSection.addEventListener('pointerleave', () => { this.pointerState.targetActive = 0; });
          this.heroSection.addEventListener('pointercancel', () => { this.pointerState.targetActive = 0; });
        }

        return true;
      } catch (err) {
        console.warn('PredictiveArc WebGL init error:', err);
        return false;
      }
    }

    triggerImpact(intensity = 1.0, isApex = false) {
      this.impactState = {
        active: true,
        startTime: performance.now(),
        maxIntensity: intensity,
        intensity: intensity,
        progress: 0,
        duration: isApex ? 0.95 : 0.65
      };

      if (isApex) {
        const introEl = document.getElementById('heroIntro') || this.heroSection;
        if (introEl) {
          introEl.classList.remove('is-shaking');
          void introEl.offsetWidth; // trigger reflow
          introEl.classList.add('is-shaking');
          setTimeout(() => introEl.classList.remove('is-shaking'), 450);
        }
      }
    }

    renderLoop(now) {
      if (!this.isPlaying) return;
      this.rafId = requestAnimationFrame((t) => this.renderLoop(t));

      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;

      // 1. Frame-accurate 60fps Subtitle & Cue Sync
      this.handleTimeUpdate();

      // 2. Audio Frequencies Analysis with Acoustic Timeline Fallback
      let hasRealAudio = false;
      if (this.analyser && this.dataArray) {
        try {
          this.analyser.getByteFrequencyData(this.dataArray);

          // Bass range (bins 1 to 14)
          let bassSum = 0;
          for (let i = 1; i <= 14; i++) bassSum += this.dataArray[i];
          const bass = bassSum / (14 * 255);

          // Vocal / mid range (bins 15 to 50)
          let midSum = 0;
          for (let i = 15; i <= 50; i++) midSum += this.dataArray[i];
          const mid = midSum / (36 * 255);

          // Overall volume
          let total = 0;
          for (let i = 0; i < this.dataArray.length; i++) total += this.dataArray[i];
          const volume = total / (this.dataArray.length * 255);

          if (volume > 0.005 || bass > 0.005) {
            hasRealAudio = true;
            this.audioValues = { volume, bass, mid };
          }
        } catch (e) {}
      }

      // Seamless fallback model matching audio loudness waveform if Analyser is silent/sandboxed
      if (!hasRealAudio && this.audioEl && !this.audioEl.paused) {
        const t = this.audioEl.currentTime;
        let sVol = 0.25;
        let sBass = 0.20;
        let sMid = 0.28;

        if (t < 0.17) {
          sVol = 0.02; sBass = 0.02; sMid = 0.02;
        } else if (t < 2.0) {
          sVol = 0.35 + 0.08 * Math.sin(t * 14);
          sBass = 0.28 + 0.06 * Math.cos(t * 9);
          sMid = 0.38;
        } else if (t < 5.0) {
          const swell = (t > 4.4 && t < 4.9) ? 0.40 : 0.0;
          sVol = 0.36 + swell + 0.1 * Math.sin(t * 11);
          sBass = 0.30 + swell * 0.8;
          sMid = 0.40;
        } else if (t < 7.0) {
          sVol = 0.40 + 0.12 * Math.sin(t * 12);
          sBass = 0.35 + 0.08 * Math.cos(t * 8);
          sMid = 0.44;
        } else if (t < 10.0) {
          const apexSwell = (t >= 7.0 && t < 7.9) ? 0.50 : 0.22;
          sVol = 0.50 + apexSwell;
          sBass = 0.48 + apexSwell * 0.85;
          sMid = 0.52;
        } else if (t < 12.35) {
          const finSwell = (t >= 10.0 && t < 10.8) ? 0.46 : 0.18;
          sVol = 0.44 + finSwell;
          sBass = 0.40 + finSwell * 0.75;
          sMid = 0.46;
        } else {
          sVol = 0.02; sBass = 0.02; sMid = 0.02;
        }
        this.audioValues = { volume: sVol, bass: sBass, mid: sMid };
      }

      // 3. Audio-reactive clock & wave speed (accelerates with vocal energy)
      this.clock = (this.clock + dt * 0.9 * (this.config.speed + this.audioValues.volume * 2.8 + this.audioValues.bass * 1.5)) % 6283;

      // 4. Pointer smooth lerping
      const posLerp = Math.min(1, dt * 12);
      const activeLerp = Math.min(1, dt * 6);
      this.pointerState.x += (this.pointerState.targetX - this.pointerState.x) * posLerp;
      this.pointerState.y += (this.pointerState.targetY - this.pointerState.y) * posLerp;
      this.pointerState.active += (this.pointerState.targetActive - this.pointerState.active) * activeLerp;

      // 5. Impact expansion & decay calculation
      const imp = this.impactState;
      if (imp.active) {
        const elapsed = (now - imp.startTime) / 1000;
        const duration = imp.duration || 0.8;
        if (elapsed < duration) {
          const p = elapsed / duration;
          imp.progress = p;
          imp.intensity = imp.maxIntensity * Math.pow(1.0 - p, 2.2);
        } else {
          imp.active = false;
          imp.intensity = 0;
          imp.progress = 0;
        }
      }

      // 6. Draw WebGL Frame with Real-Time Audio-Synchronized Parameters
      const gl = this.gl;
      if (!gl || !this.program) return;

      const isMobile = window.innerWidth < 768;
      // Cap DPR to 1.0 on mobile to cut shader fill-rate workload by ~70%; 1.85 max on desktop
      const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.85);
      const cw = this.auroraCanvas.clientWidth || 1200;
      const ch = this.auroraCanvas.clientHeight || 800;
      const bw = Math.max(1, Math.round(cw * dpr));
      const bh = Math.max(1, Math.round(ch * dpr));

      if (this.auroraCanvas.width !== bw || this.auroraCanvas.height !== bh) {
        this.auroraCanvas.width = bw;
        this.auroraCanvas.height = bh;
        gl.viewport(0, 0, bw, bh);
      }

      const impactVal = imp.active ? imp.intensity : 0.0;
      const impactProg = imp.active ? imp.progress : 0.0;
      const audioEnergyVal = Math.min(1.0, this.audioValues.volume * 1.35 + this.audioValues.bass * 0.90);

      gl.useProgram(this.program);
      gl.uniform2f(this.u("uRes"), bw, bh);
      gl.uniform1f(this.u("uTime"), this.clock);
      gl.uniform1f(this.u("uDpr"), dpr);
      gl.uniform2f(this.u("uMouse"), this.pointerState.x, this.pointerState.y);
      gl.uniform1f(this.u("uMouseRadius"), this.config.pointerRadius * dpr);
      gl.uniform1f(this.u("uMouseStrength"), this.config.pointerStrength * this.pointerState.active);
      gl.uniform1f(this.u("uImpact"), impactVal);
      gl.uniform1f(this.u("uImpactProgress"), impactProg);
      gl.uniform1f(this.u("uAudioEnergy"), audioEnergyVal);

      const bg = this.config.bg;
      const base = this.config.base;
      const accent = this.config.accent;
      const high = this.config.high;

      gl.uniform3f(this.u("uBg"), bg[0], bg[1], bg[2]);
      gl.uniform3f(this.u("uBase"), base[0], base[1], base[2]);
      gl.uniform3f(this.u("uAccent"), accent[0], accent[1], accent[2]);
      gl.uniform3f(this.u("uHigh"), high[0], high[1], high[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderKineticText(text, isApex = false) {
      if (!this.kineticWrapper) return;
      const container = this.kineticWrapper;

      const oldWords = container.querySelectorAll('.kinetic-word');
      if (oldWords.length > 0 && !this.reduceMotion) {
        oldWords.forEach((wordEl) => {
          wordEl.style.opacity = '0';
          wordEl.style.filter = 'blur(10px)';
          wordEl.style.transform = 'translateX(-15px) scale(0.96)';
          wordEl.style.transition = 'opacity 0.1s ease, filter 0.1s ease, transform 0.1s ease';
        });
      }

      const swapDelay = (oldWords.length > 0 && !this.reduceMotion) ? 75 : 0;

      clearTimeout(this.swapTimeout);
      this.swapTimeout = setTimeout(() => {
        container.innerHTML = '';
        if (!text || !this.isPlaying || (this.audioEl && this.audioEl.paused)) return;

        const words = text.trim().split(/\s+/);
        words.forEach((word, idx) => {
          const span = document.createElement('span');
          span.className = 'kinetic-word' + (isApex ? ' is-apex' : '');
          span.textContent = word;
          span.style.marginRight = '0.36em';
          span.style.marginBottom = '0.15em';

          if (this.reduceMotion) {
            span.style.opacity = '1';
          } else {
            span.style.opacity = '0';
            span.style.filter = 'blur(12px)';
            span.style.transform = isApex ? 'translateX(20px) scale(1.06)' : 'translateX(16px) scale(0.96)';

            setTimeout(() => {
              if (!this.isPlaying || (this.audioEl && this.audioEl.paused)) return;
              span.style.opacity = '1';
              span.style.filter = 'blur(0px)';
              span.style.transform = isApex ? 'translateX(0) scale(1.04)' : 'translateX(0) scale(1)';
            }, idx * 45 + 15);
          }

          container.appendChild(span);
          if (idx < words.length - 1) {
            container.appendChild(document.createTextNode(' '));
          }
        });
      }, swapDelay);
    }

    handleTimeUpdate() {
      if (!this.isPlaying || !this.audioEl || this.audioEl.paused) return;
      const curTime = this.audioEl.currentTime;

      // Stop cleanly when playback finishes speech duration
      if (curTime >= this.subtitles[this.subtitles.length - 1].end) {
        this.stopCinematicMode();
        return;
      }

      // Check Impact Cues
      for (let c = 0; c < this.impactCues.length; c++) {
        const cue = this.impactCues[c];
        if (!cue.triggered && curTime >= cue.time && curTime < cue.time + 0.35) {
          cue.triggered = true;
          this.triggerImpact(cue.intensity, cue.isApex);
        }
      }

      // Check Subtitle Interval
      let activeIndex = -1;
      for (let i = 0; i < this.subtitles.length; i++) {
        const item = this.subtitles[i];
        if (curTime >= item.start && curTime < item.end) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex !== -1 && activeIndex !== this.currentSubtitleIndex) {
        this.currentSubtitleIndex = activeIndex;
        const isApex = (activeIndex === 3); // 7.00s - 10.00s Apex phrase
        this.renderKineticText(this.subtitles[activeIndex].text, isApex);
      }
    }

    showAudioMissingFeedback() {
      // Ensure all visual effects and classes are strictly cleared and not applied
      this.heroSection?.classList.remove('mode-cinematic');
      this.navbar?.classList.remove('mode-cinematic');
      document.body?.classList.remove('mode-cinematic');
      this.auroraContainer?.classList.remove('is-active');
      this.playBtn?.classList.remove('is-hidden');
      if (this.kineticWrapper) this.kineticWrapper.innerHTML = '';
      const introEl = document.getElementById('heroIntro');
      if (introEl) introEl.classList.remove('is-shaking');

      if (!this.playBtn) return;
      const label = this.playBtn.querySelector('.pc-play-label');
      const originalText = label ? label.textContent : 'Experience';

      this.playBtn.classList.add('pc-play-btn-error');
      if (label) label.textContent = 'Audio Missing';
      if (this.statusBadge) this.statusBadge.textContent = 'Audio Unavailable';

      setTimeout(() => {
        this.playBtn.classList.remove('pc-play-btn-error');
        if (label && !this.isPlaying) label.textContent = originalText;
        if (this.statusBadge && !this.isPlaying) this.statusBadge.textContent = 'Available';
      }, 2500);
    }

    async startCinematicMode() {
      if (this.isPlaying || this.isStarting || !this.audioEl) return;
      this.isStarting = true;

      // Check for explicit media errors
      if (this.audioEl.error && this.audioEl.error.code !== 0) {
        this.audioMissing = true;
      }

      if (this.audioMissing) {
        console.warn('Cinematic audio file missing or failed to load. Aborting without applying visual effects.');
        this.showAudioMissingFeedback();
        this.isStarting = false;
        return;
      }

      // 1. Synchronously unlock and resume Web Audio context within direct user gesture
      try {
        if (!this.audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      } catch (e) {}

      // 2. Synchronous rewind & play initiation (CRITICAL FOR MOBILE TRANSIENT ACTIVATION)
      try {
        this.audioEl.currentTime = 0;
      } catch (_) {}

      let playPromise;
      try {
        playPromise = this.audioEl.play();
      } catch (err) {
        console.warn('Audio play() invocation error:', err);
      }

      // 3. Await playback start
      try {
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (audioErr) {
        console.warn('Audio playback failed or was restricted by device policy:', audioErr);
        this.audioMissing = true;
        this.showAudioMissingFeedback();
        this.stopCinematicMode();
        this.isStarting = false;
        return;
      }

      // Check if paused after playPromise (in case device paused immediately)
      if (this.audioEl.paused) {
        // Short grace period on mobile for media buffering
        await new Promise((r) => setTimeout(r, 120));
        if (this.audioEl.paused) {
          console.warn('Audio is paused. Aborting cinematic activation.');
          this.showAudioMissingFeedback();
          this.stopCinematicMode();
          this.isStarting = false;
          return;
        }
      }

      // 4. Activate Visual Effects & Cinematic Mode
      this.isPlaying = true;
      this.isStarting = false;

      // Reset state & impact cues
      this.currentSubtitleIndex = -1;
      this.impactCues.forEach(c => { c.triggered = false; });
      this.impactState = { active: false, startTime: 0, maxIntensity: 0, intensity: 0, progress: 0, duration: 0.8 };
      if (this.kineticWrapper) this.kineticWrapper.innerHTML = '';

      // Transition UI
      this.heroSection?.classList.add('mode-cinematic');
      this.navbar?.classList.add('mode-cinematic');
      document.body?.classList.add('mode-cinematic');
      this.auroraContainer?.classList.add('is-active');
      this.playBtn?.classList.add('is-hidden');
      if (this.statusBadge) this.statusBadge.textContent = 'Playing...';

      // 5. Connect Web Audio API Analyser
      try {
        if (this.audioCtx && !this.analyser) {
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 256;
          this.analyser.smoothingTimeConstant = 0.5; // Fast transient response to voice
          this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

          if (!this.sourceNode && this.audioEl) {
            this.sourceNode = this.audioCtx.createMediaElementSource(this.audioEl);
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
          }
        }
      } catch (audioCtxErr) {
        console.warn('Web Audio API analyzer notice (using synthetic fallback waveform):', audioCtxErr);
      }

      // 6. Initialize PredictiveArc WebGL Shader Loop
      try {
        if (this.initWebGL()) {
          this.lastTime = performance.now();
          if (!this.rafId) {
            this.rafId = requestAnimationFrame((t) => this.renderLoop(t));
          }
        }
      } catch (glErr) {
        console.warn('PredictiveArc WebGL error:', glErr);
      }

      // 7. Initial Frame Evaluation
      this.handleTimeUpdate();
    }

    stopCinematicMode() {
      this.isPlaying = false;
      this.isStarting = false;

      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.swapTimeout) {
        clearTimeout(this.swapTimeout);
        this.swapTimeout = null;
      }

      const introEl = document.getElementById('heroIntro');
      if (introEl) introEl.classList.remove('is-shaking');

      this.heroSection?.classList.remove('mode-cinematic');
      this.navbar?.classList.remove('mode-cinematic');
      document.body?.classList.remove('mode-cinematic');
      this.auroraContainer?.classList.remove('is-active');
      this.playBtn?.classList.remove('is-hidden');
      if (this.statusBadge) this.statusBadge.textContent = 'Available';

      this.currentSubtitleIndex = -1;
      this.impactCues.forEach(c => { c.triggered = false; });
      this.impactState = { active: false, intensity: 0, progress: 0 };
      if (this.kineticWrapper) this.kineticWrapper.innerHTML = '';

      this.clock = 0;
      this.audioValues = { volume: 0, bass: 0, mid: 0 };

      if (this.audioEl) {
        try {
          this.audioEl.pause();
          this.audioEl.currentTime = 0;
        } catch (e) {}
      }
    }

    initEvents() {
      // Monitor source load errors safely without falsely marking missing before mobile interaction
      const audioSources = this.audioEl.querySelectorAll('source');
      let failedSources = 0;
      audioSources.forEach(source => {
        source.addEventListener('error', () => {
          failedSources++;
          if (failedSources >= audioSources.length && this.audioEl && this.audioEl.error) {
            this.audioMissing = true;
            console.warn('All audio sources failed to load.');
          }
        });
      });

      let lastTriggerTime = 0;
      const handleTrigger = (e) => {
        const now = Date.now();
        if (now - lastTriggerTime < 400) {
          if (e && e.cancelable) e.preventDefault();
          return;
        }
        lastTriggerTime = now;
        if (e && e.cancelable) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.startCinematicMode();
      };

      this.playBtn.addEventListener('click', handleTrigger);
      this.playBtn.addEventListener('touchend', handleTrigger, { passive: false });

      this.audioEl.addEventListener('timeupdate', () => this.handleTimeUpdate());
      this.audioEl.addEventListener('ended', () => this.stopCinematicMode());
      this.audioEl.addEventListener('pause', () => {
        if (this.isPlaying && this.audioEl && this.audioEl.currentTime < 12.5) {
          this.stopCinematicMode();
        }
      });
      this.audioEl.addEventListener('error', (e) => {
        console.warn('Audio element error event:', e);
        this.audioMissing = true;
        this.stopCinematicMode();
        this.showAudioMissingFeedback();
      });
    }
  }

  // App Initialization on DOM Ready (with immediate fallback if already ready)
  // App Initialization on DOM Ready with isolated safety boundaries
  const initApp = () => {
    // 0. Theme initialization
    let savedTheme = 'dark';
    try {
      savedTheme = safeStorage.get('theme', 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) {
      console.warn('Theme init notice:', e);
    }
    const isLightMode = savedTheme === 'light';

    // 1. Initialize LetterGlitch Background with 50% opacity & color matching
    let glitchInstance = null;
    try {
      const glitchCanvas = document.getElementById('glitchCanvas');
      if (glitchCanvas) {
        glitchInstance = new LetterGlitch(glitchCanvas, {
          glitchSpeed: 70,
          smooth: true,
          isLight: isLightMode
        });
      }
    } catch (e) {
      console.warn('LetterGlitch init notice:', e);
    }

    // 2. Initialize PullCord Ceiling Theme Switcher
    try {
      const pullcordEl = document.getElementById('pullcord');
      if (pullcordEl) {
        new PullCordComponent(pullcordEl, {
          pulled: isLightMode,
          onPull: (isPulled) => {
            const nextTheme = isPulled ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            safeStorage.set('theme', nextTheme);

            // Update LetterGlitch palette in real-time
            if (glitchInstance) {
              try {
                glitchInstance.setTheme(isPulled);
              } catch (_) {}
            }
          }
        });
      }
    } catch (e) {
      console.warn('PullCord init notice:', e);
    }

    // 3. Initialize ProfileCard 3D Tilt Component
    try {
      const profileCardEl = document.getElementById('profileCard');
      if (profileCardEl) {
        new ProfileCardComponent(profileCardEl, {
          enableTilt: true
        });
      }
    } catch (e) {
      console.warn('ProfileCard init notice:', e);
    }

    // 4. Initialize Cinematic Hero Controller (SoftAurora Audio-Reactive + Kinetic Text)
    try {
      new CinematicHeroController();
    } catch (e) {
      console.warn('CinematicHeroController init notice:', e);
    }

    // 5. Initialize ParallaxLayers on About Section
    try {
      const aboutParallaxEl = document.getElementById('aboutParallax');
      if (aboutParallaxEl) {
        new ParallaxLayers(aboutParallaxEl);
      }
    } catch (e) {
      console.warn('ParallaxLayers init notice:', e);
    }

    // 6. Initialize Magic UI Terminal Animation
    try {
      const terminalEl = document.getElementById('terminalWindow');
      if (terminalEl) {
        new TerminalAnimationController(terminalEl);
      }
    } catch (e) {
      console.warn('TerminalAnimationController init notice:', e);
    }

    // 7. Initialize Modern Interactive Stack Section
    try {
      new StackSectionController('#stackInteractiveContainer');
    } catch (e) {
      console.warn('StackSectionController init notice:', e);
    }

    // 8. Initialize Specular Effect across all Cards (React Bits SpecularButton adaptation)
    try {
      new SpecularCardController('.specular-card');
    } catch (e) {
      console.warn('SpecularCardController init notice:', e);
    }

    // 9. Initialize Smooth Scroll Deck Stacking for Featured Projects
    try {
      new ProjectStackScrollController();
    } catch (e) {
      console.warn('ProjectStackScrollController init notice:', e);
    }

    // 10. Initialize Interactive Physics Chips for Contact Section
    try {
      new ContactPhysicsChips('#physicsContainer');
    } catch (e) {
      console.warn('ContactPhysicsChips init notice:', e);
    }

    // 11. Update Footer Copyright Year Dynamically
    try {
      const footerYearEl = document.getElementById('footerYear');
      if (footerYearEl) {
        footerYearEl.textContent = new Date().getFullYear();
      }
    } catch (e) {
      console.warn('Footer year notice:', e);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();


