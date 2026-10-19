/* Sobhan Lotfi · subtle progressive enhancement. No dependencies. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionEnabled = !reduceMotion.matches;

  // 1. Type the name without changing the h1's intrinsic dimensions.
  const heading = document.querySelector('.masthead .id h1');
  if (heading && motionEnabled) {
    const fullName = heading.textContent.trim();
    const original = document.createElement('span');
    original.className = 'typing-source';
    original.textContent = fullName;

    const overlay = document.createElement('span');
    overlay.className = 'typing-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    const letters = document.createElement('span');
    const caret = document.createElement('span');
    caret.className = 'typing-caret';
    overlay.append(letters, caret);
    heading.replaceChildren(original, overlay);
    heading.classList.add('typing-name');

    const characters = Array.from(fullName);
    let index = 0;
    let timer = 0;
    let endTimer = 0;
    const finish = () => {
      clearTimeout(timer);
      clearTimeout(endTimer);
      heading.textContent = fullName;
      heading.classList.remove('typing-name');
    };
    const typeNext = () => {
      if (reduceMotion.matches) return finish();
      index += 1;
      letters.textContent = characters.slice(0, index).join('');
      if (index < characters.length) {
        timer = window.setTimeout(typeNext, characters[index - 1] === ' ' ? 240 : (index === 1 ? 140 : 130));
      } else {
        endTimer = window.setTimeout(finish, 650);
      }
    };
    timer = window.setTimeout(typeNext, 330);
    reduceMotion.addEventListener('change', (e) => { if (e.matches) finish(); }, {once:true});
  }

  // 2. Pointer-sensitive portrait tilt (mouse/trackpad only).
  const portrait = document.querySelector('.portrait');
  if (portrait && motionEnabled && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    portrait.addEventListener('pointermove', (event) => {
      const r = portrait.getBoundingClientRect();
      const x = ((event.clientX - r.left) / r.width - .5) * 2;
      const y = ((event.clientY - r.top) / r.height - .5) * 2;
      portrait.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`);
      portrait.style.setProperty('--tilt-y', `${(x * 3).toFixed(2)}deg`);
    });
    portrait.addEventListener('pointerleave', () => {
      portrait.style.removeProperty('--tilt-x');
      portrait.style.removeProperty('--tilt-y');
    });
  }


  // Editorial navigation: active links update while scrolling.
  const indexNav = document.querySelector('.section-index');
  if (indexNav) {
    const targets = [...indexNav.querySelectorAll('a[data-section]')];
    const linkedSections = targets.map(a => document.getElementById(a.dataset.section));
    let ticking = false;
    const setActive = () => {
      const threshold = Math.min(window.innerHeight * .36, 270);
      let current = -1;
      linkedSections.forEach((section,i) => {
        if (section && section.getBoundingClientRect().top <= threshold) current = i;
      });
      targets.forEach((a,i) => {
        const active = i === current;
        a.classList.toggle('is-active',active);
        if (active) a.setAttribute('aria-current','location');
        else a.removeAttribute('aria-current');
      });
      indexNav.style.setProperty('--index-progress', `${Math.max(0,(current+1)/targets.length)*100}%`);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(setActive); }
    }, {passive:true});
    window.addEventListener('resize',setActive,{passive:true});
    setActive();
  }

  // A subtle active-state marker for the reading gallery.
  const shelfLinks = [...document.querySelectorAll('.shelf-book')];
  if (shelfLinks.length && 'IntersectionObserver' in window) {
    const shelfObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        shelfLinks.forEach(link => {
          const on = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-current',on);
          if (on) link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      });
    },{rootMargin:'-15% 0px -55% 0px',threshold:0});
    document.querySelectorAll('article.book[id]').forEach(book=>shelfObserver.observe(book));
  }

  // 3, 6, 9. Reveal what is in view, once; preserve source ordering.
  if (!motionEnabled || !('IntersectionObserver' in window)) return;
  const sections = [...document.querySelectorAll('main section')];
  const revealItems = [...document.querySelectorAll('.pub, .job, .ledger li, .plain li, .book')];
  revealItems.forEach((item) => {
    item.classList.add('reveal-item');
    // Stagger just within the same section, not down the entire document.
    const localIndex = [...item.parentElement.children].filter((child) => child.matches('.pub, .job, li, .book')).indexOf(item);
    item.style.setProperty('--reveal-delay', `${Math.min(Math.max(localIndex, 0), 4) * 65}ms`);
  });
  document.documentElement.classList.add('motion-ready');

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      if (element.matches('section')) element.classList.add('section-visible');
      else element.classList.add('is-revealed');
      observer.unobserve(element);
    }
  }, {threshold:0.06,rootMargin:'0px 0px 38px 0px'});
  [...sections, ...revealItems].forEach((element) => observer.observe(element));

  // If the visitor changes OS accessibility preferences while the
  // page is open, reveal everything and end the animations.
  reduceMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    sections.forEach((el) => el.classList.add('section-visible'));
    revealItems.forEach((el) => el.classList.add('is-revealed'));
  });
})();
