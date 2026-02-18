/**
 * Blob Cursor – Vanilla JS + GSAP
 * Creates gooey blob elements that follow the cursor across the entire page.
 * Reads --color-accent from CSS custom properties so it follows the theme.
 */
document.addEventListener("DOMContentLoaded", function () {
  /* ---------- config ---------- */
  const CONFIG = {
    blobType: "circle",
    trailCount: 3,
    sizes: [121, 125, 75],
    innerSizes: [35, 35, 25],
    innerColor: "rgba(255,255,255,0.8)",
    opacities: [0.6, 0.6, 0.6],
    shadowBlur: 42,
    shadowOffsetX: 32,
    shadowOffsetY: 10,
    shadowColor: "rgba(0,0,0,0.75)",
    filterStdDeviation: 30,
    filterColorMatrixValues:
      "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -10",
    useFilter: true,
    fastDuration: 0.54,
    slowDuration: 0.66,
    fastEase: "power3.out",
    slowEase: "power1.out",
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
      transform: translate(-50%, -50%);
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

  /* ---------- movement ---------- */
  function onMove(e) {
    const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const y = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    blobs.forEach((el, i) => {
      const isLead = i === 0;
      gsap.to(el, {
        x: x,
        y: y,
        duration: isLead ? CONFIG.fastDuration : CONFIG.slowDuration,
        ease: isLead ? CONFIG.fastEase : CONFIG.slowEase,
      });
    });
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length) onMove(e.touches[0]);
  }, { passive: true });

  /* Hide on mobile / small screens where a cursor doesn't make sense */
  function checkVisibility() {
    wrapper.style.display = window.innerWidth < 768 ? "none" : "block";
  }
  checkVisibility();
  window.addEventListener("resize", checkVisibility);
});
