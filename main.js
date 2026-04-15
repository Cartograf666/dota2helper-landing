function setViewportHeightVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function initHeroCursorLight() {
  const hero = document.querySelector(".hero");
  const dot = document.querySelector(".cursor-dot");
  if (!hero || !dot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setCenter() {
    const w = hero.offsetWidth;
    const h = hero.offsetHeight;
    hero.style.setProperty("--cursor-tx", String(w / 2));
    hero.style.setProperty("--cursor-ty", String(h / 2));
    hero.style.setProperty("--spot-x", "50%");
    hero.style.setProperty("--spot-y", "50%");
  }

  function onPointerMove(e) {
    const rect = hero.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (reduceMotion) {
      setCenter();
      return;
    }

    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    dot.classList.toggle("is-visible", inside);

    if (!inside) {
      return;
    }

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    hero.style.setProperty("--cursor-tx", String(px));
    hero.style.setProperty("--cursor-ty", String(py));
    hero.style.setProperty("--spot-x", `${(px / rect.width) * 100}%`);
    hero.style.setProperty("--spot-y", `${(py / rect.height) * 100}%`);
  }

  function onPointerLeaveHero() {
    if (!reduceMotion) {
      dot.classList.remove("is-visible");
    }
  }

  setCenter();
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  hero.addEventListener("pointerleave", onPointerLeaveHero);
  window.addEventListener("resize", setCenter, { passive: true });
}

function initAnimations() {
  document.body.classList.add("is-ready");
}

setViewportHeightVar();
window.addEventListener("resize", setViewportHeightVar, { passive: true });

initAnimations();
initHeroCursorLight();

function setupRevealAnimations() {
  const elements = Array.from(document.querySelectorAll(".reveal"));
  if (elements.length === 0) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const el of elements) el.classList.add("is-visible");
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  for (const el of elements) io.observe(el);
}

/** Порядок и названия языков как в приложении; флаги в ./assets/lg/ */
const LANG_OPTIONS = {
  zh: { flag: "./assets/lg/ch.png", label: "中文", htmlLang: "zh" },
  en: { flag: "./assets/lg/us.png", label: "English", htmlLang: "en" },
  ru: { flag: "./assets/lg/ru.png", label: "Русский", htmlLang: "ru" },
  es: { flag: "./assets/lg/sp.png", label: "Español", htmlLang: "es" },
  pt: { flag: "./assets/lg/pt.png", label: "Português", htmlLang: "pt" },
  uk: { flag: "./assets/lg/ukr.png", label: "Українська", htmlLang: "uk" },
  id: { flag: "./assets/lg/ind.png", label: "Bahasa Indonesia", htmlLang: "id" },
  ja: { flag: "./assets/lg/jp.png", label: "日本語", htmlLang: "ja" },
  de: { flag: "./assets/lg/gr.png", label: "Deutsch", htmlLang: "de" },
};

function applyTranslations(lang) {
  const t = window.SITE_I18N?.[lang];
  if (!t) return;

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key && t[key] !== undefined) el.innerHTML = t[key];
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key && t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key && t[key] !== undefined) el.setAttribute("aria-label", t[key]);
  });

  document.querySelectorAll("[data-i18n-meta]").forEach((el) => {
    const key = el.getAttribute("data-i18n-meta");
    if (key && t[key] !== undefined) el.setAttribute("content", t[key]);
  });

  syncNavToggleAria(lang);
}

function syncNavToggleAria(lang) {
  const t = window.SITE_I18N?.[lang];
  const header = document.querySelector(".site-header");
  const btn = document.querySelector(".nav-toggle");
  if (!t || !btn) return;
  const open = header?.classList.contains("is-nav-open");
  const label = open ? t.nav_toggle_close : t.nav_toggle_open;
  if (label !== undefined) btn.setAttribute("aria-label", label);
}

