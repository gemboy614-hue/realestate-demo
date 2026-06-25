/* ═══════════════════════════════════════════
   ЗАРЕЧЬЕ — motion engine (мультистраничный)
   GSAP · ScrollTrigger · Lenis · SplitType
   ═══════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const isTouch = window.matchMedia('(max-width:900px)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from((c || document).querySelectorAll(s));

/* ─── Плавный скролл (Lenis) ────────────── */
let lenis;
if (!reduce) {
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, touchMultiplier: 1.6 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: 0, duration: 1.4 }); }
    });
  });
}

/* ─── Переход между страницами (шторка) ──── */
(function pageTransition() {
  const curtain = $('.page-curtain');
  if (!curtain) return;
  const lift = () => { gsap.to(curtain, { yPercent: -100, duration: .9, ease: 'power4.inOut', onComplete: () => curtain.classList.add('is-open') }); };
  if (reduce) { curtain.classList.add('is-open'); }
  else {
    // если шторка закрывает (под-страница) — поднимаем; на главной она уже открыта
    if (!curtain.classList.contains('is-open')) requestAnimationFrame(lift);
    setTimeout(() => curtain.classList.add('is-open'), 1600); // страховка
    window.addEventListener('pageshow', e => { if (e.persisted) { curtain.classList.add('is-open'); gsap.set(curtain, { yPercent: -100 }); } });
  }
  // перехват внутренних ссылок
  $$('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;
    if (!/\.html(\?|#|$)/.test(href)) return;
    a.addEventListener('click', e => {
      e.preventDefault();
      if (reduce) { location.href = href; return; }
      curtain.classList.remove('is-open');
      gsap.fromTo(curtain, { yPercent: -100 }, { yPercent: 0, duration: .6, ease: 'power3.inOut', onComplete: () => { location.href = href; } });
    });
  });
})();

/* ─── Кастомный курсор ──────────────────── */
if (!isTouch) {
  const cur = $('#cursor'), dot = $('#cursorDot'), label = $('#cursorLabel');
  if (cur && dot) {
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; gsap.set(dot, { x: mx, y: my }); });
    gsap.ticker.add(() => { cx += (mx - cx) * 0.16; cy += (my - cy) * 0.16; gsap.set(cur, { x: cx, y: cy }); });
    const bindHover = () => {
      $$('[data-cursor]').forEach(el => {
        if (el.__c) return; el.__c = 1;
        el.addEventListener('mouseenter', () => cur.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => cur.classList.remove('is-hover', 'is-label'));
      });
      $$('[data-cursor-label]').forEach(el => {
        if (el.__cl) return; el.__cl = 1;
        el.addEventListener('mouseenter', () => { if (label) label.textContent = el.dataset.cursorLabel || 'смотреть'; cur.classList.add('is-label'); });
        el.addEventListener('mouseleave', () => cur.classList.remove('is-label'));
      });
    };
    bindHover();
    window.__bindHover = bindHover;
  }
}

/* ─── Магнитные элементы ────────────────── */
function magnetic(el, strength = 0.35) {
  if (isTouch) return;
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength, duration: .6, ease: 'power3.out' });
  });
  el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' }));
}
$$('.hero__arrow,.nav__cta,.submit,[data-magnetic]').forEach(el => magnetic(el));

