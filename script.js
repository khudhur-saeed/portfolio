/**
 * Main Application Script (High Performance Optimized)
 * 1. PullCord - Physics-driven Ceiling Pull-Cord Component (mortspace / FeralUI)
 * 2. LetterGlitch - Canvas Glitch Background (React Bits - Performance Optimized)
 * 3. ProfileCard - 3D Tilt Card with Holographic Sheen (React Bits - Idle Sleep Optimized)
 */

(function () {
  'use strict';

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

      // Cap DPR to 1.5 to prevent massive 4K texture overhead
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = parent.getBoundingClientRect();

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
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      this.dragging = true;
      this.didDrag = true;
      this.clicked = false;
      this.dragStartPos = { x: e.clientX, y: e.clientY };

      const onPointerMove = (evt) => {
        if (!this.dragging) return;
        const rx = evt.clientX - this.dragStartPos.x;
        const ry = REST_Y + (evt.clientY - this.dragStartPos.y);
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

      const onPointerUp = () => {
        this.dragging = false;
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
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        this.wake();
        requestAnimationFrame(() => {
          this.didDrag = false;
        });
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      this.wake();
    }

    onClick(e) {
      if (this.didDrag) return;
      if (e.detail === 0) return;
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
> Khedr mohammed — Full-Stack Web Developer & Software Engineer

khedr@dev:~$ cat about.txt
Computer Engineering graduate candidate with a dual focus on Cybersecurity/Network Analysis and Secure Backend Development. Proficient in vulnerability assessment, OWASP Top 10 mitigation, and network inspection using tools like Burp Suite, Nmap, and Metasploit. Experienced in designing scalable, secure backend systems and databases utilizing Python, FastAPI, PostgreSQL, Elasticsearch, and Docker, with a strong background in Zero-Knowledge architectures and authenticated cryptography (AES-256-GCM, Argon2id). Aimed at bridging analytical threat detection with secure-by-default software engineering.

khedr@dev:~$ echo $PASSION
> "Turning complex ideas into elegant, reliable digital experiences."`;

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

  // App Initialization on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isLightMode = savedTheme === 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 1. Initialize LetterGlitch Background with 50% opacity & color matching
    const glitchCanvas = document.getElementById('glitchCanvas');
    let glitchInstance = null;
    if (glitchCanvas) {
      glitchInstance = new LetterGlitch(glitchCanvas, {
        glitchSpeed: 70,
        smooth: true,
        isLight: isLightMode
      });
    }

    // 2. Initialize PullCord Ceiling Theme Switcher
    const pullcordEl = document.getElementById('pullcord');
    if (pullcordEl) {
      new PullCordComponent(pullcordEl, {
        pulled: isLightMode,
        onPull: (isPulled) => {
          const nextTheme = isPulled ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', nextTheme);
          localStorage.setItem('theme', nextTheme);

          // Update LetterGlitch palette in real-time
          if (glitchInstance) {
            glitchInstance.setTheme(isPulled);
          }
        }
      });
    }

    // 3. Initialize ProfileCard 3D Tilt Component
    const profileCardEl = document.getElementById('profileCard');
    if (profileCardEl) {
      new ProfileCardComponent(profileCardEl, {
        enableTilt: true
      });
    }

    // 4. Initialize ParallaxLayers on About Section
    const aboutParallaxEl = document.getElementById('aboutParallax');
    if (aboutParallaxEl) {
      new ParallaxLayers(aboutParallaxEl);
    }

    // 5. Initialize Magic UI Terminal Animation
    const terminalEl = document.getElementById('terminalWindow');
    if (terminalEl) {
      new TerminalAnimationController(terminalEl);
    }
  });
})();