function setupLanguageDropdown() {
  const roots = Array.from(document.querySelectorAll("[data-lang]"));
  if (roots.length === 0) return;

  function getStored() {
    const raw = localStorage.getItem("lang");
    return raw && LANG_OPTIONS[raw] ? raw : "ru";
  }

  let lastApplied = null;

  function applyToAll(value) {
    const opt = LANG_OPTIONS[value];
    if (!opt) return;

    localStorage.setItem("lang", value);
    document.documentElement.lang = opt.htmlLang;

    for (const root of roots) {
      const btn = root.querySelector(".lang__btn");
      const label = root.querySelector(".lang__label");
      const flagImg = btn?.querySelector(".lang__flag-img");
      const items = Array.from(root.querySelectorAll(".lang__item"));
      if (label) label.textContent = opt.label;
      if (flagImg) flagImg.src = opt.flag;
      for (const item of items) {
        const selected = item.dataset.langValue === value;
        item.setAttribute("aria-selected", String(selected));
      }
    }

    applyTranslations(value);

    if (lastApplied !== value) {
      trackEvent("select_language", { language: value });
      lastApplied = value;
    }
  }

  for (const root of roots) {
    const btn = root.querySelector(".lang__btn");
    const menu = root.querySelector(".lang__menu");
    const items = Array.from(root.querySelectorAll(".lang__item"));
    if (!btn || !menu || items.length === 0) continue;

    function open() {
      root.dataset.open = "true";
      btn.setAttribute("aria-expanded", "true");
      menu.focus();
    }

    function close() {
      delete root.dataset.open;
      btn.setAttribute("aria-expanded", "false");
    }

    function toggle() {
      const isOpen = root.dataset.open === "true";
      if (isOpen) close();
      else open();
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    menu.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const currentIdx = items.findIndex((x) => x.getAttribute("aria-selected") === "true");
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const next = items[(currentIdx + dir + items.length) % items.length];
      next?.focus();
    });

    for (const item of items) {
      item.addEventListener("click", () => {
        const value = item.dataset.langValue;
        if (!value) return;
        applyToAll(value);
        close();
        btn.focus();
      });
    }
  }

  applyToAll(getStored());
}

setupRevealAnimations();
setupLanguageDropdown();

function trackEvent(name, params) {
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params ?? {});
  } catch {
    // ignore analytics failures
  }
}

function setupAnalyticsEvents() {
  function isExternalUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      return u.origin !== window.location.origin && (u.protocol === "http:" || u.protocol === "https:");
    } catch {
      return false;
    }
  }

  function sendOutbound(label, url, onDone) {
    if (typeof window.gtag !== "function") {
      onDone?.();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onDone?.();
    };

    window.gtag("event", "outbound_click", {
      event_category: "outbound",
      event_label: label,
      link_url: url,
      transport_type: "beacon",
      event_callback: finish,
    });

    // Fallback if callback never fires (blocked/slow)
    window.setTimeout(finish, 450);
  }

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target?.closest?.("a");
      if (!a) return;
      if (a.getAttribute("aria-disabled") === "true") return;
      if (a.getAttribute("tabindex") === "-1") return;

      const href = a.getAttribute("href");
      if (!href) return;

      const analyticsKey = a.getAttribute("data-analytics");
      const label = analyticsKey || href;

      const isMailto = href.startsWith("mailto:");
      const isTel = href.startsWith("tel:");
      const isHash = href.startsWith("#");

      if (isMailto) {
        trackEvent("contact_email_click", { event_category: "contact", event_label: label });
        return;
      }

      if (isTel) {
        trackEvent("contact_phone_click", { event_category: "contact", event_label: label });
        return;
      }

      if (isHash) {
        trackEvent("nav_anchor_click", { event_category: "navigation", event_label: href });
        return;
      }

      if (!isExternalUrl(href)) return;

      // If link opens in a new tab, don’t block navigation.
      const target = a.getAttribute("target");
      if (target === "_blank") {
        trackEvent("outbound_click", { event_category: "outbound", event_label: label, link_url: href });
        return;
      }

      // Same-tab external: try to send beacon before navigating.
      e.preventDefault();
      sendOutbound(label, href, () => {
        window.location.href = href;
      });
    },
    true
  );
}

setupAnalyticsEvents();

function setupPhoneTilt() {
  const stage = document.querySelector("[data-tilt]");
  if (!stage) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let raf = 0;
  let latest = null;

  function apply(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    const max = 8; // degrees
    const tiltY = (x - 0.5) * max * 2;
    const tiltX = (0.5 - y) * max * 2;

    stage.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    stage.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
  }

  function onMove(e) {
    latest = e;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!latest) return;
      apply(latest.clientX, latest.clientY);
    });
  }

  function reset() {
    stage.style.setProperty("--tilt-x", "0deg");
    stage.style.setProperty("--tilt-y", "0deg");
  }

  stage.addEventListener("mousemove", onMove);
  stage.addEventListener("mouseleave", reset);
  reset();
}