/* ═══ ГЛАВНАЯ: прелоадер + герой ═══════════ */
let heroRevealed = false;
function heroIn() {
  if (heroRevealed || !$('.hero__title')) return; heroRevealed = true;
  gsap.timeline()
    .to('.hero__title [data-hero-word]', { y: 0, duration: 1.1, ease: 'power4.out', stagger: .08 })
    .fromTo('.hero__eyebrow', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power3.out' }, '-=.9')
    .fromTo('.hero__foot', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=.7')
    .fromTo('.nav', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power3.out' }, '-=.8');
}
let introStarted = false;
function intro() {
  if (introStarted || !$('#loader')) return; introStarted = true;
  const numEl = $('#loaderNum'), bar = $('#loaderBar');
  gsap.timeline({ onComplete: () => gsap.set('#loader', { display: 'none' }) })
    .to('.loader__word', { y: 0, duration: 1.1, ease: 'power4.out', delay: .15 })
    .to(bar, { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, '<')
    .to({ v: 0 }, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: function () { numEl.textContent = Math.round(this.targets()[0].v); } }, '<')
    .to('.loader__word', { y: '-110%', duration: .8, ease: 'power3.in' }, '+=.25')
    .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.0, ease: 'power4.inOut' }, '-=.1');
}
if ($('#loader')) {
  if (reduce) {
    gsap.set('#loader', { display: 'none' });
    gsap.set('.hero__title [data-hero-word]', { y: 0 });
    gsap.set(['.hero__eyebrow', '.hero__foot', '.nav'], { opacity: 1, y: 0 });
  } else {
    setTimeout(intro, 250);
    window.addEventListener('load', intro);
    setTimeout(heroIn, 2900);
    setTimeout(heroIn, 6000);
  }
} else if ($('.hero__title')) {
  // герой без прелоадера (если вдруг) — просто показать
  gsap.set('.hero__title [data-hero-word]', { y: 0 });
}

/* ─── Герой: карусель + параллакс ───────── */
(function heroCarousel() {
  const slides = $$('.hero__slide');
  if (slides.length < 2) return;
  let hi = 0, timer;
  const idxEl = $('#heroIndex');
  function go(n) {
    hi = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === hi));
    if (idxEl) idxEl.textContent = String(hi + 1).padStart(2, '0');
    if (!reduce) gsap.fromTo(slides[hi], { scale: 1.14 }, { scale: 1, duration: 7, ease: 'power1.out' });
  }
  function auto() { clearInterval(timer); timer = setInterval(() => go(hi + 1), 5500); }
  $('#heroNext')?.addEventListener('click', () => { go(hi + 1); auto(); });
  $('#heroPrev')?.addEventListener('click', () => { go(hi - 1); auto(); });
  go(0); if (!reduce) auto();
  if (!reduce) {
    gsap.to('.hero__media', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__content', { yPercent: -18, opacity: .3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
})();

/* ─── Вступление: word-by-word reveal ───── */
(function introReveal() {
  const el = $('#introText');
  if (!el) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  if (reduce) { gsap.set(el.querySelectorAll('.word'), { color: 'var(--ink)' }); return; }
  gsap.to(el.querySelectorAll('.word'), { color: 'var(--ink)', stagger: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 58%', scrub: true } });
  const star = $('.intro__star');
  if (star) gsap.to(star, { rotate: 180, scrollTrigger: { trigger: '.intro', start: 'top 80%', end: 'bottom top', scrub: true } });
})();

/* ─── Счётчики ──────────────────────────── */
$$('.count').forEach(el => {
  const to = +el.dataset.to;
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to({ v: 0 }, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(this.targets()[0].v); } })
  });
});

/* ─── Универсальные reveal ──────────────── */
if (!reduce) {
  $$('[data-reveal]').forEach(el => gsap.to(el, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-reveal-line]').forEach(el => gsap.to(el, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));
  $$('[data-stagger]').forEach(group => {
    gsap.to(group.children, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .09, scrollTrigger: { trigger: group, start: 'top 84%' } });
  });
} else {
  gsap.set('[data-reveal],[data-reveal-line]', { opacity: 1, y: 0 });
  $$('[data-stagger]').forEach(g => gsap.set(g.children, { opacity: 1, y: 0 }));
}

