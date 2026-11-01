/**
 * Domain Color Plan — Interactive Scripts
 * Structure: index.html | Design: style.css | Interactions: script.js
 */

document.addEventListener('DOMContentLoaded', () => {
  initWavyHeading();
  initTabs();
  initStackedDeck();
  initCopyButtons();
  initEmotionNotes();
});

/**
 * 1. TAB BUTTON SWITCHING LOGIC
 * Supports [🎨 Colors], [★ Features], [🖼 Examples] for each domain card
 */
function initTabs() {
  const allCards = document.querySelectorAll('.domain-card');

  allCards.forEach(card => {
    const tabButtons = card.querySelectorAll('.tab-btn');
    const colorsView = card.querySelector('.card-view-colors');
    const featuresView = card.querySelector('.card-view-features');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetTab = btn.getAttribute('data-tab');

        // Switch active state on buttons
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (targetTab === 'colors') {
          if (colorsView) colorsView.classList.add('active');
          if (featuresView) featuresView.classList.remove('active');
        } else if (targetTab === 'features') {
          if (colorsView) colorsView.classList.remove('active');
          if (featuresView) featuresView.classList.add('active');
        }
      });
    });
  });
}

/**
 * 2. COPY HEX COLOR WITH FLOATING TOAST
 */
function initCopyButtons() {
  const swatches = document.querySelectorAll('.swatch-item, .color-dot-wrap');

  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const hex = swatch.getAttribute('data-hex') || swatch.innerText.trim();
      const name = swatch.getAttribute('data-name') || 'Color';
      copyHex(hex, name);
    });
  });
}

function copyHex(hex, name) {
  if (!hex) return;

  // Clean hex if needed
  const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;

  navigator.clipboard.writeText(cleanHex).then(() => {
    showToast(`Copied ${cleanHex} (${name}) to clipboard!`);
  }).catch(() => {
    // Fallback for older browsers
    const tempInput = document.createElement('input');
    tempInput.value = cleanHex;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast(`Copied ${cleanHex} (${name}) to clipboard!`);
  });
}

