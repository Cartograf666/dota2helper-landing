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
