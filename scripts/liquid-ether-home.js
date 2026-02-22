(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("antigravity-container");
    if (!container || typeof THREE === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReduced.matches) return;

    const hero = container.closest(".hero-wrapper") || container.parentElement;
    if (!hero) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
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
      uStrength: { value: 1.15 },
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
        uniform float uStrength;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
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
          float v = 0.0;
          float a = 0.55;
          mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = m * p;
            a *= 0.5;
          }
          return v;
        }

        vec2 flow(vec2 p, float t) {
          float n1 = fbm(p * 2.3 + vec2(t * 0.16, -t * 0.1));
          float n2 = fbm(p * 2.9 + vec2(-t * 0.12, t * 0.14));
          return vec2(n1 - 0.5, n2 - 0.5);
        }

        void main() {
          vec2 uv = vUv;
          vec2 st = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
          vec2 mp = (uMouse - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);

          float dMouse = length(st - mp);
          float impulse = exp(-dMouse * 4.2) * (0.38 + length(uMouseVel) * 0.92);

          vec2 fl = flow(st, uTime);
          vec2 warp = st + fl * (0.28 + impulse * 0.24) * uStrength;

          float n1 = fbm(warp * 2.8 + vec2(uTime * 0.09, -uTime * 0.07));
          float n2 = fbm(warp * 3.9 + vec2(-uTime * 0.08, uTime * 0.11));
          float n3 = fbm((warp + fl * 0.4) * 3.2 - vec2(uTime * 0.05));

          float m1 = smoothstep(0.2, 0.86, n1 + impulse * 0.24);
          float m2 = smoothstep(0.24, 0.92, n2);
          float m3 = smoothstep(0.3, 0.96, n3);

          vec3 col = mix(uColorA, uColorB, m1);
          col = mix(col, uColorC, m2 * 0.85);
          col += uColorB * m3 * 0.14;

          float vign = smoothstep(1.2, 0.22, length(st * vec2(0.86, 0.76)));
          float alpha = clamp((0.2 + m1 * 0.56 + m2 * 0.4 + impulse * 0.34) * vign, 0.0, 0.9);

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const mouse = new THREE.Vector2(0.5, 0.5);
    const mouseTarget = new THREE.Vector2(0.5, 0.5);
    const mousePrev = new THREE.Vector2(0.5, 0.5);
    const mouseVel = new THREE.Vector2(0, 0);

    const auto = {
      active: true,
      phase: Math.random() * Math.PI * 2,
      speed: 0.34,
    };

    let tPrev = performance.now();
    let lastInput = performance.now();
    let raf = null;

    function setThemeColors() {
      const root = getComputedStyle(document.documentElement);
      uniforms.uColorA.value.set(root.getPropertyValue("--liquid-c1").trim() || "#5227ff");
      uniforms.uColorB.value.set(root.getPropertyValue("--liquid-c2").trim() || "#ff9ffc");
      uniforms.uColorC.value.set(root.getPropertyValue("--liquid-c3").trim() || "#b19eef");
    }

    function setPointer(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouseTarget.set(
        (clientX - rect.left) / rect.width,
        1 - (clientY - rect.top) / rect.height
      );
      mouseTarget.x = Math.max(0, Math.min(1, mouseTarget.x));
      mouseTarget.y = Math.max(0, Math.min(1, mouseTarget.y));
      auto.active = false;
      lastInput = performance.now();
    }

    function onMouseMove(e) {
      setPointer(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
      if (!e.touches.length) return;
      setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }

    function onResize() {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    }

    function loop(now) {
      const dt = Math.min(0.04, (now - tPrev) / 1000);
      tPrev = now;

      if (now - lastInput > 2600) auto.active = true;

      if (auto.active) {
        auto.phase += dt * auto.speed;
        mouseTarget.x = 0.5 + Math.sin(auto.phase * 1.08) * 0.23;
        mouseTarget.y = 0.5 + Math.cos(auto.phase * 0.91) * 0.2;
      }

      mouse.lerp(mouseTarget, 0.1);
      mouseVel.subVectors(mouse, mousePrev);
      mousePrev.copy(mouse);

      uniforms.uMouse.value.copy(mouse);
      uniforms.uMouseVel.value.lerp(mouseVel, 0.45);
      uniforms.uTime.value += dt;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }

    const themeObserver = new MutationObserver(setThemeColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    onResize();
    setThemeColors();

    hero.addEventListener("mousemove", onMouseMove);
    hero.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", onResize);

    raf = requestAnimationFrame(loop);

    window.addEventListener(
      "beforeunload",
      () => {
        if (raf) cancelAnimationFrame(raf);
        hero.removeEventListener("mousemove", onMouseMove);
        hero.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("resize", onResize);
        themeObserver.disconnect();
        renderer.dispose();
      },
      { once: true }
    );
  });
})();
