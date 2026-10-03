/**
 * Scroll Effects — Lenis Smooth Scroll + GSAP ScrollTrigger
 *
 * Designed with Progressive Enhancement:
 * - Elements are 100% visible by default in HTML/CSS (no hidden/blank components).
 * - GSAP dynamically applies entrance and scroll-trigger effects when ready.
 * - Works offline and locally with downloaded assets.
 * - Safe onDOMReady handler handles execution whether DOM is loading or already ready.
 */

(function () {
  'use strict';

  function onDOMReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onDOMReady(function () {
    /* Check reduced-motion preference & device pointer */
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    /* -----------------------------------------------------------------------
       1. Lenis Smooth Scrolling Init (Desktop Mouse Wheel Only; Native on Touch)
    ----------------------------------------------------------------------- */
    var lenis = null;

    if (!prefersReducedMotion && !isTouchDevice && typeof Lenis !== 'undefined') {
      try {
        lenis = new Lenis({
          duration: 1.2,
          easing: function (t) {
            return Math.min(1, 1.001 - Math.pow(2, -10 * t));
          },
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.5,
        });

        window.lenisInstance = lenis;

        if (typeof gsap !== 'undefined') {
          gsap.ticker.add(function (time) {
            lenis.raf(time * 1000);
          });
          gsap.ticker.lagSmoothing(0);
        } else {
          var stepRaf = function (time) {
            lenis.raf(time);
            requestAnimationFrame(stepRaf);
          };
          requestAnimationFrame(stepRaf);
        }

        if (typeof ScrollTrigger !== 'undefined') {
          lenis.on('scroll', ScrollTrigger.update);
        }
      } catch (e) {
        console.warn('[scroll-effects] Lenis initialization notice:', e);
      }
    }

    /* -----------------------------------------------------------------------
       2. Scroll Progress Bar
    ----------------------------------------------------------------------- */
    var progressBar = document.getElementById('scrollProgressBar');
    if (progressBar) {
      if (lenis) {
        lenis.on('scroll', function (e) {
          progressBar.style.width = (e.progress * 100) + '%';
        });
      } else {
        var updateProgress = function () {
          var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
          var scrollHeight = (document.documentElement.scrollHeight - window.innerHeight) || 1;
          var pct = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
          progressBar.style.width = pct + '%';
        };
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
      }
    }

    /* -----------------------------------------------------------------------
       3. Smooth Anchor Links via Lenis
    ----------------------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;

        if (lenis) {
          e.preventDefault();
          lenis.scrollTo(target, {
            offset: -64,
            duration: 1.2,
            easing: function (t) {
              return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            },
          });
        } else {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    /* -----------------------------------------------------------------------
       4. GSAP & ScrollTrigger Animations (Progressive Enhancement)
    ----------------------------------------------------------------------- */
    if (typeof gsap === 'undefined' || prefersReducedMotion) {
      return;
    }

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Hero entrance animation (animates in from slight offset)
    var heroCard = document.querySelector('[data-gsap-hero]');
    if (heroCard) {
      gsap.from(heroCard, {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power2.out',
        delay: 0.1,
        clearProps: 'all',
      });
    }

    // Scroll-revealed sections
    if (typeof ScrollTrigger !== 'undefined') {
      document.querySelectorAll('[data-gsap-reveal]').forEach(function (el) {
        var dir = el.getAttribute('data-gsap-reveal') || '';
        var fromVars = {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        };

        if (dir === 'left') {
          fromVars.x = -40;
        } else if (dir === 'right') {
          fromVars.x = 40;
        } else {
          fromVars.y = 35;
        }

        gsap.from(el, fromVars);
      });

      // Hero glitch background parallax
      var glitchBg = document.getElementById('glitchBg');
      if (glitchBg) {
        gsap.to(glitchBg, {
          yPercent: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }

      // Refresh ScrollTrigger to calculate accurate positions
      ScrollTrigger.refresh();
    }
  });
})();
