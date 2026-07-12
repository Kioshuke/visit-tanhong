/* ==========================================================================
   Explore Tân Hồng — Main script
   Contents:
   0. Header/Footer partial loader (dùng chung cho mọi trang)
   1. Utilities
   2. Sticky header
   3. Mobile menu toggle
   4. Theme toggle (persisted)
   5. Smooth scrolling + active link highlighting
   6. Scroll reveal animations (IntersectionObserver)
   7. Animated statistic counters
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
    loadPartials().finally(() => {
      initStickyHeader();
      initMobileMenu();
      initThemeToggle();
      initSmoothScroll();
      initActiveLinkOnScroll();
      initScrollReveal();
      initSpiritualSlider();
      initLightbox();
      initCounters();
      initBackToTop();
      initFooterYear();
    });
  });

  /* ------------------------------------------------------------------
     0. Header/Footer partial loader
     Mọi trang chỉ cần khai báo:
       <div data-include="header.html"></div>
       <div data-include="footer.html"></div>
     Script sẽ tự tải nội dung header.html / footer.html và chèn vào
     đúng vị trí đó — không cần copy lại code header/footer khi tạo
     trang mới. Các init bên dưới đều chạy SAU khi partial đã được
     chèn xong, để đảm bảo các phần tử như #siteHeader, #themeToggle,
     #backToTop... đã tồn tại trong DOM.
  ------------------------------------------------------------------ */
  function loadPartials() {
    const includeNodes = $$('[data-include]');
    if (!includeNodes.length) return Promise.resolve();

    const requests = includeNodes.map((node) => {
      const file = node.getAttribute('data-include');
      const cacheBust = '?v=' + Date.now();
      return fetch(file + cacheBust)
        .then((res) => {
          if (!res.ok) throw new Error(`Không thể tải ${file} (HTTP ${res.status})`);
          return res.text();
        })
        .then((html) => {
          node.outerHTML = html;
        })
        .catch((err) => {
          // Nếu đang mở file trực tiếp bằng file:// (không qua server),
          // trình duyệt sẽ chặn fetch() vì lý do CORS. Header/footer sẽ
          // hiện trống — hãy chạy site qua một local server (vd: VS Code
          // "Live Server", hoặc `python3 -m http.server`) để fetch hoạt động.
          console.error(err);
        });
    });

    return Promise.all(requests);
  }

  /* ------------------------------------------------------------------
     2. Sticky header
  ------------------------------------------------------------------ */
  function initStickyHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var THRESHOLD = 60;
    var update = function () { header.classList.toggle('is-scrolled', window.scrollY > THRESHOLD); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ------------------------------------------------------------------
     3. Mobile menu toggle
  ------------------------------------------------------------------ */
  function initMobileMenu() {
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    function closeMenu() {
      toggle.classList.remove('is-active');
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Mở menu điều hướng');
    }
    function openMenu() {
      toggle.classList.add('is-active');
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Đóng menu điều hướng');
    }

    toggle.addEventListener('click', function () {
      menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    var links = menu.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     4. Theme toggle (persisted)
  ------------------------------------------------------------------ */
  function initThemeToggle() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    var root = document.documentElement;
    var KEY = 'explore-tan-hong-theme';

    function applyTheme(t) {
      root.setAttribute('data-theme', t);
      toggle.setAttribute('aria-pressed', String(t === 'dark'));
    }

    applyTheme(localStorage.getItem(KEY) || 'light');

    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(KEY, next);
    });
  }

  /* ------------------------------------------------------------------
     5. Smooth scrolling + active link highlighting
     Native CSS `scroll-behavior: smooth` already handles motion; this
     adds an offset correction for the fixed header and keeps focus
     management accessible for keyboard users.
  ------------------------------------------------------------------ */
  function initSmoothScroll() {
    const header = $('#siteHeader');
    const headerOffset = () => (header ? header.offsetHeight : 0);
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    $$('a[data-scroll], .nav-link').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href.indexOf('#') === -1) return;

        // Hỗ trợ cả href="#id" (cùng trang) và href="page.html#id"
        // (dùng chung trong header/footer cho mọi trang). Nếu phần
        // "page.html" khác trang hiện tại, để trình duyệt điều hướng
        // bình thường sang trang đó rồi tự cuộn tới id.
        const [page, id] = href.split('#');
        const linkedPage = page || currentPage;
        if (linkedPage !== currentPage) return;

        const target = document.getElementById(id);
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

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const linkTargets = navLinks
      .map((link) => {
        const href = link.getAttribute('href') || '';
        const [page, id] = href.split('#');
        if (!id || (page && page !== currentPage)) return null;
        const section = document.getElementById(id);
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    if (!linkTargets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.classList.remove('active-link'));
          linkTargets
            .filter((item) => item.section === entry.target)
            .forEach((item) => item.link.classList.add('active-link'));
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    linkTargets.forEach(({ section }) => observer.observe(section));
  }

  /* ------------------------------------------------------------------
     3. Scroll reveal animations
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
     Spiritual section slider (3-up carousel)
  ------------------------------------------------------------------ */
  function initSpiritualSlider() {
    const slider = document.querySelector('.spiritual-slider');
    if (!slider) return;

    const viewport = slider.querySelector('.slider-viewport');
    const track = slider.querySelector('.slider-track');
    const slides = Array.from(track.querySelectorAll('.card'));
    const prev = slider.querySelector('.slider-btn.prev');
    const next = slider.querySelector('.slider-btn.next');
    if (!viewport || !track || !slides.length || !prev || !next) return;

    const gap = parseInt(getComputedStyle(track).gap) || 28;
    let index = 0;
    let lastDirection = 'right';

    function getVisibleCount() {
      const w = viewport.offsetWidth;
      if (w < 600) return 1;
      if (w < 900) return 2;
      return 3;
    }

    function update() {
      const visible = getVisibleCount();
      const slideWidth = slides[0].offsetWidth;
      const step = Math.round(slideWidth + gap);
      const maxIndex = Math.max(0, slides.length - visible);
      index = Math.min(Math.max(0, index), maxIndex);
      const translateX = -(index * step);
      track.style.transform = `translateX(${translateX}px)`;
      prev.disabled = index === 0;
      next.disabled = index === maxIndex;
      // manage slide-in direction classes for visible slides
      const start = index;
      const end = index + visible - 1;
      slides.forEach((sl, i) => {
        if (i >= start && i <= end) {
          sl.classList.remove('slide-from-left', 'slide-from-right');
          sl.classList.add(lastDirection === 'right' ? 'slide-from-right' : 'slide-from-left');
          // force reflow before adding visible so transition runs
          void sl.offsetWidth;
          sl.classList.add('is-visible');
        } else {
          sl.classList.remove('is-visible');
          sl.classList.remove('slide-from-left', 'slide-from-right');
        }
      });
    }

    next.addEventListener('click', () => { lastDirection = 'right'; index += 1; update(); });
    prev.addEventListener('click', () => { lastDirection = 'left'; index -= 1; update(); });

    window.addEventListener('resize', () => { requestAnimationFrame(update); });
    window.addEventListener('load', update);
    setTimeout(update, 60);
  }

  /* ------------------------------------------------------------------
     5b. Lightbox for gallery images
  ------------------------------------------------------------------ */
  function initLightbox() {
    const overlay = $('#lightbox');
    const img = $('#lightboxImg');
    const caption = $('#lightboxCaption');
    const closeBtn = $('#lightboxClose');
    if (!overlay || !img) return;

    const items = $$('.gallery-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const imgEl = item.querySelector('img');
        if (!imgEl) return;
        img.src = imgEl.src;
        img.alt = imgEl.alt;
        caption.textContent = imgEl.alt;
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeLightbox();
    });
  }

  /* ------------------------------------------------------------------
     4. Animated statistic counters
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
     5. Back to top button
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
     6. Footer year
  ------------------------------------------------------------------ */
  function initFooterYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
})();