/* ─── Картинки: clip-reveal + параллакс ─── */
$$('.feature__media,[data-img-reveal]').forEach(media => {
  const img = media.querySelector('[data-parallax-img]') || media.querySelector('img');
  if (!reduce && media.classList.contains('feature__media')) {
    gsap.to(media, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: media, start: 'top 84%' } });
  } else { gsap.set(media, { clipPath: 'none' }); }
  if (img && img.hasAttribute('data-parallax-img') && !reduce) {
    gsap.fromTo(img, { yPercent: -10, scale: 1.12 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
});

/* ─── Заголовки построчно ───────────────── */
$$('.feature__title,.lifestyle__title,[data-words]').forEach(title => {
  const words = title.querySelectorAll('[data-line-word]');
  if (reduce || !words.length) return;
  gsap.from(words, { yPercent: 115, duration: 1.0, ease: 'power4.out', stagger: .055, scrollTrigger: { trigger: title, start: 'top 88%' } });
});

/* ─── Бегущая строка ────────────────────── */
(function marquee() {
  const track = $('#marquee');
  if (!track || reduce) return;
  let x = 0, base = 0.6, vel = 0, w = track.children[0].offsetWidth;
  window.addEventListener('resize', () => { w = track.children[0].offsetWidth; });
  if (lenis) lenis.on('scroll', e => { vel = e.velocity || 0; });
  gsap.ticker.add(() => { x -= (base + Math.min(Math.abs(vel) * 0.4, 6)); if (-x >= w) x += w; track.style.transform = `translate3d(${x}px,0,0)`; });
})();

/* ─── Горизонтальная галерея (pin) ──────── */
(function galleryPin() {
  const track = $('#galleryTrack');
  if (!track || reduce || isTouch) return;
  const getDist = () => Math.max(0, track.scrollWidth - window.innerWidth + (parseFloat(getComputedStyle(track).paddingRight) || 0));
  gsap.to(track, { x: () => -getDist(), ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top top', end: () => '+=' + getDist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
})();

/* ─── Параллакс фонов ───────────────────── */
$$('[data-parallax-bg]').forEach(bg => {
  if (reduce) return;
  gsap.fromTo(bg, { yPercent: -10 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
});

/* ─── FAQ аккордеон ─────────────────────── */
$$('.qa').forEach(qa => {
  const btn = qa.querySelector('.qa__q'), panel = qa.querySelector('.qa__a');
  btn.addEventListener('click', () => {
    const open = qa.classList.contains('is-open');
    $$('.qa.is-open').forEach(o => { if (o !== qa) { o.classList.remove('is-open'); gsap.to(o.querySelector('.qa__a'), { height: 0, duration: .5, ease: 'power3.inOut' }); } });
    if (open) { qa.classList.remove('is-open'); gsap.to(panel, { height: 0, duration: .5, ease: 'power3.inOut' }); }
    else { qa.classList.add('is-open'); gsap.set(panel, { height: 'auto' }); gsap.from(panel, { height: 0, duration: .6, ease: 'power3.inOut' }); }
    setTimeout(() => ScrollTrigger.refresh(), 550);
  });
});

/* ─── Мобильное меню ───────────────────── */
(function mobileMenu() {
  const burger = $('#navBurger'), menu = $('#mobMenu'), nav = $('#nav');
  if (!burger || !menu) return;
  const links = $$('.mob-menu__link', menu);
  function toggle() {
    const open = menu.classList.contains('is-open');
    if (open) {
      burger.classList.remove('is-open');
      nav.classList.remove('mob-open');
      gsap.to(links, { opacity: 0, y: 20, duration: .25, stagger: .03 });
      gsap.to(menu, { opacity: 0, duration: .35, delay: .1, onComplete: () => { menu.classList.remove('is-open'); if (lenis) lenis.start(); document.body.style.overflow = ''; } });
    } else {
      menu.classList.add('is-open');
      burger.classList.add('is-open');
      nav.classList.add('mob-open');
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: .35 });
      gsap.fromTo(links, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .6, stagger: .07, ease: 'power3.out', delay: .12 });
    }
  }
  burger.addEventListener('click', toggle);
  links.forEach(a => a.addEventListener('click', () => { if (menu.classList.contains('is-open')) toggle(); }));
})();

/* ─── Шапка: автоскрытие ────────────────── */
(function navHide() {
  const nav = $('#nav'); if (!nav) return;
  let last = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { const y = self.scroll(); if (y > 120 && y > last) nav.classList.add('is-hidden'); else nav.classList.remove('is-hidden'); last = y; } });
})();

/* ─── Галерея: фильтры ──────────────────── */
(function galleryFilter() {
  const bar = $('[data-filter-bar]'); if (!bar) return;
  const items = $$('[data-category]');
  bar.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]'); if (!btn) return;
    $$('[data-filter]', bar).forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    items.forEach(it => {
      const show = f === 'all' || it.dataset.category === f;
      if (show) { it.style.display = ''; gsap.fromTo(it, { opacity: 0, scale: .96, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: .6, ease: 'power3.out' }); }
      else { gsap.to(it, { opacity: 0, scale: .96, duration: .3, onComplete: () => { it.style.display = 'none'; } }); }
    });
    setTimeout(() => ScrollTrigger.refresh(), 650);
  });
})();

