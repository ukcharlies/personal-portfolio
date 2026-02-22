/**
 * Blob Cursor – Vanilla JS + GSAP
 * Creates gooey blob elements that follow the cursor across the entire page.
 * Reads --color-accent from CSS custom properties so it follows the theme.
 */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof gsap === "undefined") return;

  /* ---------- config ---------- */
  const CONFIG = {
    blobType: "circle",
    trailCount: 3,
    sizes: [86, 62, 44],
    innerSizes: [20, 14, 10],
    innerColor: "rgba(255,255,255,0.8)",
    opacities: [0.5, 0.42, 0.35],
    shadowBlur: 26,
    shadowOffsetX: 14,
    shadowOffsetY: 8,
    shadowColor: "rgba(0,0,0,0.45)",
    filterStdDeviation: 24,
    filterColorMatrixValues:
      "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -8",
    useFilter: true,
    leadLerp: 0.28,
    midLerp: 0.17,
    tailLerp: 0.12,
    maxStretch: 0.34,
    maxRotateDeg: 22,
    zIndex: 90,
  };

  function getThemeColor() {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue("--color-primary").trim() || "#a3977d";
  }

  /* ---------- build DOM ---------- */
  const wrapper = document.createElement("div");
  wrapper.id = "blob-cursor-container";
  wrapper.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: ${CONFIG.zIndex}; overflow: hidden;
  `;

  /* SVG filter for gooey effect */
  if (CONFIG.useFilter) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("style", "position:absolute;width:0;height:0");
    const filter = document.createElementNS(svgNS, "filter");
    filter.setAttribute("id", "blob-filter");
    const blur = document.createElementNS(svgNS, "feGaussianBlur");
    blur.setAttribute("in", "SourceGraphic");
    blur.setAttribute("result", "blur");
    blur.setAttribute("stdDeviation", CONFIG.filterStdDeviation);
    const matrix = document.createElementNS(svgNS, "feColorMatrix");
    matrix.setAttribute("in", "blur");
    matrix.setAttribute("values", CONFIG.filterColorMatrixValues);
    filter.appendChild(blur);
    filter.appendChild(matrix);
    svg.appendChild(filter);
    wrapper.appendChild(svg);
  }

  const blobMain = document.createElement("div");
  blobMain.style.cssText = `
    position: absolute; width: 100%; height: 100%;
    pointer-events: none; user-select: none;
    ${CONFIG.useFilter ? "filter: url(#blob-filter);" : ""}
  `;

  const blobs = [];

  for (let i = 0; i < CONFIG.trailCount; i++) {
    const blob = document.createElement("div");
    const s = CONFIG.sizes[i];
    const br = CONFIG.blobType === "circle" ? "50%" : "0%";
    const fillColor = getThemeColor();

    blob.className = "blob-dot";
    blob.dataset.index = i;
    blob.style.cssText = `
      position: absolute; will-change: transform;
      width: ${s}px; height: ${s}px;
      border-radius: ${br};
      background-color: ${fillColor};
      opacity: ${CONFIG.opacities[i]};
      box-shadow: ${CONFIG.shadowOffsetX}px ${CONFIG.shadowOffsetY}px ${CONFIG.shadowBlur}px 0 ${CONFIG.shadowColor};
    `;

    /* inner dot */
    const inner = document.createElement("div");
    const is = CONFIG.innerSizes[i];
    inner.style.cssText = `
      position: absolute;
      width: ${is}px; height: ${is}px;
      top: ${(s - is) / 2}px; left: ${(s - is) / 2}px;
      background-color: ${CONFIG.innerColor};
      border-radius: ${br};
    `;
    blob.appendChild(inner);
    blobMain.appendChild(blob);
    blobs.push(blob);
  }

  wrapper.appendChild(blobMain);
  document.body.appendChild(wrapper);

  /* ---------- theme observer ---------- */
  function updateBlobColors() {
    const c = getThemeColor();
    blobs.forEach((b) => (b.style.backgroundColor = c));
  }
  const observer = new MutationObserver(updateBlobColors);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  blobs.forEach((blob) => {
    gsap.set(blob, { xPercent: -50, yPercent: -50 });
  });

  /* ---------- movement ---------- */
  const state = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    interactive: false,
  };

  const points = blobs.map(() => ({
    x: state.targetX,
    y: state.targetY,
    vx: 0,
    vy: 0,
  }));

  function onMove(e) {
    state.targetX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? state.targetX;
    state.targetY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? state.targetY;
  }

  function checkInteractiveTarget(target) {
    if (!target || !target.closest) {
      state.interactive = false;
      return;
    }
    state.interactive = !!target.closest(
      "a,button,input,textarea,select,[role='button'],.project-card,.hero-action,.hero-cta"
    );
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseover", (e) => checkInteractiveTarget(e.target));
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length) onMove(e.touches[0]);
  }, { passive: true });
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length) onMove(e.touches[0]);
  }, { passive: true });

  gsap.ticker.add(() => {
    const lerpValues = [CONFIG.leadLerp, CONFIG.midLerp, CONFIG.tailLerp];

    points.forEach((p, i) => {
      const prevX = p.x;
      const prevY = p.y;
      const followX = i === 0 ? state.targetX : points[i - 1].x;
      const followY = i === 0 ? state.targetY : points[i - 1].y;
      const lerp = lerpValues[i] || CONFIG.tailLerp;

      p.x += (followX - p.x) * lerp;
      p.y += (followY - p.y) * lerp;
      p.vx = p.x - prevX;
      p.vy = p.y - prevY;

      let stretchX = 1;
      let stretchY = 1;
      let rotate = 0;

      if (i === 0) {
        const speed = Math.hypot(p.vx, p.vy);
        const stretch = Math.min(CONFIG.maxStretch, speed / 32);
        stretchX = 1 + stretch + (state.interactive ? 0.09 : 0);
        stretchY = 1 - stretch * 0.75;
        rotate = Math.max(
          -CONFIG.maxRotateDeg,
          Math.min(CONFIG.maxRotateDeg, (Math.atan2(p.vy, p.vx) * 180) / Math.PI)
        );
      } else if (state.interactive) {
        stretchX = 1.05;
        stretchY = 0.96;
      }

      gsap.set(blobs[i], {
        x: p.x,
        y: p.y,
        scaleX: stretchX,
        scaleY: stretchY,
        rotation: rotate,
      });
    });
  });

  /* Hide on mobile / small screens where a cursor doesn't make sense */
  function checkVisibility() {
    const shouldHide =
      window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    wrapper.style.display = shouldHide ? "none" : "block";
  }
  checkVisibility();
  window.addEventListener("resize", checkVisibility);
});