setupPhoneTilt();

/**
 * Карусель скринов: порядок картинок 04 → 05 → 03 → 01.
 * У каждой из 4 карточек сверху полоска-лоадер; по заполнении — смена слайда и активной карточки.
 */
function setupFeaturesCarousel() {
  const root = document.querySelector("[data-features-carousel]");
  const cards = Array.from(document.querySelectorAll(".features-card[data-feature-screen]"));
  const slides = Array.from(root?.querySelectorAll(".features-visual__slide") ?? []);
  if (!root || slides.length !== 4 || cards.length !== 4) return;

  const STEP_MS = 5000;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setSlide(n) {
    const i = ((n % 4) + 4) % 4;
    slides.forEach((s, j) => s.classList.toggle("is-active", j === i));
  }

  function setActiveCard(n) {
    const i = ((n % 4) + 4) % 4;
    cards.forEach((c, j) => c.classList.toggle("is-carousel-active", j === i));
  }

  function resetAllFills() {
    for (const c of cards) {
      const fill = c.querySelector(".features-card__loader-fill");
      if (fill) fill.style.width = "0%";
    }
  }

  function applyProgress(stepIndex, p) {
    const pct = Math.min(1, Math.max(0, p)) * 100;
    cards.forEach((c, j) => {
      const fill = c.querySelector(".features-card__loader-fill");
      if (!fill) return;
      fill.style.width = j === stepIndex ? `${pct}%` : "0%";
    });
  }

  let step = 0;
  let progress = 0;
  let lastTs = 0;
  let raf = 0;
  let hoverLock = false;

  function tick(ts) {
    raf = requestAnimationFrame(tick);
    if (document.hidden) {
      lastTs = 0;
      return;
    }
    if (hoverLock) {
      lastTs = 0;
      return;
    }
    if (!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;
    progress += dt / STEP_MS;
    if (progress >= 1) {
      progress = 0;
      step = (step + 1) % 4;
      resetAllFills();
      setSlide(step);
      setActiveCard(step);
    }
    applyProgress(step, progress);
  }

  if (reduced) {
    setSlide(0);
    setActiveCard(0);
    const f0 = cards[0]?.querySelector(".features-card__loader-fill");
    if (f0) f0.style.width = "100%";
    return;
  }

  setSlide(0);
  setActiveCard(0);
  resetAllFills();
  applyProgress(0, 0);
  raf = requestAnimationFrame(tick);

  cards.forEach((card) => {
    const si = parseInt(card.dataset.featureScreen, 10);
    if (Number.isNaN(si)) return;
    card.addEventListener("mouseenter", () => {
      hoverLock = true;
      step = si;
      progress = 0;
      lastTs = 0;
      resetAllFills();
      setSlide(step);
      setActiveCard(step);
      applyProgress(step, 0);
    });
    card.addEventListener("mouseleave", () => {
      hoverLock = false;
      lastTs = 0;
    });
  });
}

setupFeaturesCarousel();

/**
 * Лёгкие «фосфоресцентные» частицы (настроение как у GPU-примера на pcvector),
 * без Three.js: улетают от центра к краям и растворяются у границы блока.
 */
function setupFeaturesParticles() {
  const visual = document.querySelector(".features-visual");
  const canvas = document.querySelector(".features-visual__particles");
  if (!visual || !canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    canvas.style.opacity = "0";
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 1;
  let h = 1;
  let particles = [];
  let raf = 0;
  let visible = false;

  const count = () => (window.innerWidth < 720 ? 72 : 110);

  function resize() {
    const rect = visual.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  class Particle {
    reset() {
      const cx = w / 2;
      const cy = h / 2;
      const spread = Math.min(w, h) * (0.06 + Math.random() * 0.04);
      this.x = cx + (Math.random() - 0.5) * spread;
      this.y = cy + (Math.random() - 0.5) * spread;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.28 + Math.random() * 1.05;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.r = 0.6 + Math.random() * 2.4;
      this.base = 0.12 + Math.random() * 0.42;
      this.wobble = Math.random() * Math.PI * 2;
    }

    update() {
      this.wobble += 0.02;
      this.x += this.vx + Math.sin(this.wobble) * 0.15;
      this.y += this.vy + Math.cos(this.wobble * 0.9) * 0.12;
      const edge = Math.min(this.x, this.y, w - this.x, h - this.y);
      const fadeZone = Math.min(w, h) * 0.26;
      let edgeFade = edge < fadeZone ? edge / fadeZone : 1;
      edgeFade = Math.pow(Math.max(0, edgeFade), 1.35);
      const centerBoost = 1 - Math.min(1, Math.hypot(this.x - w / 2, this.y - h / 2) / (Math.min(w, h) * 0.35));
      this.a = this.base * edgeFade * (0.55 + 0.45 * Math.max(0, centerBoost));
      if (edge < 0.8 || this.a < 0.035) this.reset();
    }

    draw() {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3.2);
      g.addColorStop(0, `rgba(255, 236, 180, ${this.a * 1.1})`);
      g.addColorStop(0.45, `rgba(222, 169, 35, ${this.a * 0.65})`);
      g.addColorStop(1, "rgba(222, 169, 35, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function rebuild() {
    particles = [];
    const n = count();
    for (let i = 0; i < n; i += 1) {
      const p = new Particle();
      p.reset();
      particles.push(p);
    }
  }

  function tick(now) {
    if (!visible) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.update();
      p.draw();
    }
  }

  function startLoop() {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  const ro = new ResizeObserver(() => {
    resize();
    rebuild();
  });
  ro.observe(visual);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) startLoop();
      else stopLoop();
    },
    { rootMargin: "60px", threshold: 0.04 }
  );
  io.observe(visual);

  resize();
  rebuild();
}

setupFeaturesParticles();

function setupCtaVideoBg() {
  const band = document.querySelector(".cta-video-bg");
  const video = document.querySelector(".cta-video-bg__video");
  if (!band || !video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  video.addEventListener("error", () => {
    band.classList.add("is-unavailable");
  });

  video.play().catch(() => {
    band.classList.add("is-unavailable");
  });
}

setupCtaVideoBg();

function setupMobileNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!header || !toggle || !nav) return;

  const mq = window.matchMedia("(max-width: 980px)");

  function getLang() {
    const raw = localStorage.getItem("lang");
    return raw && window.SITE_I18N?.[raw] ? raw : "ru";
  }

  function close() {
    header.classList.remove("is-nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
    document.body.classList.remove("is-nav-open");
    syncNavToggleAria(getLang());
    trackEvent("mobile_nav_toggle", { state: "closed" });
  }

  function open() {
    header.classList.add("is-nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    document.body.classList.add("is-nav-open");
    syncNavToggleAria(getLang());
    trackEvent("mobile_nav_toggle", { state: "open" });
  }

  function onToggleClick() {
    if (!mq.matches) return;
    if (header.classList.contains("is-nav-open")) close();
    else open();
  }

  toggle.addEventListener("click", onToggleClick);

  nav.querySelectorAll("a.nav__link").forEach((a) => {
    a.addEventListener("click", () => {
      const href = a.getAttribute("href") || "";
      if (href) {
        trackEvent("nav_click", { event_category: "navigation", event_label: href });
      }
      if (mq.matches) close();
    });
  });

  mq.addEventListener("change", (e) => {
    if (!e.matches) close();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || !header.classList.contains("is-nav-open")) return;
      close();
    },
    true
  );
}

setupMobileNav();

function setupSectionImpressions() {
  const sections = [
    { id: "top", name: "hero" },
    { id: "features", name: "features" },
    { id: "community", name: "community" },
    { id: "download", name: "download" },
    { id: "about", name: "about" },
  ];

  const els = sections
    .map((s) => ({ ...s, el: document.getElementById(s.id) }))
    .filter((x) => x.el);

  if (els.length === 0) return;

  const seen = new Set();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const threshold = reduced ? 0.01 : 0.25;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        trackEvent("section_view", { event_category: "engagement", event_label: id });
        io.unobserve(entry.target);
      }
    },
    { threshold, rootMargin: "0px 0px -20% 0px" }
  );

  for (const { el } of els) io.observe(el);
}

setupSectionImpressions();