function showToast(message) {
  let toast = document.getElementById('copyToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'copyToast';
    toast.className = 'copy-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span style="color:#10b981; font-weight:800;">✓</span> <span>${message}</span>`;
  toast.classList.add('show');

  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }

  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

/**
 * 3. SMOOTH KINETIC LERP ENGINE & 3D STACKED DECK CONTROLLER
 * Interpolates scroll motion using exponential momentum damping (Lerp)
 * for liquid-smooth 60/120fps card transitions without stutters or layout thrashing.
 */
function initStackedDeck() {
  const track = document.getElementById('domain-topics');
  const cards = Array.from(document.querySelectorAll('.domain-card'));
  const chips = Array.from(document.querySelectorAll('.quick-jump-chips .chip-btn'));
  const hero = document.getElementById('hero');

  if (!track || cards.length === 0) return;

  const totalCards = cards.length;

  // 1. Cache illustration elements to avoid DOM queries in the animation loop
  const illustrations = cards.map(c => c.querySelector('.illustration-img'));

  // 2. Cache Hero DOM elements
  const heroContainer = hero ? hero.querySelector('.hero-container') : null;
  const wheelWrapper = hero ? hero.querySelector('.color-wheel-wrapper') : null;
  const artLeft = hero ? hero.querySelector('.float-left') : null;
  const artRight = hero ? hero.querySelector('.float-right') : null;

  // 3. Pre-calculate track geometry (re-calculated only on resize, NEVER during scrolling!)
  let heroHeight = window.innerHeight;
  let trackScrollDistance = 1;
  let trackTopOffset = heroHeight;

  function recalculateMetrics() {
    heroHeight = hero ? hero.offsetHeight : window.innerHeight;
    const trackHeight = track.offsetHeight;
    const windowH = window.innerHeight;
    trackScrollDistance = Math.max(1, trackHeight - windowH);

    // Calculate accurate absolute document top offset for track
    const trackRect = track.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    trackTopOffset = trackRect.top + scrollTop;
  }

  recalculateMetrics();
  window.addEventListener('resize', recalculateMetrics, { passive: true });

  // 4. Kinetic Lerp State for liquid momentum
  let targetScrollY = window.pageYOffset || document.documentElement.scrollTop;
  let currentScrollY = targetScrollY;
  let isTicking = false;

  function onScroll() {
    targetScrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(animationLoop);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Main 60/120fps animation loop
  function animationLoop() {
    const delta = targetScrollY - currentScrollY;

    // Smooth momentum damping factor (0.14 provides effortless liquid gliding)
    if (Math.abs(delta) > 0.25) {
      currentScrollY += delta * 0.14;
    } else {
      currentScrollY = targetScrollY;
    }

    renderHero(currentScrollY);
    renderCards(currentScrollY);

    if (Math.abs(targetScrollY - currentScrollY) > 0.25) {
      requestAnimationFrame(animationLoop);
    } else {
      isTicking = false;
    }
  }

  // Render Hero Zoom & Expansion Parallax
  function renderHero(scrollY) {
    if (!hero) return;
    const progress = Math.max(0, Math.min(1.15, scrollY / heroHeight));

    if (heroContainer) {
      const scale = 1 + progress * 0.45;
      const translateY = -progress * 85;
      const opacity = Math.max(0, 1 - Math.pow(progress, 1.4));
      const blur = (progress * 7).toFixed(1);

      heroContainer.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      heroContainer.style.opacity = opacity.toFixed(3);
      heroContainer.style.filter = `blur(${blur}px)`;
      heroContainer.style.pointerEvents = progress > 0.35 ? 'none' : 'auto';
    }

    if (wheelWrapper) {
      const wheelScale = 1 + progress * 1.5;
      const wheelOpacity = Math.max(0, 0.45 * (1 - progress * 0.85));
      wheelWrapper.style.transform = `translate(-50%, -50%) scale(${wheelScale.toFixed(3)})`;
      wheelWrapper.style.opacity = wheelOpacity.toFixed(3);
    }

    if (artLeft) {
      const shiftX = -progress * 150;
      const scale = 1 + progress * 0.4;
      const opacity = Math.max(0, 1 - progress * 1.3);
      artLeft.style.transform = `translate3d(${shiftX.toFixed(1)}px, -50%, 0) scale(${scale.toFixed(3)})`;
      artLeft.style.opacity = opacity.toFixed(3);
    }

    if (artRight) {
      const shiftX = progress * 150;
      const scale = 1 + progress * 0.4;
      const opacity = Math.max(0, 1 - progress * 1.3);
      artRight.style.transform = `translate3d(${shiftX.toFixed(1)}px, -50%, 0) scale(${scale.toFixed(3)})`;
      artRight.style.opacity = opacity.toFixed(3);
    }
  }

  // Render 3D Cards Deck Stacking Parallax
  let lastActiveIdx = -1;

  function renderCards(scrollY) {
    // Progress through the sticky section [0.0 to 1.0]
    const rawProgress = (scrollY - trackTopOffset) / trackScrollDistance;
    const progress = Math.max(0, Math.min(1, rawProgress));

    // Progress in card index space: [0, totalCards - 1]
    const p = progress * (totalCards - 1);
    const activeIndex = Math.min(totalCards - 1, Math.floor(p));
    const activeFraction = p - activeIndex;

    // Highlight Quick Jump Chip in Hero
    if (activeIndex !== lastActiveIdx) {
      const domainChips = chips.filter(c => c.hasAttribute('data-domain'));
      domainChips.forEach((chip, i) => {
        if (i === activeIndex) {
          chip.classList.add('chip-active');
        } else {
          chip.classList.remove('chip-active');
        }
      });
      lastActiveIdx = activeIndex;
    }

    // Apply transforms to all 12 cards with natural sine easing
    for (let i = 0; i < totalCards; i++) {
      const card = cards[i];
      const ill = illustrations[i];

      if (i < activeIndex) {
        // 1. Cards that have exited above viewport
        card.style.transform = 'translate3d(0, -125vh, 0) rotateX(10deg) scale(0.95)';
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
        card.style.zIndex = totalCards - i;
      } else if (i === activeIndex) {
        // 2. Active front card: smoothly peels up and away with natural sine curve
        const t = activeFraction;
        const easeT = Math.sin((t * Math.PI) / 2);
        const translateY = -easeT * 115;
        const rotateX = easeT * 5.5;
        const rotateZ = -easeT * 2.2;
        const scale = 1 - easeT * 0.035;

        card.style.visibility = 'visible';
        card.style.transform = `translate3d(0, ${translateY.toFixed(2)}%, 0) rotateX(${rotateX.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = '1';
        card.style.pointerEvents = t > 0.4 ? 'none' : 'auto';
        card.style.zIndex = 30;

        if (ill) {
          ill.style.transform = `translateY(${(-easeT * 18).toFixed(1)}px)`;
        }
      } else {
        // 3. Cards waiting in the stack underneath (Layered Depth)
        const depth = i - p;
        card.style.visibility = 'visible';

        if (depth <= 3.2) {
          const boundedDepth = Math.min(3, depth);
          // Visual physical deck offset: cards stack neatly beneath with soft scale and depth
          const translateY = boundedDepth * 14;     // 14px, 28px, 42px
          const translateZ = -boundedDepth * 35;    // 3D depth step
          const scale = 1 - boundedDepth * 0.038;   // 0.962, 0.924, 0.886

          card.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) scale(${scale.toFixed(3)})`;
          card.style.opacity = '1';
          card.style.pointerEvents = 'none';
          card.style.zIndex = totalCards - i;
        } else {
          // Deep in stack (hidden to preserve GPU performance)
          card.style.transform = 'translate3d(0, 48px, -110px) scale(0.88)';
          card.style.opacity = '0';
          card.style.visibility = 'hidden';
          card.style.pointerEvents = 'none';
          card.style.zIndex = 1;
        }

        if (ill) {
          ill.style.transform = 'translateY(0)';
        }
      }
    }
  }

  // Smooth scroll jump helper
  function scrollToCard(index) {
    const targetIdx = Math.max(0, Math.min(totalCards - 1, index));
    const targetScroll = trackTopOffset + (targetIdx / (totalCards - 1)) * trackScrollDistance;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }

  // Quick navigation chips in hero
  chips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const href = chip.getAttribute('href');
      if (href === '#color-theory') {
        e.preventDefault();
        const theorySec = document.getElementById('color-theory');
        if (theorySec) {
          const theoryTop = theorySec.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
          window.scrollTo({
            top: theoryTop,
            behavior: 'smooth'
          });
        }
        return;
      }
      if (href === '#color-emotions') {
        e.preventDefault();
        const emotionsSec = document.getElementById('color-emotions');
        if (emotionsSec) {
          const emotionsTop = emotionsSec.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
          window.scrollTo({
            top: emotionsTop,
            behavior: 'smooth'
          });
        }
        return;
      }

      const domainAttr = chip.getAttribute('data-domain');
      if (domainAttr) {
        e.preventDefault();
        const domainIdx = parseInt(domainAttr, 10) - 1;
        scrollToCard(domainIdx);
      }
    });
  });

  // Initial draw
  renderHero(currentScrollY);
  renderCards(currentScrollY);
}

