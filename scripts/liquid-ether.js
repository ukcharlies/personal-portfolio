(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("antigravity-container");
    if (!container || typeof THREE === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReduced.matches) return;

    const hero = container.closest(".projects-hero") || container.parentElement;
    if (!hero) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: new THREE.Color("#5227ff") },
      uColorB: { value: new THREE.Color("#ff9ffc") },
      uColorC: { value: new THREE.Color("#b19eef") },
      uIntensity: { value: 1.0 },
    };

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform vec2 uMouseVel;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform float uIntensity;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(in vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);

          float a = hash(i + vec2(0.0, 0.0));
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));

          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float val = 0.0;
          float amp = 0.55;
          mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
          for (int i = 0; i < 5; i++) {
            val += amp * noise(p);
            p = rot * p;
            amp *= 0.5;
          }
          return val;
        }

        vec2 flow(vec2 p, float t) {
          float n1 = fbm(p * 2.2 + vec2(t * 0.12, -t * 0.08));
          float n2 = fbm(p * 2.6 + vec2(-t * 0.09, t * 0.1));
          return vec2(n1 - 0.5, n2 - 0.5);
        }

        void main() {
          vec2 uv = vUv;
          vec2 st = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);

          vec2 mouse = (uMouse - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
          float mouseDist = length(st - mouse);
          float mouseField = exp(-mouseDist * 4.6) * (0.4 + length(uMouseVel) * 0.7);

          vec2 warped = st;
          vec2 f = flow(st * 0.95, uTime);
          warped += f * (0.22 + mouseField * 0.22) * uIntensity;

          float nA = fbm(warped * 2.7 + vec2(uTime * 0.09, -uTime * 0.06));
          float nB = fbm(warped * 3.8 + vec2(-uTime * 0.07, uTime * 0.1));
          float nC = fbm((warped + f * 0.35) * 3.2 - vec2(uTime * 0.05));

          float blend1 = smoothstep(0.2, 0.85, nA + mouseField * 0.22);
          float blend2 = smoothstep(0.25, 0.9, nB);
          float blend3 = smoothstep(0.35, 0.95, nC);

          vec3 col = mix(uColorA, uColorB, blend1);
          col = mix(col, uColorC, blend2 * 0.82);
          col += 0.12 * blend3 * uColorB;

          float vignette = smoothstep(1.15, 0.2, length(st * vec2(0.9, 0.75)));
          float alpha = clamp((0.18 + blend1 * 0.52 + blend2 * 0.34 + mouseField * 0.32) * vignette, 0.0, 0.85);

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(plane);

    const mouse = new THREE.Vector2(0.5, 0.5);
    const mouseTarget = new THREE.Vector2(0.5, 0.5);
    const prevMouse = new THREE.Vector2(0.5, 0.5);
    const mouseVel = new THREE.Vector2(0, 0);

    let t0 = performance.now();
    let lastMove = performance.now();
    let frame = null;

    const auto = {
      active: true,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35,
    };

    function setColorsFromTheme() {
      const root = getComputedStyle(document.documentElement);
      uniforms.uColorA.value.set(root.getPropertyValue("--liquid-c1").trim() || "#5227ff");
      uniforms.uColorB.value.set(root.getPropertyValue("--liquid-c2").trim() || "#ff9ffc");
      uniforms.uColorC.value.set(root.getPropertyValue("--liquid-c3").trim() || "#b19eef");
    }

    function updateMouseFromEvent(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouseTarget.set(
        (clientX - rect.left) / rect.width,
        1 - (clientY - rect.top) / rect.height
      );
      mouseTarget.x = Math.max(0, Math.min(1, mouseTarget.x));
      mouseTarget.y = Math.max(0, Math.min(1, mouseTarget.y));
      auto.active = false;
      lastMove = performance.now();
    }

    function onPointerMove(event) {
      updateMouseFromEvent(event.clientX, event.clientY);
    }

    function onTouchMove(event) {
      if (!event.touches.length) return;
      updateMouseFromEvent(event.touches[0].clientX, event.touches[0].clientY);
    }

    function resize() {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    }

    function tick(now) {
      const dt = Math.min(0.04, (now - t0) / 1000);
      t0 = now;

      if (now - lastMove > 2800) {
        auto.active = true;
      }

      if (auto.active) {
        auto.phase += dt * auto.speed;
        mouseTarget.x = 0.5 + Math.sin(auto.phase * 1.2) * 0.22;
        mouseTarget.y = 0.5 + Math.cos(auto.phase * 0.9) * 0.2;
      }

      mouse.lerp(mouseTarget, 0.09);
      mouseVel.subVectors(mouse, prevMouse);
      prevMouse.copy(mouse);

      uniforms.uMouse.value.copy(mouse);
      uniforms.uMouseVel.value.lerp(mouseVel, 0.5);
      uniforms.uTime.value += dt;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    }

    const themeObserver = new MutationObserver(setColorsFromTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    resize();
    setColorsFromTheme();

    hero.addEventListener("mousemove", onPointerMove);
    hero.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", resize);

    frame = requestAnimationFrame(tick);

    window.addEventListener(
      "beforeunload",
      () => {
        if (frame) cancelAnimationFrame(frame);
        hero.removeEventListener("mousemove", onPointerMove);
        hero.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("resize", resize);
        themeObserver.disconnect();
        renderer.dispose();
      },
      { once: true }
    );
  });
})();
