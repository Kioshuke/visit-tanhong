/* ==========================================================================
   Explore Tân Hồng — Main script
   Contents:
   1. Utilities
   2. Sticky navbar on scroll
   3. Mobile menu toggle
   4. Smooth scrolling + active link highlighting
   5. Scroll reveal animations (IntersectionObserver)
   6. Animated statistic counters
   7. Dark mode toggle (persisted)
   8. Back to top button
   9. Footer year
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Utilities
  ------------------------------------------------------------------ */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    initStickyHeader();
    initMobileMenu();
    initSmoothScroll();
    initActiveLinkOnScroll();
    initScrollReveal();
    initCounters();
    initThemeToggle();
    initBackToTop();
    initFooterYear();
  });

  /* ------------------------------------------------------------------
     2. Sticky navbar on scroll
     Adds a background/blur to the header once the page has scrolled
     past the hero threshold, with a small buffer to avoid flicker.
  ------------------------------------------------------------------ */
  function initStickyHeader() {
    const header = $('#siteHeader');
    if (!header) return;

    const THRESHOLD = 60;

    const updateHeader = () => {
      header.classList.toggle('is-scrolled', window.scrollY > THRESHOLD);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ------------------------------------------------------------------
     3. Mobile menu toggle
  ------------------------------------------------------------------ */
  function initMobileMenu() {
    const toggle = $('#menuToggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;

    const closeMenu = () => {
      toggle.classList.remove('is-active');
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Mở menu điều hướng');
    };

    const openMenu = () => {
      toggle.classList.add('is-active');
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Đóng menu điều hướng');
    };

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });

    // Close the menu whenever a link is chosen (mobile UX)
    $$('.nav-link', menu).forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape for keyboard users
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     4. Smooth scrolling + active link highlighting
     Native CSS `scroll-behavior: smooth` already handles motion; this
     adds an offset correction for the fixed header and keeps focus
     management accessible for keyboard users.
  ------------------------------------------------------------------ */
  function initSmoothScroll() {
    const header = $('#siteHeader');
    const headerOffset = () => (header ? header.offsetHeight : 0);

    $$('a[data-scroll], .nav-link').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const target = $(href);
        if (!target) return;

        event.preventDefault();

        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;

        window.scrollTo({
          top: targetPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });

        // Move focus for accessibility once the scroll settles
        window.setTimeout(() => {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }, prefersReducedMotion ? 0 : 500);
      });
    });
  }

  /* ------------------------------------------------------------------
     Active link highlighting while scrolling through sections
  ------------------------------------------------------------------ */
  function initActiveLinkOnScroll() {
    const navLinks = $$('.nav-link');
    if (!navLinks.length) return;

    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => {
            link.classList.toggle('active-link', link.getAttribute('href') === id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------
     5. Scroll reveal animations
     Elements with the `.reveal` class fade/slide into place the first
     time they enter the viewport. Skips entirely for users who prefer
     reduced motion.
  ------------------------------------------------------------------ */
  function initScrollReveal() {
    const revealItems = $$('.reveal');
    if (!revealItems.length) return;

    if (prefersReducedMotion) {
      revealItems.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    revealItems.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     6. Animated statistic counters
     Counts up from 0 to the data-target value once the stats section
     scrolls into view. Runs once per page load.
  ------------------------------------------------------------------ */
  function initCounters() {
    const counters = $$('.stat-number');
    if (!counters.length) return;

    const animateCounter = (el) => {
      const target = Number(el.dataset.target || 0);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;

      if (prefersReducedMotion) {
        el.textContent = target + suffix;
        return;
      }

      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        // Ease-out cubic for a natural deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        el.textContent = value + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target + suffix;
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  /* ------------------------------------------------------------------
     7. Dark mode toggle (persisted via localStorage)
  ------------------------------------------------------------------ */
  function initThemeToggle() {
    const toggle = $('#themeToggle');
    const root = document.documentElement;
    if (!toggle) return;

    const STORAGE_KEY = 'explore-tan-hong-theme';

    const applyTheme = (theme) => {
      root.setAttribute('data-theme', theme);
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    };

    // Respect saved preference, otherwise fall back to system preference
    const saved = localStorage.getItem(STORAGE_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (systemPrefersDark ? 'dark' : 'light'));

    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  /* ------------------------------------------------------------------
     8. Back to top button
  ------------------------------------------------------------------ */
  function initBackToTop() {
    const button = $('#backToTop');
    if (!button) return;

    const toggleVisibility = () => {
      button.classList.toggle('is-visible', window.scrollY > 480);
    };

    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------
     9. Footer year
  ------------------------------------------------------------------ */
  function initFooterYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
})();