/* ─── Лайтбокс ──────────────────────────── */
(function lightbox() {
  const triggers = $$('[data-lightbox]');
  if (!triggers.length) return;
  const data = triggers.map(t => ({ src: t.dataset.src || t.querySelector('img')?.src, cap: t.dataset.caption || '' }));
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = `
    <button class="lightbox__close" aria-label="Закрыть" data-cursor>✕</button>
    <button class="lightbox__nav lightbox__prev" aria-label="Назад" data-cursor>←</button>
    <figure class="lightbox__fig"><img alt=""><figcaption></figcaption></figure>
    <button class="lightbox__nav lightbox__next" aria-label="Вперёд" data-cursor>→</button>
    <span class="lightbox__count"></span>`;
  document.body.appendChild(box);
  const img = box.querySelector('img'), cap = box.querySelector('figcaption'), count = box.querySelector('.lightbox__count');
  let i = 0;
  function render() {
    img.style.opacity = 0;
    const d = data[i];
    const tmp = new Image();
    tmp.onload = () => { img.src = d.src; gsap.fromTo(img, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: .6, ease: 'power2.out' }); };
    tmp.src = d.src;
    cap.textContent = d.cap;
    count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(data.length).padStart(2, '0')}`;
  }
  function open(n) { i = n; box.classList.add('is-open'); if (lenis) lenis.stop(); document.body.style.overflow = 'hidden'; gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: .4 }); render(); }
  function close() { gsap.to(box, { opacity: 0, duration: .35, onComplete: () => { box.classList.remove('is-open'); if (lenis) lenis.start(); document.body.style.overflow = ''; } }); }
  const next = () => { i = (i + 1) % data.length; render(); };
  const prev = () => { i = (i - 1 + data.length) % data.length; render(); };
  triggers.forEach((t, n) => t.addEventListener('click', e => { e.preventDefault(); open(n); }));
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__next').addEventListener('click', next);
  box.querySelector('.lightbox__prev').addEventListener('click', prev);
  box.addEventListener('click', e => { if (e.target === box) close(); });
  window.addEventListener('keydown', e => { if (!box.classList.contains('is-open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); });
  if (window.__bindHover) window.__bindHover();
})();

/* ─── Страница резиденции: данные по id ──── */
(function residenceData() {
  const root = $('[data-residence]'); if (!root) return;
  const DB = {
    R1: { name: 'Ривьера', type: 'Таунхаус у воды', area: '184', beds: '3', baths: '3', floor: '2', terrace: '46', price: 'от 48 млн ₽', img: 'assets/img/interior1.jpg', hero: 'assets/img/exterior.jpg', desc: 'Угловая резиденция первой линии с панорамным видом на реку. Двойная высота гостиной, камин и приватная терраса, выходящая прямо к воде.' },
    R2: { name: 'Лагуна', type: 'Пентхаус', area: '220', beds: '4', baths: '3', floor: '3', terrace: '72', price: 'от 72 млн ₽', img: 'assets/img/living2.jpg', hero: 'assets/img/facade.jpg', desc: 'Двухуровневый пентхаус с эксплуатируемой кровлей-террасой, собственным лифтом и панорамой на излучину реки и парк.' },
    R3: { name: 'Прибрежная', type: 'Таунхаус', area: '165', beds: '3', baths: '2', floor: '2', terrace: '38', price: 'от 41 млн ₽', img: 'assets/img/terrace.jpg', hero: 'assets/img/hero.jpg', desc: 'Светлая резиденция с французскими окнами в пол, мастер-спальней с гардеробной и видовой террасой над набережной.' },
    R4: { name: 'Панорама', type: 'Пентхаус с террасой', area: '245', beds: '4', baths: '4', floor: '3', terrace: '88', price: 'от 86 млн ₽', img: 'assets/img/interior2.jpg', hero: 'assets/img/lake.jpg', desc: 'Флагманская резиденция клуба: 88 м² открытых террас, бассейн-инфинити и приватный выход к причалу.' },
    R5: { name: 'Затон', type: 'Таунхаус', area: '158', beds: '2', baths: '2', floor: '2', terrace: '34', price: 'от 38 млн ₽', img: 'assets/img/kitchen.jpg', hero: 'assets/img/aerial.jpg', desc: 'Камерная резиденция для пары: открытая кухня-гостиная, кабинет и тихая терраса, обращённая в сосновый парк.' },
    R6: { name: 'Маяк', type: 'Двухуровневая резиденция', area: '198', beds: '3', baths: '3', floor: '2–3', terrace: '52', price: 'от 56 млн ₽', img: 'assets/img/bedroom1.jpg', hero: 'assets/img/detail.jpg', desc: 'Угловая двухуровневая резиденция с витражом в пол высотой два этажа и видовой террасой на верхнем уровне.' }
  };
  const id = new URLSearchParams(location.search).get('id');
  const d = DB[id] || DB.R1;
  document.title = `Резиденция «${d.name}» — ЗАРЕЧЬЕ`;
  const set = (sel, val) => { $$(sel).forEach(e => e.textContent = val); };
  set('[data-field="name"]', d.name);
  set('[data-field="type"]', d.type);
  set('[data-field="area"]', d.area);
  set('[data-field="beds"]', d.beds);
  set('[data-field="baths"]', d.baths);
  set('[data-field="floor"]', d.floor);
  set('[data-field="terrace"]', d.terrace);
  set('[data-field="price"]', d.price);
  set('[data-field="desc"]', d.desc);
  const heroImg = $('[data-field="hero"]');
  if (heroImg) heroImg.style.backgroundImage = `url('${d.hero}')`;
  const mainImg = $('[data-field="img"]');
  if (mainImg) mainImg.src = d.img;
})();

/* ─── Форма (демо) ──────────────────────── */
$$('form[data-demo-form]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.submit'); if (!btn) return;
    const txt = btn.querySelector('.submit__txt');
    const orig = txt.textContent;
    txt.textContent = 'Заявка отправлена';
    btn.classList.add('is-sent');
    gsap.fromTo(btn, { scale: .96 }, { scale: 1, duration: .5, ease: 'back.out(2)' });
    setTimeout(() => { txt.textContent = orig; btn.classList.remove('is-sent'); form.reset(); }, 3200);
  });
});

/* ─── Год в футере ──────────────────────── */
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 400));
