/**
 * Antigravity Particle Background – Vanilla Three.js
 * Renders an interactive particle field inside a given container.
 * Reads --color-accent from CSS custom properties so it follows the theme.
 */
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("antigravity-container");
  if (!container) return;

  /* ---------- helpers ---------- */
  function getThemeColor() {
    const style = getComputedStyle(document.documentElement);
    return (
      style.getPropertyValue("--antigravity-color").trim() ||
      style.getPropertyValue("--color-primary").trim() ||
      "#f5ec00"
    );
  }

  /* ---------- config ---------- */
  const CONFIG = {
    count: 300,
    magnetRadius: 6,
    ringRadius: 7,
    waveSpeed: 0.4,
    waveAmplitude: 1,
    particleSize: 1.5,
    lerpSpeed: 0.05,
    particleVariance: 1,
    rotationSpeed: 0,
    depthFactor: 1,
    pulseSpeed: 3,
    fieldStrength: 10,
  };

  /* ---------- three.js setup ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0); // transparent
  container.appendChild(renderer.domElement);

  /* ---------- material (theme aware) ---------- */
  const material = new THREE.MeshBasicMaterial({
    color: getThemeColor(),
    transparent: true,
    opacity: 0.95,
  });

  const geometry =
    typeof THREE.CapsuleGeometry === "function"
      ? new THREE.CapsuleGeometry(0.1, 0.4, 4, 8)
      : new THREE.SphereGeometry(0.2, 10, 10);

  const mesh = new THREE.InstancedMesh(geometry, material, CONFIG.count);
  scene.add(mesh);

  const dummy = new THREE.Object3D();

  /* ---------- viewport helpers ---------- */
  function visibleSize() {
    const vFov = (camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(vFov / 2) * camera.position.z;
    const w = h * (container.clientWidth / container.clientHeight);
    return { width: w, height: h };
  }

  let vp = visibleSize();

  /* ---------- particles ---------- */
  const particles = [];
  for (let i = 0; i < CONFIG.count; i++) {
    const x = (Math.random() - 0.5) * vp.width;
    const y = (Math.random() - 0.5) * vp.height;
    const z = (Math.random() - 0.5) * 20;
    particles.push({
      t: Math.random() * 100,
      speed: 0.01 + Math.random() / 200,
      mx: x,
      my: y,
      mz: z,
      cx: x,
      cy: y,
      cz: z,
      randomRadiusOffset: (Math.random() - 0.5) * 2,
    });
  }

  /* ---------- pointer tracking ---------- */
  const pointer = { x: 0, y: 0 };
  const virtualMouse = { x: 0, y: 0 };
  let lastMoveTime = 0;

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const py = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointer.x = px;
    pointer.y = py;
    lastMoveTime = Date.now();
  }
  container.addEventListener("mousemove", onPointerMove);
  /* Allow hover tracking on the hero wrapper instead, since container has pointer-events:none */
  const heroWrapper = container.closest(".hero-wrapper");
  if (heroWrapper) {
    heroWrapper.addEventListener("mousemove", onPointerMove);
    heroWrapper.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length) {
          onPointerMove(e.touches[0]);
        }
      },
      { passive: true }
    );
  }

  /* ---------- resize ---------- */
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    vp = visibleSize();
  }
  window.addEventListener("resize", onResize);

  /* ---------- theme observer ---------- */
  const observer = new MutationObserver(() => {
    material.color.set(getThemeColor());
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  /* ---------- animation loop ---------- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    /* auto-animate when idle */
    let destX = (pointer.x * vp.width) / 2;
    let destY = (pointer.y * vp.height) / 2;
    if (Date.now() - lastMoveTime > 2000) {
      destX = Math.sin(elapsed * 0.5) * (vp.width / 4);
      destY = Math.cos(elapsed) * (vp.height / 4);
    }

    virtualMouse.x += (destX - virtualMouse.x) * 0.05;
    virtualMouse.y += (destY - virtualMouse.y) * 0.05;

    const targetX = virtualMouse.x;
    const targetY = virtualMouse.y;

    const globalRotation = elapsed * CONFIG.rotationSpeed;

    particles.forEach((p, i) => {
      p.t += p.speed / 2;

      const projFactor = 1 - p.cz / 50;
      const pTx = targetX * projFactor;
      const pTy = targetY * projFactor;

      const dx = p.mx - pTx;
      const dy = p.my - pTy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let tx = p.mx,
        ty = p.my,
        tz = p.mz * CONFIG.depthFactor;

      if (dist < CONFIG.magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const wave =
          Math.sin(p.t * CONFIG.waveSpeed + angle) *
          0.5 *
          CONFIG.waveAmplitude;
        const deviation =
          p.randomRadiusOffset * (5 / (CONFIG.fieldStrength + 0.1));
        const rr = CONFIG.ringRadius + wave + deviation;
        tx = pTx + rr * Math.cos(angle);
        ty = pTy + rr * Math.sin(angle);
        tz =
          p.mz * CONFIG.depthFactor +
          Math.sin(p.t) * CONFIG.waveAmplitude * CONFIG.depthFactor;
      }

      p.cx += (tx - p.cx) * CONFIG.lerpSpeed;
      p.cy += (ty - p.cy) * CONFIG.lerpSpeed;
      p.cz += (tz - p.cz) * CONFIG.lerpSpeed;

      dummy.position.set(p.cx, p.cy, p.cz);
      dummy.lookAt(pTx, pTy, p.cz);
      dummy.rotateX(Math.PI / 2);

      const distToMouse = Math.sqrt(
        (p.cx - pTx) ** 2 + (p.cy - pTy) ** 2
      );
      const distFromRing = Math.abs(distToMouse - CONFIG.ringRadius);
      let sf = Math.max(0, Math.min(1, 1 - distFromRing / 10));
      const fs =
        sf *
        (0.8 +
          Math.sin(p.t * CONFIG.pulseSpeed) * 0.2 * CONFIG.particleVariance) *
        CONFIG.particleSize;
      dummy.scale.set(fs, fs, fs);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }
  animate();
});