// Global hook for onclick attributes if any
window.copyHex = copyHex;

/**
 * 4. COLORFUL WAVING HEADING INITIALIZER
 * Breaks "Domain & Color Themes" into individual characters,
 * assigning spectrum colors and staggered delays so they appear one by one and wave.
 */
function initWavyHeading() {
  const heading = document.getElementById('heroWavyTitle');
  if (!heading) return;

  const rawText = "Domain & Color Themes";
  // Full 360-degree color wheel spectrum tuned for high contrast on white background
  const spectrumColors = [
    { color: '#E11D48', glow: 'rgba(225, 29, 72, 0.25)' },   // D
    { color: '#EA580C', glow: 'rgba(234, 88, 12, 0.25)' },   // o
    { color: '#D97706', glow: 'rgba(217, 119, 6, 0.25)' },   // m
    { color: '#B45309', glow: 'rgba(180, 83, 9, 0.25)' },    // a
    { color: '#059669', glow: 'rgba(5, 150, 105, 0.25)' },   // i
    { color: '#0D9488', glow: 'rgba(13, 148, 136, 0.25)' },  // n
    { color: '#0284C7', glow: 'rgba(2, 132, 199, 0.25)' },   // &
    { color: '#2563EB', glow: 'rgba(37, 99, 235, 0.25)' },   // C
    { color: '#4F46E5', glow: 'rgba(79, 70, 229, 0.25)' },   // o
    { color: '#7C3AED', glow: 'rgba(124, 58, 237, 0.25)' },  // l
    { color: '#9333EA', glow: 'rgba(147, 51, 234, 0.25)' },  // o
    { color: '#C026D3', glow: 'rgba(192, 38, 211, 0.25)' },  // r
    { color: '#DB2777', glow: 'rgba(219, 39, 119, 0.25)' },  // T
    { color: '#E11D48', glow: 'rgba(225, 29, 72, 0.25)' },   // h
    { color: '#EA580C', glow: 'rgba(234, 88, 12, 0.25)' },   // e
    { color: '#D97706', glow: 'rgba(217, 119, 6, 0.25)' },   // m
    { color: '#16A34A', glow: 'rgba(22, 163, 74, 0.25)' },   // e
    { color: '#2563EB', glow: 'rgba(37, 99, 235, 0.25)' }    // s
  ];

  const words = rawText.split(' ');
  heading.innerHTML = '';
  let globalCharIdx = 0;

  words.forEach((word, wIdx) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'wavy-word';

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const charSpan = document.createElement('span');
      charSpan.className = 'wave-char';
      charSpan.textContent = char;

      const palette = spectrumColors[globalCharIdx % spectrumColors.length];
      charSpan.style.setProperty('--char-idx', globalCharIdx);
      charSpan.style.setProperty('--char-color', palette.color);
      charSpan.style.setProperty('--char-glow', palette.glow);

      wordSpan.appendChild(charSpan);
      globalCharIdx++;
    }

    heading.appendChild(wordSpan);

    if (wIdx < words.length - 1) {
      const space = document.createTextNode(' ');
      heading.appendChild(space);
    }
  });
}

/**
 * 5. COLOR EMOTIONS IN UX INTERACTIONS
 * Copies HEX code from emotion note cards and handles smooth CTA jumping.
 */
function initEmotionNotes() {
  const cards = document.querySelectorAll('.sticky-note-card, .emotion-note-card');

  cards.forEach(card => {
    const hex = card.getAttribute('data-hex');
    const color = card.getAttribute('data-color') || 'Color';

    const hexBtn = card.querySelector('.note-hex-btn');
    if (hexBtn) {
      hexBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyHex(hex, color);
      });
    }

    card.addEventListener('click', () => {
      copyHex(hex, color);
    });
  });
}



