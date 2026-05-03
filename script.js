// ─────────────────────────────────────────
// NOISE BACKGROUND CANVAS
// ─────────────────────────────────────────

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  /** portfolio.html: pure #000 backdrop — skip shader loop entirely (canvas element stays hidden) */
  if (document.body && document.body.classList.contains('portfolio-page')) {
    canvas.style.display = 'none';
    return;
  }

  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y) {
    const h = hash & 3, u = h < 2 ? x : y, v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise2d(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(
      lerp(grad(perm[a],     xf,   yf),   grad(perm[b],     xf-1, yf),   u),
      lerp(grad(perm[a + 1], xf,   yf-1), grad(perm[b + 1], xf-1, yf-1), u),
      v
    );
  }
  function fbm(x, y, octaves) {
    let val = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      val += noise2d(x * freq, y * freq) * amp;
      max += amp; amp *= 0.5; freq *= 2.1;
    }
    return val / max;
  }

  const ctx = canvas.getContext('2d');
  const SCALE = window.matchMedia('(max-width: 768px)').matches ? 2 : 4;
  let W, H;

  function resize() {
    W = Math.ceil(window.innerWidth  / SCALE);
    H = Math.ceil(window.innerHeight / SCALE);
    canvas.width  = W; canvas.height = H;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function noiseToColor(n) {
    const t = Math.max(0, Math.min(1, n * 1.8 + 0.5));
    let r, g, b;
    if (t < 0.3) {
      // deep teal-green zone
      const s = t / 0.3;
      r = Math.round(lerp(170, 200, s)); g = Math.round(lerp(210, 222, s)); b = Math.round(lerp(195, 200, s));
    } else if (t < 0.55) {
      // yellow-green, slightly grey
      const s = (t - 0.3) / 0.25;
      r = Math.round(lerp(200, 220, s)); g = Math.round(lerp(222, 228, s)); b = Math.round(lerp(200, 172, s));
    } else if (t < 0.78) {
      // muted olive-green
      const s = (t - 0.55) / 0.23;
      r = Math.round(lerp(220, 204, s)); g = Math.round(lerp(228, 218, s)); b = Math.round(lerp(172, 150, s));
    } else {
      // warm grey-green highlight
      const s = (t - 0.78) / 0.22;
      r = Math.round(lerp(204, 182, s)); g = Math.round(lerp(218, 208, s)); b = Math.round(lerp(150, 138, s));
    }
    return [r, g, b];
  }

  // Slightly more saturated version for mobile left-side bias
  function noiseToColorMobile(n, xFrac) {
    const boost = Math.max(0, 1 - xFrac * 1.6);
    const t = Math.max(0, Math.min(1, n * 1.8 + 0.5 + boost * 0.12));
    let r, g, b;
    if (t < 0.3) {
      const s = t / 0.3;
      r = Math.round(lerp(158, 195, s)); g = Math.round(lerp(208, 225, s)); b = Math.round(lerp(192, 202, s));
    } else if (t < 0.55) {
      const s = (t - 0.3) / 0.25;
      r = Math.round(lerp(195, 216, s)); g = Math.round(lerp(225, 230, s)); b = Math.round(lerp(202, 168, s));
    } else if (t < 0.78) {
      const s = (t - 0.55) / 0.23;
      r = Math.round(lerp(216, 198, s)); g = Math.round(lerp(230, 220, s)); b = Math.round(lerp(168, 144, s));
    } else {
      const s = (t - 0.78) / 0.22;
      r = Math.round(lerp(198, 175, s)); g = Math.round(lerp(220, 210, s)); b = Math.round(lerp(144, 132, s));
    }
    return [r, g, b];
  }

  // Darker slate / smoke versions of the canvas (portfolio.html) — same structure, lower luminance.
  function noiseToColorPortfolio(n) {
    const t = Math.max(0, Math.min(1, n * 1.82 + 0.44));
    let r; let g; let b;
    if (t < 0.3) {
      const s = t / 0.3;
      r = Math.round(lerp(22, 38, s)); g = Math.round(lerp(34, 58, s)); b = Math.round(lerp(40, 62, s));
    } else if (t < 0.55) {
      const s = (t - 0.3) / 0.25;
      r = Math.round(lerp(38, 72, s)); g = Math.round(lerp(58, 86, s)); b = Math.round(lerp(62, 74, s));
    } else if (t < 0.78) {
      const s = (t - 0.55) / 0.23;
      r = Math.round(lerp(72, 102, s)); g = Math.round(lerp(86, 98, s)); b = Math.round(lerp(74, 64, s));
    } else {
      const s = (t - 0.78) / 0.22;
      r = Math.round(lerp(102, 118, s)); g = Math.round(lerp(98, 108, s)); b = Math.round(lerp(64, 58, s));
    }
    return [r, g, b];
  }

  function noiseToColorPortfolioMobile(n, xFrac) {
    const boost = Math.max(0, 1 - xFrac * 1.6);
    const t = Math.max(0, Math.min(1, n * 1.82 + 0.42 + boost * 0.1));
    let r; let g; let b;
    if (t < 0.3) {
      const s = t / 0.3;
      r = Math.round(lerp(18, 42, s)); g = Math.round(lerp(32, 58, s)); b = Math.round(lerp(36, 62, s));
    } else if (t < 0.55) {
      const s = (t - 0.3) / 0.25;
      r = Math.round(lerp(42, 78, s)); g = Math.round(lerp(58, 94, s)); b = Math.round(lerp(62, 74, s));
    } else if (t < 0.78) {
      const s = (t - 0.55) / 0.23;
      r = Math.round(lerp(78, 108, s)); g = Math.round(lerp(94, 104, s)); b = Math.round(lerp(74, 58, s));
    } else {
      const s = (t - 0.78) / 0.22;
      r = Math.round(lerp(108, 124, s)); g = Math.round(lerp(104, 112, s)); b = Math.round(lerp(58, 52, s));
    }
    return [r, g, b];
  }

  /**
   * Noise palette (matches xyudiw2/script.js before portfolio split):
   * - "legacy-home": teal / olive FBM (original index #bg-canvas) — Substack + homepage mobile menu
   * - "portfolio": dark slate / smoke — portfolio + index marquee when menu closed
   */
  function bgCanvasNoisePalette() {
    const b = document.body;
    if (!b) return 'legacy-home';
    if (b.classList.contains('legacy-home-noise-bg')) return 'legacy-home';
    if (b.classList.contains('site-home') && b.classList.contains('home-menu-open')) return 'legacy-home';
    if (b.classList.contains('portfolio-page')) return 'portfolio';
    if (b.classList.contains('site-home')) return 'portfolio';
    return 'legacy-home';
  }

  const isMobileCanvas = window.matchMedia('(pointer: coarse)').matches;

  /** Substack: match xyudiw2 desktop ramp — skip noiseToColorMobile saturation boost on touch. */
  function pickLegacyHomeRgb(n, xFrac, palette) {
    const b = document.body;
    if (palette === 'legacy-home' && b && b.classList.contains('legacy-home-noise-bg')) {
      return noiseToColor(n);
    }
    return isMobileCanvas ? noiseToColorMobile(n, xFrac) : noiseToColor(n);
  }

  let t = 0;
  function bgLoop() {
    const buf = ctx.createImageData(W, H);
    const data = buf.data;
    const zoom = isMobileCanvas ? 0.006 : 0.0035, speed = 0.00038;
    const palette = bgCanvasNoisePalette();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = x * zoom; const ny = y * zoom;
        const wx = fbm(nx + 0.0, ny + 0.0, 4) * 1.6;
        const wy = fbm(nx + 5.2, ny + 1.3, 4) * 1.6;
        const n  = fbm(nx + wx + t * 0.7, ny + wy + t * 0.45, 4);
        const xFrac = x / W;
        const [r, g, b] =
          palette === 'portfolio'
            ? (isMobileCanvas ? noiseToColorPortfolioMobile(n, xFrac) : noiseToColorPortfolio(n))
            : pickLegacyHomeRgb(n, xFrac, palette);
        const i = (y * W + x) * 4;
        data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
      }
    }
    ctx.putImageData(buf, 0, 0);
    t += speed;
    requestAnimationFrame(bgLoop);
  }
  bgLoop();
})();


// ─────────────────────────────────────────
// ORGANIC CREATURE OVERLAY (index only)
// ─────────────────────────────────────────

(function () {
  const canvas = document.getElementById('creature-canvas');
  if (!canvas) return;

  const p2 = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p2[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p2[i], p2[j]] = [p2[j], p2[i]];
  }
  const perm2 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm2[i] = p2[i & 255];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y) {
    const h = hash & 3, u = h < 2 ? x : y, v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise2d(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const a = perm2[X] + Y, b = perm2[X + 1] + Y;
    return lerp(
      lerp(grad(perm2[a],     xf,   yf),   grad(perm2[b],     xf-1, yf),   u),
      lerp(grad(perm2[a + 1], xf,   yf-1), grad(perm2[b + 1], xf-1, yf-1), u),
      v
    );
  }

  const ctx = canvas.getContext('2d');
  const CREATURE_SCALE = 2;

  // screenW/screenH always hold the actual CSS pixel dimensions
  let screenW = window.innerWidth;
  let screenH = window.innerHeight;

  function resize() {
    screenW = window.innerWidth;
    screenH = window.innerHeight;
    canvas.width  = Math.ceil(screenW / CREATURE_SCALE);
    canvas.height = Math.ceil(screenH / CREATURE_SCALE);
    canvas.style.width  = screenW + 'px';
    canvas.style.height = screenH + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  const creatures = [];
  const MAX_CREATURES = 4;

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  function createBlob() {
    // spawn coords in screen pixels, then scale down for canvas drawing
    const sx = randomBetween(screenW * 0.3,  screenW * 0.92);
    const sy = randomBetween(screenH * 0.15, screenH * 0.85);
    return {
      type: 'blob',
      x: sx / CREATURE_SCALE,
      y: sy / CREATURE_SCALE,
      baseR: randomBetween(40, 110) / CREATURE_SCALE,
      seed: Math.random() * 100,
      harmonics: Math.floor(randomBetween(3, 7)),
      phase: 'emerging', opacity: 0, age: 0,
      lifeDuration: randomBetween(6000, 12000),
      fadeInTime: 1800, fadeOutTime: 2400, t: 0,
    };
  }

  function createTendril() {
    const sx = randomBetween(screenW * 0.25, screenW * 0.9);
    const sy = randomBetween(screenH * 0.15, screenH * 0.85);
    const x  = sx / CREATURE_SCALE;
    const y  = sy / CREATURE_SCALE;
    const angle     = randomBetween(0, Math.PI * 2);
    const segments  = Math.floor(randomBetween(18, 45));
    const segLen    = randomBetween(8, 18) / CREATURE_SCALE;
    const noiseSeed = Math.random() * 50;

    const pts = [{ x, y }];
    let cx = x, cy = y, ca = angle;
    for (let i = 0; i < segments; i++) {
      const turn = noise2d(cx * 0.012 + noiseSeed, cy * 0.012) * 1.1;
      ca += turn;
      cx += Math.cos(ca) * segLen;
      cy += Math.sin(ca) * segLen;
      pts.push({ x: cx, y: cy });
    }

    const branches = [];
    const numBranches = Math.floor(randomBetween(0, 3));
    for (let b = 0; b < numBranches; b++) {
      const startIdx = Math.floor(randomBetween(3, segments - 5));
      const bPts = [pts[startIdx]];
      let bx = pts[startIdx].x, by = pts[startIdx].y;
      let ba = ca + randomBetween(-1.2, 1.2);
      const bSegs = Math.floor(randomBetween(6, 18));
      const bSeed = Math.random() * 50;
      for (let i = 0; i < bSegs; i++) {
        const turn = noise2d(bx * 0.014 + bSeed, by * 0.014) * 0.9;
        ba += turn;
        bx += Math.cos(ba) * segLen * 0.7;
        by += Math.sin(ba) * segLen * 0.7;
        bPts.push({ x: bx, y: by });
      }
      branches.push(bPts);
    }

    return {
      type: 'tendril', pts, branches,
      phase: 'emerging', opacity: 0, age: 0,
      lifeDuration: randomBetween(7000, 13000),
      fadeInTime: 2000, fadeOutTime: 2800,
      drawProgress: 0,
    };
  }

  function spawnCreature() {
    creatures.push(Math.random() > 0.4 ? createTendril() : createBlob());
  }

  function drawBlob(c) {
    ctx.save();
    ctx.globalAlpha = c.opacity;
    ctx.strokeStyle = 'rgba(199, 255, 116, 0.36)';
    ctx.lineWidth   = 0.8;
    const pts = 64, twoPi = Math.PI * 2;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const angle = (i / pts) * twoPi;
      let r = c.baseR;
      for (let h = 1; h <= c.harmonics; h++) {
        const amp   = c.baseR * (0.18 / h);
        const phase = noise2d(h * 3.7 + c.seed, h * 1.3) * twoPi;
        r += amp * Math.sin(h * angle + phase + c.t * (h % 2 === 0 ? 1 : -0.7));
      }
      const px = c.x + Math.cos(angle) * r;
      const py = c.y + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const angle = (i / pts) * twoPi;
      let r = c.baseR * 0.55;
      for (let h = 1; h <= c.harmonics; h++) {
        const amp   = c.baseR * (0.1 / h);
        const phase = noise2d(h * 2.1 + c.seed + 10, h * 4.4) * twoPi;
        r += amp * Math.sin(h * angle + phase - c.t * (h % 2 === 0 ? 0.8 : -0.5));
      }
      const px = c.x + Math.cos(angle) * r;
      const py = c.y + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawTendril(c) {
    ctx.save();
    ctx.globalAlpha = c.opacity;
    ctx.strokeStyle = 'rgb(210, 255, 146)';
    ctx.lineWidth   = 1;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    const visiblePts = Math.max(2, Math.floor(c.drawProgress * c.pts.length));

    function drawPath(pts, maxPts) {
      if (pts.length < 2) return;
      const vp = Math.min(maxPts, pts.length);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < vp; i++) {
        const mx = (pts[i-1].x + pts[i].x) / 2;
        const my = (pts[i-1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mx, my);
      }
      ctx.stroke();
    }

    drawPath(c.pts, visiblePts);
    for (const branch of c.branches) {
      drawPath(branch, Math.floor(c.drawProgress * branch.length));
    }
    if (visiblePts >= 2) {
      const tip = c.pts[visiblePts - 1];
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 255, 146, ${c.opacity * 0.5})`;
      ctx.fill();
    }
    ctx.restore();
  }

  let lastTime   = performance.now();
  let spawnTimer = randomBetween(500, 1500);

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spawnTimer -= dt;
    if (spawnTimer <= 0 && creatures.length < MAX_CREATURES) {
      spawnCreature();
      spawnTimer = randomBetween(4000, 9000);
    }

    for (let i = creatures.length - 1; i >= 0; i--) {
      const c = creatures[i];
      c.age += dt;
      if (c.phase === 'emerging') {
        c.opacity = Math.min(1, c.age / c.fadeInTime);
        if (c.type === 'tendril') c.drawProgress = Math.min(1, c.age / (c.fadeInTime * 1.4));
        if (c.age >= c.fadeInTime) c.phase = 'alive';
      }
      if (c.phase === 'alive') {
        c.opacity = 1;
        if (c.type === 'tendril') c.drawProgress = 1;
        if (c.age >= c.fadeInTime + c.lifeDuration) c.phase = 'fading';
      }
      if (c.phase === 'fading') {
        const fadeAge = c.age - c.fadeInTime - c.lifeDuration;
        c.opacity = Math.max(0, 1 - fadeAge / c.fadeOutTime);
        if (c.opacity <= 0) { creatures.splice(i, 1); continue; }
      }
      if (c.type === 'blob') c.t += 0.012;
      if (c.type === 'blob')    drawBlob(c);
      if (c.type === 'tendril') drawTendril(c);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();


// ─────────────────────────────────────────
// SLIDING PANEL — home index fullscreen mobile nav
// ─────────────────────────────────────────

(function () {
  const trigger = document.getElementById('homeNavTrigger');
  const content = document.getElementById('homeNavPanelContent');
  const mqDesktop = window.matchMedia('(min-width: 1024px)');
  const siteHome = document.body.classList.contains('site-home');
  const navUnified = document.body.classList.contains('nav-unified');
  const unifiedMenuPage = siteHome || navUnified;

  function closeHomeMenu() {
    document.body.classList.remove('home-menu-open');
    if (trigger) {
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    if (content && unifiedMenuPage && !mqDesktop.matches) {
      content.style.maxHeight = '0px';
    }
  }

  function openHomeMenu() {
    document.body.classList.add('home-menu-open');
    if (trigger) {
      trigger.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    if (content && unifiedMenuPage) {
      content.style.maxHeight = 'none';
    }
  }

  function onDesktopChange() {
    if (mqDesktop.matches) {
      closeHomeMenu();
      if (content) content.style.removeProperty('max-height');
    }
  }

  if (trigger && content && unifiedMenuPage) {
    mqDesktop.addEventListener('change', onDesktopChange);
    onDesktopChange();

    trigger.addEventListener('click', () => {
      if (siteHome && document.body.hasAttribute('data-world')) return;
      if (mqDesktop.matches) return;

      const isOpen = document.body.classList.contains('home-menu-open');
      if (isOpen) {
        closeHomeMenu();
      } else {
        openHomeMenu();
      }
    });
  }

  const closeMob = document.getElementById('homeMenuCloseMobile');
  if (closeMob && content) {
    closeMob.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeHomeMenu();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (
      unifiedMenuPage &&
      e.key === 'Escape' &&
      document.body.classList.contains('home-menu-open') &&
      !(siteHome && document.body.hasAttribute('data-world'))
    ) {
      closeHomeMenu();
    }
  });

  /** Expose so world engine / about Home can tear down menu on any unified mobile nav page */
  window._closeHomeMobileMenu = function () {
    if (unifiedMenuPage && document.body.classList.contains('home-menu-open')) closeHomeMenu();
  };
})();


// ─────────────────────────────────────────
// DIALOG: SOBRE
// ─────────────────────────────────────────

const sobreDialog = document.getElementById('sobreDialog');
const btnS        = document.querySelector('.btnS');
const btnClose    = document.querySelector('.btnClose');

if (btnS && sobreDialog) {
  btnS.addEventListener('click', () => sobreDialog.showModal());
}
if (btnClose && sobreDialog) {
  btnClose.addEventListener('click', (e) => {
    e.stopPropagation();
    sobreDialog.close();
  });
}
if (sobreDialog) {
  sobreDialog.addEventListener('click', (e) => {
    const rect = sobreDialog.getBoundingClientRect();
    const outside = e.clientX < rect.left || e.clientX > rect.right ||
                    e.clientY < rect.top  || e.clientY > rect.bottom;
    if (outside) sobreDialog.close();
  });
}


// ─────────────────────────────────────────
// DIALOG: CONTATO
// ─────────────────────────────────────────

const contatoDialog = document.getElementById('contatoDialog');
const btnClose2     = document.querySelector('.btnClose2');

if (contatoDialog) {
  document.querySelectorAll('.btnC').forEach((btnC) => {
    btnC.addEventListener('click', () => contatoDialog.showModal());
  });
}
if (btnClose2 && contatoDialog) {
  btnClose2.addEventListener('click', (e) => {
    e.stopPropagation();
    contatoDialog.close();
  });
}
if (contatoDialog) {
  contatoDialog.addEventListener('click', (e) => {
    const rect = contatoDialog.getBoundingClientRect();
    const outside = e.clientX < rect.left || e.clientX > rect.right ||
                    e.clientY < rect.top  || e.clientY > rect.bottom;
    if (outside) contatoDialog.close();
  });
}


// ─────────────────────────────────────────
// EMBED DIALOG (portfolio page)
// ─────────────────────────────────────────

const embedDialog = document.getElementById('embedDialog');
const embedFrame  = document.getElementById('embedFrame');
const embedClose  = document.querySelector('.embed-close');
const projectBtns = document.querySelectorAll('.project-btn');

// Only run old handler if this is NOT the new portfolio page
// (new portfolio has data-type="multi-vimeo" or "audio" entries)
const hasNewPortfolio = !!document.querySelector('[data-type="multi-vimeo"], [data-type="audio"]');

if (embedDialog && embedFrame && !hasNewPortfolio) {

  const embedTitle = embedDialog.querySelector('.embed-title');
  const embedDesc  = embedDialog.querySelector('.embed-desc');

  projectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const url     = btn.dataset.url;
      const type    = btn.dataset.type;
      const wrapper = embedDialog.querySelector('.embed-wrapper');
      wrapper.classList.toggle('is-soundcloud', type === 'soundcloud');
      if (embedTitle) embedTitle.textContent = btn.dataset.title || '';
      if (embedDesc)  embedDesc.textContent  = btn.dataset.desc  || '';
      embedFrame.src = url;
      embedDialog.showModal();
    });
  });

  embedClose.addEventListener('click', (e) => {
    e.stopPropagation();
    embedFrame.src = '';
    embedDialog.close();
  });

  embedDialog.addEventListener('click', (e) => {
    const rect = embedDialog.getBoundingClientRect();
    const outside = e.clientX < rect.left || e.clientX > rect.right ||
                    e.clientY < rect.top  || e.clientY > rect.bottom;
    if (outside) {
      embedFrame.src = '';
      embedDialog.close();
    }
  });
}

// ─────────────────────────────────────────
// DRAGGABLE DIALOGS (desktop only)
// ─────────────────────────────────────────

function makeDraggable(dialog) {
  if (!dialog) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  dialog.addEventListener('mousedown', (e) => {
    // don't drag if clicking a button or link inside
    if (e.target.closest('button, a, iframe')) return;

    isDragging = true;
    const rect = dialog.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    dialog.style.margin = '0';
    dialog.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dialog.style.left = (e.clientX - offsetX) + 'px';
    dialog.style.top  = (e.clientY - offsetY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    dialog.style.cursor = 'grab';
  });

  // reset position when closed so next open is centered
  dialog.addEventListener('close', () => {
    dialog.style.left   = '';
    dialog.style.top    = '';
    dialog.style.margin = '';
    dialog.style.cursor = '';
  });
}

makeDraggable(document.getElementById('sobreDialog'));
makeDraggable(document.getElementById('contatoDialog'));
makeDraggable(document.getElementById('embedDialog'));


// ─────────────────────────────────────────
// WORLD ENGINE — 3 animated canvas worlds
// triggered by the play button
// ─────────────────────────────────────────

(function () {

  // ── DOM refs ──────────────────────────
  const worldCanvas   = document.getElementById('world-canvas');
  const cinemaVeil    = document.getElementById('cinema-veil');
  const playBtn       = document.getElementById('play-btn');
  const playLabel     = document.getElementById('play-label');
  const playIcon      = document.getElementById('play-icon');
  const worldControls = document.getElementById('world-controls');
  const worldNameEl   = document.getElementById('world-name');
  const prevBtn       = document.getElementById('prev-world');
  const nextBtn       = document.getElementById('next-world');
  const siteTitle     = document.querySelector('.site-title');
  const siteSubtitle = document.querySelector('#homeCornerSubtitles');
  const playLabelIdle = playLabel && playLabel.textContent.trim()
    ? playLabel.textContent.trim()
    : 'ecossistemas sonoros';
  const navItems     = document.querySelectorAll('.nav-item, .nav-links a');
  const panelTrigger = document.querySelector('.panel-trigger');
  let isCinematic = false;

  // Override hover in JS so cinematic mode can control it
  if (panelTrigger) {
    panelTrigger.addEventListener('mouseenter', () => {
      if (document.body.hasAttribute('data-world')) return;
      if (isCinematic) {
        panelTrigger.style.backgroundColor = 'rgba(255,255,255,0.15)';
        panelTrigger.style.color = '#f5f5f0';
      }
    });
    panelTrigger.addEventListener('mouseleave', () => {
      if (document.body.hasAttribute('data-world')) return;
      if (isCinematic) {
        panelTrigger.style.backgroundColor = '#0a0a0a';
        panelTrigger.style.color = '#d8d8d0';
      }
    });
  }

  if (!worldCanvas || !playBtn) return;

  const ctx = worldCanvas.getContext('2d');
  let W, H;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    worldCanvas.width  = W;
    worldCanvas.height = H;
    worldCanvas.style.width  = W + 'px';
    worldCanvas.style.height = H + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Worlds config ─────────────────────
  const WORLD_NAMES = ['ecossistema 1', 'ecossistema 2', 'ecossistema 3', 'ecossistema 4'];
  const AUDIO_SRCS  = [
    'resources/audio/01_watery.wav',
    'resources/audio/02_abstract.wav',
    'resources/audio/03_palaeolithic.wav',
    'resources/audio/04_digital_jungle.wav',
  ];

  // ── State ─────────────────────────────
  let activeWorld = -1;
  let isPlaying   = false;
  let audioEl     = null;
  let animFrame   = null;
  let worldT      = 0;

  // ── Noise helpers ─────────────────────
  const _p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) _p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [_p[i], _p[j]] = [_p[j], _p[i]];
  }
  const _perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) _perm[i] = _p[i & 255];

  function _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function _lerp(a, b, t) { return a + t * (b - a); }
  function _grad(hash, x, y) {
    const h = hash & 3, u = h < 2 ? x : y, v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function snoise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = _fade(xf), v = _fade(yf);
    const a = _perm[X] + Y, b = _perm[X + 1] + Y;
    return _lerp(
      _lerp(_grad(_perm[a],     xf,   yf),   _grad(_perm[b],     xf-1, yf),   u),
      _lerp(_grad(_perm[a + 1], xf,   yf-1), _grad(_perm[b + 1], xf-1, yf-1), u),
      v
    );
  }
  function fbm(x, y, oct) {
    let v = 0, amp = 0.5, f = 1, mx = 0;
    for (let i = 0; i < oct; i++) {
      v += snoise(x * f, y * f) * amp;
      mx += amp; amp *= 0.5; f *= 2.1;
    }
    return v / mx;
  }

  // ═══════════════════════════════════════
  // WORLD 0 — OCEANO
  // ═══════════════════════════════════════

  const ocean = (() => {
    const entities = [];
    let lastJellySpawn = 0;
    let lastAngelSpawn = 0;

    // Slow camera drift — gives impression of travelling through the scene
    const camSeedX = Math.random() * 100;
    const camSeedY = Math.random() * 100;

    // Fine grain noise dots — static ambient, mostly dim
    const grainDots = Array.from({ length: 60 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      wx: (Math.random() - 0.5) * 0.00005,
      wy: (Math.random() - 0.5) * 0.00003,
      r: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0004 + Math.random() * 0.001,
      kind: i % 8 === 0 ? 'bright' : i % 4 === 0 ? 'blue' : 'dim',
    }));

    // ── 3-layer depth particles ──────────
    // FRONT: fewer, hard white, speed variation for contrast
    const frontParticles = Array.from({ length: 100 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      // deliberate speed contrast — 40% are noticeably faster
      speed: i % 5 < 2
        ? 0.00028 + Math.random() * 0.00022   // fast group
        : 0.00010 + Math.random() * 0.00012,  // slower group
      r: 0.15 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.00002,
      alpha: 0.6 + Math.random() * 0.4,
    }));

    // MID: more frequent, soft blur feel
    const midParticles = Array.from({ length: 160 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.00007 + Math.random() * 0.00012,
      r: 0.8 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.000018,
      alpha: 0.22 + Math.random() * 0.28,
      isBlue: Math.random() < 0.35,
    }));

    // BACK: more frequent, larger, bluer, distant
    const backParticles = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.000025 + Math.random() * 0.00006,
      r: 1.2 + Math.random() * 2.0,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.000012,
      alpha: 0.1 + Math.random() * 0.18,
    }));

    // ── Realistic jellyfish ──────────────
    function spawnJellyfish() {
      const roll = Math.random();
      const hue = roll < 0.38
        ? 185 + Math.random() * 20   // electric cyan-blue (image 3)
        : roll < 0.72
        ? 270 + Math.random() * 35   // blue-violet
        : 310 + Math.random() * 35;  // pink-magenta
      entities.push({
        type: 'jelly',
        x: 0.08 + Math.random() * 0.84,
        y: 0.55 + Math.random() * 0.5,
        velY: -(0.00004 + Math.random() * 0.00005),
        driftX: (Math.random() - 0.5) * 0.000015,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.0012 + Math.random() * 0.0008,
        pulsePhase2: Math.random() * Math.PI * 2,   // secondary bell harmonic
        pulseSpeed2: 0.0007 + Math.random() * 0.0005,
        r: 0.009 + Math.random() * 0.010,
        opacity: 0,
        age: 0,
        life: 22000 + Math.random() * 14000,
        hue,
        // Each jellyfish has unique tentacle seeds
        tentacleSeeds: Array.from({ length: 12 }, () => ({
          phase: Math.random() * Math.PI * 2,
          amp: 0.3 + Math.random() * 0.5,
          freq: 0.6 + Math.random() * 0.8,
          speed: 0.0008 + Math.random() * 0.0016,   // independent time rate
          t: Math.random() * Math.PI * 2,            // own running time
        })),
      });
    }

    function drawJellyfish(e, cW, cH, t) {
      const x  = e.x * cW;
      const y  = e.y * cH;
      const scaleFactor = Math.max(1, 900 / Math.min(cW, cH));
      const r  = e.r * Math.min(cW, cH) * scaleFactor;
      const pulse  = 1 + Math.sin(e.pulsePhase) * 0.05 + Math.sin(e.pulsePhase2) * 0.025;
      const pulseH = 1 + Math.sin(e.pulsePhase2 * 1.3) * 0.03 - Math.sin(e.pulsePhase) * 0.02;
      const rw = r * pulse;
      const rh = r * 0.68 * pulseH;

      ctx.save();
      ctx.globalAlpha = e.opacity;

      // ── Far outer atmospheric halo — soft fade at edges ──
      const halo = ctx.createRadialGradient(x, y - rh * 0.1, 0, x, y, rw * 3.2);
      halo.addColorStop(0,   `hsla(${e.hue},90%,65%,0.14)`);
      halo.addColorStop(0.4, `hsla(${e.hue},85%,55%,0.07)`);
      halo.addColorStop(0.75,`hsla(${e.hue},75%,45%,0.02)`);
      halo.addColorStop(1,   `hsla(${e.hue},70%,35%,0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(x, y, rw * 3.2, rh * 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Mid glow ring — gradual fade ────
      const midGlow = ctx.createRadialGradient(x, y - rh * 0.2, rw * 0.1, x, y, rw * 1.8);
      midGlow.addColorStop(0,   `hsla(${e.hue},100%,80%,0.22)`);
      midGlow.addColorStop(0.5, `hsla(${e.hue},90%,60%,0.1)`);
      midGlow.addColorStop(0.85,`hsla(${e.hue},80%,45%,0.03)`);
      midGlow.addColorStop(1,   `hsla(${e.hue},70%,35%,0)`);
      ctx.fillStyle = midGlow;
      ctx.beginPath();
      ctx.ellipse(x, y, rw * 1.8, rh * 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Bell dome — noisy organic shape, NO stroke ─
      ctx.save();
      ctx.beginPath();
      // Build bell with per-point noise jitter instead of perfect ellipse
      const bellPts = 48;
      for (let i = 0; i <= bellPts; i++) {
        const angle = Math.PI + (i / bellPts) * Math.PI;
        const jitter = 1 + snoise(Math.cos(angle) * 2.3 + e.pulsePhase * 0.3, Math.sin(angle) * 2.3) * 0.06;
        const px2 = x + Math.cos(angle) * rw * jitter;
        const py2 = y + Math.sin(angle) * rh * jitter;
        i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
      }
      ctx.closePath();
      ctx.clip();

      // Hot bright core emanating from top-center of bell
      const bellCore = ctx.createRadialGradient(x, y - rh * 0.55, 0, x, y - rh * 0.1, rw * 1.1);
      bellCore.addColorStop(0,   `hsla(${e.hue - 10},100%,97%,0.55)`);
      bellCore.addColorStop(0.15,`hsla(${e.hue},100%,85%,0.38)`);
      bellCore.addColorStop(0.4, `hsla(${e.hue + 10},95%,65%,0.22)`);
      bellCore.addColorStop(0.75,`hsla(${e.hue + 20},85%,40%,0.08)`);
      bellCore.addColorStop(1,   `hsla(${e.hue + 30},70%,20%,0)`);
      ctx.fillStyle = bellCore;
      ctx.fillRect(x - rw * 1.2, y - rh * 1.2, rw * 2.4, rh * 2.4);

      // Soft edge brightening — rim light effect
      const rimLight = ctx.createRadialGradient(x, y, rw * 0.5, x, y, rw * 1.05);
      rimLight.addColorStop(0,   'rgba(0,0,0,0)');
      rimLight.addColorStop(0.8, 'rgba(0,0,0,0)');
      rimLight.addColorStop(1,   `hsla(${e.hue},100%,90%,0.18)`);
      ctx.fillStyle = rimLight;
      ctx.fillRect(x - rw * 1.2, y - rh * 1.2, rw * 2.4, rh * 2.4);

      // ── Warm glassy rim — transparent center, warm yellow-grey at edges ──
      ctx.save();
      ctx.globalAlpha = e.opacity;
      const glassRim = ctx.createRadialGradient(x, y - rh * 0.2, rw * 0.45, x, y, rw * 1.05);
      glassRim.addColorStop(0,    'rgba(0,0,0,0)');
      glassRim.addColorStop(0.72, 'rgba(0,0,0,0)');
      glassRim.addColorStop(0.88, 'rgba(195,185,140,0.25)');
      glassRim.addColorStop(1,    'rgba(210,200,155,0.5)');
      ctx.fillStyle = glassRim;
      ctx.beginPath();
      for (let i = 0; i <= bellPts; i++) {
        const angle = Math.PI + (i / bellPts) * Math.PI;
        const px2 = x + Math.cos(angle) * rw;
        const py2 = y + Math.sin(angle) * rh;
        i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore(); // end clip

      // ── Iridescent shimmer on bell rim — outside clip so full ellipse is visible ──
      ctx.save();
      ctx.globalAlpha = e.opacity;
      const iridHue = (e.hue + t * 25) % 360;
      const iridHue2 = (iridHue + 80) % 360;
      const iridHue3 = (iridHue + 160) % 360;
      const iridShimmer = ctx.createRadialGradient(x, y, rw * 0.55, x, y, rw * 1.1);
      iridShimmer.addColorStop(0,    'rgba(0,0,0,0)');
      iridShimmer.addColorStop(0.7,  'rgba(0,0,0,0)');
      iridShimmer.addColorStop(0.82, `hsla(${iridHue},100%,75%,0.22)`);
      iridShimmer.addColorStop(0.91, `hsla(${iridHue2},100%,80%,0.28)`);
      iridShimmer.addColorStop(1,    `hsla(${iridHue3},100%,85%,0.12)`);
      ctx.fillStyle = iridShimmer;
      ctx.beginPath();
      ctx.ellipse(x, y, rw * 1.1, rh * 1.1, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── Radial ribs — glowing lines, no hard edge ─
      ctx.save();
      ctx.globalAlpha = e.opacity * 0.4;
      const numRibs = 10;
      for (let i = 0; i < numRibs; i++) {
        const angle = Math.PI + (i / (numRibs - 1)) * Math.PI;
        const ribGrad = ctx.createLinearGradient(x, y, x + Math.cos(angle) * rw, y + Math.sin(angle) * rh);
        ribGrad.addColorStop(0,   `hsla(${e.hue},100%,95%,0.7)`);
        ribGrad.addColorStop(1,   `hsla(${e.hue},80%,70%,0)`);
        ctx.strokeStyle = ribGrad;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * rw * 0.94, y + Math.sin(angle) * rh * 0.94);
        ctx.stroke();
      }

      // ── Concentric glowing rings inside bell ─
      const numRings = 5;
      for (let ri = 1; ri <= numRings; ri++) {
        const frac   = ri / (numRings + 1);
        const ringR  = rw * frac;
        const ringH  = rh * frac;
        // Rings pulse slightly offset from main pulse
        const rpulse = 1 + Math.sin(e.pulsePhase * 1.3 + ri * 0.6) * 0.08;
        const ringAlpha = (1 - frac) * 0.55 * e.opacity; // inner rings brighter
        ctx.save();
        ctx.globalAlpha = ringAlpha;
        // Use clip to keep rings inside bell dome only
        ctx.beginPath();
        ctx.ellipse(x, y, rw * 1.02, rh * 1.02, 0, Math.PI, 0);
        ctx.closePath();
        ctx.clip();
        ctx.strokeStyle = `hsla(${e.hue - 15},100%,92%,0.9)`;
        ctx.lineWidth   = 0.6;
        ctx.beginPath();
        ctx.ellipse(x, y, ringR * rpulse, ringH * rpulse, 0, Math.PI, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // ── Oral arms below bell ─────────────
      ctx.save();
      const numArms = 4;
      for (let i = 0; i < numArms; i++) {
        const ax      = x + (i / (numArms - 1) - 0.5) * rw * 1.1;
        // Each arm has its own sway speed and offset
        const armTime = e.pulsePhase * (0.9 + i * 0.15) + i * 1.1 + e.pulsePhase2 * 0.6;
        const armSway = Math.sin(armTime) * rw * 0.28;
        const armGrad = ctx.createLinearGradient(ax, y, ax + armSway * 0.7, y + rh * 1.5);
        armGrad.addColorStop(0, `hsla(${e.hue},95%,82%,0.5)`);
        armGrad.addColorStop(1, `hsla(${e.hue},80%,60%,0)`);
        ctx.strokeStyle = armGrad;
        ctx.lineWidth   = 1.0;
        ctx.globalAlpha = e.opacity * 0.55;
        ctx.beginPath();
        ctx.moveTo(ax, y);
        ctx.bezierCurveTo(
          ax + armSway * 0.5, y + rh * 0.5,
          ax + armSway,       y + rh * 1.0,
          ax + armSway * 0.7, y + rh * 1.55
        );
        ctx.stroke();
      }
      ctx.restore();

      // ── Long hair-thin trailing tentacles ─
      ctx.save();
      const numTent = 14;
      for (let i = 0; i < numTent; i++) {
        const seed    = e.tentacleSeeds[Math.min(i, e.tentacleSeeds.length - 1)];
        const tx0     = x + (i / (numTent - 1) - 0.5) * rw * 1.7;
        const tentLen = rh * (3.8 + seed.amp * 3.2);

        // Base hue tentacle
        const tentGrad = ctx.createLinearGradient(tx0, y, tx0, y + tentLen);
        tentGrad.addColorStop(0,   `hsla(${e.hue},90%,88%,0.35)`);
        tentGrad.addColorStop(0.5, `hsla(${e.hue},80%,75%,0.18)`);
        tentGrad.addColorStop(1,   `hsla(${e.hue},70%,60%,0)`);

        // Warm yellow-grey rim stroke on tentacles
        const tentWarm = ctx.createLinearGradient(tx0, y, tx0, y + tentLen);
        tentWarm.addColorStop(0,   'rgba(210,200,155,0.32)');
        tentWarm.addColorStop(0.4, 'rgba(195,185,140,0.15)');
        tentWarm.addColorStop(1,   'rgba(180,170,120,0)');

        // Each tentacle runs on its own time — fully independent movement
        const tentPhase = seed.t;

        ctx.lineWidth   = 0.35;
        ctx.globalAlpha = e.opacity * 0.5;

        // Draw path once, reuse for both strokes
        ctx.beginPath();
        ctx.moveTo(tx0, y);
        let cx1 = tx0, cy1 = y;
        const segs = 14;
        const wavePoints = [];
        for (let s = 1; s <= segs; s++) {
          const tFrac = s / segs;
          const wave  = Math.sin(tentPhase * seed.freq + s * 0.9 + seed.phase) * rw * seed.amp * tFrac;
          const nx    = tx0 + wave;
          const ny    = y + tFrac * tentLen;
          ctx.bezierCurveTo(cx1 + wave * 0.3, cy1 + tentLen / segs * 0.5, nx, ny - tentLen / segs * 0.3, nx, ny);
          wavePoints.push({ cx1: cx1 + wave * 0.3, cy1: cy1 + tentLen / segs * 0.5, nx, ny, wnx: nx, wny: ny - tentLen / segs * 0.3 });
          cx1 = nx; cy1 = ny;
        }
        ctx.strokeStyle = tentGrad;
        ctx.stroke();

        // Warm overlay stroke — slightly thicker
        ctx.beginPath();
        ctx.moveTo(tx0, y);
        cx1 = tx0; cy1 = y;
        for (let s = 1; s <= segs; s++) {
          const tFrac = s / segs;
          const wave  = Math.sin(tentPhase * seed.freq + s * 0.9 + seed.phase) * rw * seed.amp * tFrac;
          const nx    = tx0 + wave;
          const ny    = y + tFrac * tentLen;
          ctx.bezierCurveTo(cx1 + wave * 0.3, cy1 + tentLen / segs * 0.5, nx, ny - tentLen / segs * 0.3, nx, ny);
          cx1 = nx; cy1 = ny;
        }
        ctx.strokeStyle = tentWarm;
        ctx.lineWidth   = 0.55;
        ctx.globalAlpha = e.opacity * 0.4;
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();
    }

    // ── Sea angel (pteropod) ─────────────
    // Translucent body, 2 wide "wings", glowing visceral core
    function spawnSeaAngel() {
      entities.push({
        type: 'angel',
        x: 0.15 + Math.random() * 0.7,
        y: 0.5 + Math.random() * 0.45,
        velY: -(0.00003 + Math.random() * 0.00003),
        driftX: (Math.random() - 0.5) * 0.000018,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.0018 + Math.random() * 0.001,
        scale: 0.005 + Math.random() * 0.005,
        opacity: 0,
        age: 0,
        life: 18000 + Math.random() * 12000,
      });
    }

    function drawSeaAngel(e, cW, cH) {
      const x  = e.x * cW;
      const y  = e.y * cH;
      const scaleFactor = Math.max(1, 900 / Math.min(cW, cH));
      const s  = e.scale * Math.min(cW, cH) * scaleFactor;
      const wf = Math.sin(e.wingPhase);

      ctx.save();
      ctx.globalAlpha = e.opacity;

      // ── Outer halo — soft fade ───────────
      const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, s * 3.0);
      outerGlow.addColorStop(0,   'rgba(40,140,130,0.1)');
      outerGlow.addColorStop(0.5, 'rgba(20,90,80,0.04)');
      outerGlow.addColorStop(0.85,'rgba(10,60,55,0.01)');
      outerGlow.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 3.0, s * 3.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Body — noisy teardrop clip ───────
      ctx.save();
      ctx.beginPath();
      // Teardrop with noise jitter on each point
      const bPts = 32;
      for (let i = 0; i <= bPts; i++) {
        const frac  = i / bPts;
        const angle = frac * Math.PI * 2;
        // Teardrop base shape
        const baseX = Math.sin(angle) * s * (0.75 - frac * 0.1);
        const baseY = -Math.cos(angle) * s * 1.75 + s * 0.1;
        // Noise jitter
        const jit = snoise(Math.cos(angle) * 1.8 + e.wingPhase * 0.2, Math.sin(angle) * 1.8) * s * 0.07;
        const px2 = x + baseX + jit;
        const py2 = y + baseY;
        i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
      }
      ctx.closePath();
      ctx.clip();

      // Body fill — translucent teal-icy
      const bodyFill = ctx.createRadialGradient(x, y, 0, x, y, s * 2);
      bodyFill.addColorStop(0,   'rgba(180,230,225,0.2)');
      bodyFill.addColorStop(0.5, 'rgba(100,180,170,0.1)');
      bodyFill.addColorStop(1,   'rgba(40,110,100,0)');
      ctx.fillStyle = bodyFill;
      ctx.fillRect(x - s * 2, y - s * 2, s * 4, s * 4);

      // Teal-green visceral core (replacing the orange-red)
      const coreG = ctx.createRadialGradient(x, y - s * 0.2, 0, x, y - s * 0.1, s * 0.6);
      coreG.addColorStop(0,   'rgba(160,255,230,0.9)');
      coreG.addColorStop(0.3, 'rgba(40,200,170,0.7)');
      coreG.addColorStop(0.7, 'rgba(10,120,100,0.25)');
      coreG.addColorStop(1,   'rgba(0,60,50,0)');
      ctx.fillStyle = coreG;
      ctx.fillRect(x - s * 2, y - s * 2, s * 4, s * 4);

      ctx.restore(); // end body clip

      // ── Warm glassy rim ──
      ctx.save();
      ctx.globalAlpha = e.opacity;
      const angelRim = ctx.createRadialGradient(x, y, s * 0.3, x, y, s * 1.9);
      angelRim.addColorStop(0,    'rgba(0,0,0,0)');
      angelRim.addColorStop(0.7,  'rgba(0,0,0,0)');
      angelRim.addColorStop(0.88, 'rgba(195,185,140,0.22)');
      angelRim.addColorStop(1,    'rgba(210,200,155,0.45)');
      ctx.fillStyle = angelRim;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 0.75, s * 1.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Wings — soft translucent fill ───
      const wSpread = s * (1.7 + wf * 0.55);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + side * s * 0.25, y);
        ctx.bezierCurveTo(
          x + side * wSpread * 0.8, y - s * 0.45 + wf * s * 0.25,
          x + side * wSpread,       y + s * 0.35 + wf * s * 0.15,
          x + side * s * 0.42,      y + s * 0.75
        );
        ctx.closePath();
        const wingFill = ctx.createRadialGradient(
          x + side * wSpread * 0.4, y, 0,
          x + side * wSpread * 0.4, y, wSpread
        );
        wingFill.addColorStop(0,   'rgba(120,200,190,0.2)');
        wingFill.addColorStop(0.6, 'rgba(60,150,140,0.08)');
        wingFill.addColorStop(1,   'rgba(20,80,75,0)');
        ctx.fillStyle = wingFill;
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    // ── Comb jelly (ctenophore) ──────────
    function spawnCombJelly() {
      const fromLeft = Math.random() > 0.5;
      entities.push({
        type:  'comb',
        x:     fromLeft ? -0.15 : 1.15,
        y:     0.15 + Math.random() * 0.7,
        velX:  (fromLeft ? 1 : -1) * (0.000025 + Math.random() * 0.00002),
        velY:  (Math.random() - 0.5) * 0.000015,
        scale: 0.018 + Math.random() * 0.014,
        angle: fromLeft ? 0 : Math.PI,
        iridPhase: Math.random() * Math.PI * 2, // phase for color cycling
        opacity: 0, age: 0,
        life: 20000 + Math.random() * 15000,
      });
    }

    function drawCombJelly(e, cW, cH, t) {
      const x   = e.x * cW;
      const y   = e.y * cH;
      const scaleFactor = Math.max(1, 900 / Math.min(cW, cH));
      const s   = e.scale * Math.min(cW, cH) * scaleFactor;
      const iph = e.iridPhase + t * 2.2; // fast color cycling

      ctx.save();
      ctx.globalAlpha = e.opacity;
      ctx.translate(x, y);
      ctx.rotate(e.angle);

      // ── Body — translucent oval, clipped ──
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.0, s * 0.52, 0, 0, Math.PI * 2);
      ctx.clip();

      // Body fill — faint glassy white
      const bodyG = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
      bodyG.addColorStop(0,   'rgba(220,235,255,0.18)');
      bodyG.addColorStop(0.6, 'rgba(160,200,240,0.09)');
      bodyG.addColorStop(1,   'rgba(100,150,220,0)');
      ctx.fillStyle = bodyG;
      ctx.fillRect(-s * 1.1, -s * 0.6, s * 2.2, s * 1.2);

      // Internal lobes — two curved shapes inside
      for (const sy of [-0.18, 0.18]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, sy * s);
        ctx.bezierCurveTo(-s * 0.3, sy * s * 0.4, s * 0.3, sy * s * 0.4, s * 0.7, sy * s);
        ctx.strokeStyle = 'rgba(200,220,255,0.22)';
        ctx.lineWidth   = 0.6;
        ctx.stroke();
      }
      ctx.restore(); // end body clip

      // ── Comb rows — 8 rows of iridescent beating cilia ──
      const numRows = 8;
      const rowLen  = s * 0.88;
      for (let ri = 0; ri < numRows; ri++) {
        const rowY = (ri / (numRows - 1) - 0.5) * s * 0.9;
        const numCilia = 18;
        for (let ci = 0; ci < numCilia; ci++) {
          const cx2   = -rowLen / 2 + (ci / (numCilia - 1)) * rowLen;
          // Hue travels along row + cycles over time
          const hue   = (iph * 60 + ri * 22 + ci * 8) % 360;
          const beat  = Math.sin(t * 3.5 + ci * 0.4 + ri * 0.9) * 0.5 + 0.5;
          const alpha = 0.5 + beat * 0.5;
          ctx.save();
          ctx.globalAlpha = e.opacity * alpha;
          ctx.strokeStyle = `hsla(${hue},100%,72%,1)`;
          ctx.lineWidth   = 0.7;
          ctx.beginPath();
          ctx.moveTo(cx2, rowY);
          ctx.lineTo(cx2 + Math.sin(t * 4 + ci * 0.3) * s * 0.04,
                     rowY - s * 0.06 * beat);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Outer rim glow ──
      ctx.save();
      ctx.globalAlpha = e.opacity * 0.2;
      const rimG = ctx.createRadialGradient(0, 0, s * 0.6, 0, 0, s * 1.1);
      rimG.addColorStop(0, 'rgba(0,0,0,0)');
      rimG.addColorStop(1, `hsla(${(iph * 40) % 360},80%,70%,0.4)`);
      ctx.fillStyle = rimG;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.05, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    return {
      reset() {
        entities.length = 0;
        lastJellySpawn = 0;
        lastAngelSpawn = 0;
      },
      draw(t, dt, cW, cH) {
        // ── Living water color noise — deep teal/navy ──
        ctx.save();
        ctx.globalAlpha = 1;
        const WSCALE = 10;
        const cols   = Math.ceil(cW / WSCALE);
        const rows   = Math.ceil(cH / WSCALE);
        const zoom   = 0.0025, speed = 0.00012;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const nx  = col * zoom;
            const ny  = row * zoom;
            const wx  = fbm(nx + 0.0, ny + 0.0, 3) * 2.2;
            const wy  = fbm(nx + 5.2, ny + 1.3, 3) * 2.2;
            const n   = fbm(nx + wx + t * speed, ny + wy + t * speed * 0.65, 3);
            const val = Math.max(0, Math.min(1, n * 1.6 + 0.5));
            let r, g, b;
            if (val < 0.35) {
              const s = val / 0.35;
              r = Math.round(_lerp(0,  1,  s));
              g = Math.round(_lerp(0,  6,  s));
              b = Math.round(_lerp(0,  8,  s));
            } else if (val < 0.65) {
              const s = (val - 0.35) / 0.3;
              r = Math.round(_lerp(1,  5,  s));
              g = Math.round(_lerp(6,  20, s));
              b = Math.round(_lerp(8,  26, s));
            } else {
              const s = (val - 0.65) / 0.35;
              r = Math.round(_lerp(5,  9,  s));
              g = Math.round(_lerp(20, 32, s));
              b = Math.round(_lerp(26, 40, s));
            }
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(col * WSCALE, row * WSCALE, WSCALE, WSCALE);
          }
        }
        ctx.restore();

        // ── Depth darkening — pitch black at bottom ──
        const depthGrad = ctx.createLinearGradient(0, 0, 0, cH);
        depthGrad.addColorStop(0,   'rgba(0,0,0,0)');
        depthGrad.addColorStop(0.5, 'rgba(0,0,0,0.18)');
        depthGrad.addColorStop(1,   'rgba(0,0,0,0.72)');
        ctx.fillStyle = depthGrad;
        ctx.fillRect(0, 0, cW, cH);

        // ── Global particle breath — slow fade cycle, each layer offset ──
        const breathFront = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.18));
        const breathMid   = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.13 + 1.2));
        const breathBack  = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.09 + 2.5));
        const breathGrain = 0.5  + 0.5  * Math.abs(Math.sin(t * 0.11 + 0.7));

        // Downward submersion scroll — shared by particles and entities
        const scrollY = (t * 0.02) % 1.0;

        // ── Ambient grain dots ──
        ctx.globalAlpha = 1;
        for (const d of grainDots) {
          d.x = ((d.x + d.wx * dt) + 1) % 1;
          d.y = ((d.y + d.wy * dt) + 1) % 1;
          const px      = d.x * cW;
          const py      = ((d.y - scrollY + 1) % 1) * cH;
          const flicker = Math.abs(Math.sin(t * d.speed + d.phase));
          ctx.save();
          if (d.kind === 'bright') {
            ctx.globalAlpha = (0.7 + 0.3 * flicker) * breathGrain;
            ctx.fillStyle   = '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1.5, d.r * 1.4), 0, Math.PI * 2);
            ctx.fill();
          } else if (d.kind === 'blue') {
            ctx.globalAlpha = 0.45 + 0.4 * flicker;
            ctx.fillStyle   = 'rgba(140,200,255,1)';
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1, d.r), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalAlpha = 0.12 + 0.1 * flicker;
            ctx.fillStyle   = 'rgba(180,215,240,1)';
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.8, d.r), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // ── BACK particles — slow, blurry, distant blue ──
        ctx.globalAlpha = 1;
        for (const p of backParticles) {
          p.y -= p.speed * dt;
          p.x = ((p.x + p.drift * dt) + 1) % 1;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          const flicker = p.alpha * breathBack * (0.6 + 0.4 * Math.abs(Math.sin(t * 0.5 + p.phase)));
          const px = p.x * cW, py = ((p.y - scrollY + 1) % 1) * cH;
          ctx.save();
          // Soft blur: 3 concentric circles fading out
          ctx.globalAlpha = flicker * 0.55;
          ctx.fillStyle = 'rgba(60,110,200,1)';
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, p.r), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = flicker * 0.2;
          ctx.fillStyle = 'rgba(80,130,210,1)';
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2, p.r * 2.0), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = flicker * 0.07;
          ctx.fillStyle = 'rgba(100,150,220,1)';
          ctx.beginPath();
          ctx.arc(px, py, Math.max(3, p.r * 3.2), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // ── MID particles — medium speed, soft blur, blue-white ──
        ctx.globalAlpha = 1;
        for (const p of midParticles) {
          p.y -= p.speed * dt;
          p.x = ((p.x + p.drift * dt) + 1) % 1;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          const flicker = p.alpha * breathMid * (0.5 + 0.5 * Math.abs(Math.sin(t * 0.7 + p.phase)));
          const px = p.x * cW, py = ((p.y - scrollY + 1) % 1) * cH;
          const col = p.isBlue ? [140, 200, 255] : [210, 230, 255];
          ctx.save();
          // Core dot
          ctx.globalAlpha = Math.max(0.15, flicker);
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},1)`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, p.r), 0, Math.PI * 2);
          ctx.fill();
          // Soft halo
          ctx.globalAlpha = Math.max(0.06, flicker * 0.3);
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},1)`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2, p.r * 2.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // ── FRONT particles — hard white, fast, varied speed ──
        ctx.globalAlpha = 1;
        for (const p of frontParticles) {
          p.y -= p.speed * dt;
          p.x = ((p.x + p.drift * dt) + 1) % 1;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          const flicker = p.alpha * breathFront * (0.7 + 0.3 * Math.abs(Math.sin(t * 1.1 + p.phase)));
          ctx.save();
          ctx.globalAlpha = Math.max(0.4, flicker);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x * cW, ((p.y - scrollY + 1) % 1) * cH, Math.max(0.8, p.r), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Spawn entities
        lastJellySpawn += dt;
        lastAngelSpawn += dt;
        if (lastJellySpawn > 9000 && entities.filter(e => e.type === 'jelly').length < 3) {
          spawnJellyfish(); lastJellySpawn = 0;
        }
        if (lastAngelSpawn > 12000 && entities.filter(e => e.type === 'angel').length < 3) {
          spawnSeaAngel(); lastAngelSpawn = 0;
        }
        if (Math.random() < 0.0002 && entities.filter(e => e.type === 'comb').length < 2) {
          spawnCombJelly();
        }

        // ── Noise-warped bioluminescent glow pass ──
        ctx.save();

        for (const e of entities) {
          if (e.opacity <= 0) continue;
          const ex = e.x * cW;
          const ey = e.y * cH;
          const baseSize = e.type === 'jelly'
            ? e.r * Math.min(cW, cH) * 4.5
            : e.type === 'comb'
            ? e.scale * Math.min(cW, cH) * 3.5
            : e.scale * Math.min(cW, cH) * 5;
          const hue = e.type === 'jelly' ? e.hue
                    : e.type === 'comb'  ? (e.iridPhase * 60 + t * 40) % 360
                    : 210;

          // Paint glow as ~24 noise-displaced points around the creature
          // This makes the halo feel like light diffracting through water
          const numPoints = 24;
          ctx.save();
          ctx.globalAlpha = e.opacity * 0.055;
          for (let gi = 0; gi < numPoints; gi++) {
            const angle  = (gi / numPoints) * Math.PI * 2;
            // noise displaces each point outward/inward differently
            const nDisp  = fbm(
              Math.cos(angle) * 1.8 + ex * 0.003 + t * 0.04,
              Math.sin(angle) * 1.8 + ey * 0.003
            , 2);
            const dist = baseSize * (0.5 + 0.8 * Math.abs(nDisp) + 0.5);
            const gx   = ex + Math.cos(angle) * dist;
            const gy   = ey + Math.sin(angle) * dist;
            const gRad = baseSize * (0.55 + 0.3 * Math.abs(nDisp));
            const glow = ctx.createRadialGradient(ex, ey, 0, gx, gy, gRad);
            glow.addColorStop(0,   `hsla(${hue},100%,65%,0.22)`);
            glow.addColorStop(0.5, `hsla(${hue},85%,50%,0.1)`);
            glow.addColorStop(1,   `hsla(${hue},70%,35%,0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(gx, gy, gRad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Update + draw entities
        for (let i = entities.length - 1; i >= 0; i--) {
          const e = entities[i];
          e.age += dt;
          const fadeIn  = Math.min(1, e.age / 3500);
          const fadeOut = Math.max(0, 1 - (e.age - e.life + 3500) / 3500);
          e.opacity = Math.min(fadeIn, fadeOut);
          if (e.age > e.life) { entities.splice(i, 1); continue; }

          if (e.type === 'jelly') {
            e.y += e.velY * dt;
            e.x = Math.max(0.04, Math.min(0.96, e.x + e.driftX * dt));
            e.pulsePhase  += e.pulseSpeed  * dt;
            e.pulsePhase2 += e.pulseSpeed2 * dt;
            for (const s of e.tentacleSeeds) s.t += s.speed * dt;
            if (e.y < -0.22) { entities.splice(i, 1); continue; }
            const edgeFade = e.y < 0.08 ? Math.max(0, e.y / 0.08) : 1;
            const drawE = { ...e, opacity: e.opacity * edgeFade, y: ((e.y - scrollY + 1.2) % 1.2) - 0.1 };
            drawJellyfish(drawE, cW, cH, t);
          }
          if (e.type === 'angel') {
            e.y += e.velY * dt;
            e.x = Math.max(0.05, Math.min(0.95, e.x + e.driftX * dt));
            e.wingPhase += e.wingSpeed * dt;
            if (e.y < -0.12) { entities.splice(i, 1); continue; }
            const drawA = { ...e, y: ((e.y - scrollY + 1.2) % 1.2) - 0.1 };
            drawSeaAngel(drawA, cW, cH);
          }
          if (e.type === 'comb') {
            e.x += e.velX * dt;
            e.y += e.velY * dt;
            if (e.x < -0.25 || e.x > 1.25) { entities.splice(i, 1); continue; }
            const drawC = { ...e, y: ((e.y - scrollY + 1.2) % 1.2) - 0.1 };
            drawCombJelly(drawC, cW, cH, t);
          }
        }

        ctx.restore(); // end camera drift

        // Depth current lines
        ctx.save();
        ctx.globalAlpha = 0.055;
        ctx.strokeStyle = '#3a8aaa';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
          const oy = ((i * 0.16 + t * 0.000016) % 1.0);
          ctx.beginPath();
          for (let xx = 0; xx < cW; xx += 4) {
            const wave = fbm(xx * 0.004 + i * 3.1, oy * 8 + t * 0.007, 2);
            const yy   = oy * cH + wave * cH * 0.05;
            xx === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    };
  })();

  // ═══════════════════════════════════════
  // WORLD 1 — GEOMETRIA
  // ═══════════════════════════════════════

  const geometria = (() => {

    // ── Cluster centers — typed clusters ──
    const clusters = [
      { x: -0.6, y: -0.6, type: 'mixed' },
      { x:  0.6, y: -0.6, type: 'mixed' },
      { x: -0.6, y:  0.6, type: 'mixed' },
      { x:  0.6, y:  0.6, type: 'mixed' },
      { x:  0.0, y:  0.0, type: 'mixed' },
      { x: -0.9, y:  0.0, type: 'mixed' },
      { x:  0.9, y:  0.0, type: 'mixed' },
      { x: -0.3, y: -0.7, type: 'waves' },
      { x: -0.8, y:  0.5, type: 'waves' },
      { x:  0.2, y: -0.4, type: 'arabic' },
      { x: -0.5, y:  0.2, type: 'arabic' },
      { x:  0.8, y:  0.7, type: 'arabic' },
      { x:  0.0, y:  0.5, type: 'arabic' },
      { x: -0.3, y: -0.1, type: 'arabic' },
      { x:  0.5, y: -0.1, type: 'arabic' },
      { x: -0.1, y:  0.6, type: 'sanskrit' },
      { x:  0.7, y: -0.3, type: 'sanskrit' },
      { x: -0.7, y: -0.2, type: 'sanskrit' },
      { x: -0.15, y: -0.55, type: 'bg_traces'  },
      { x:  0.45, y:  0.55, type: 'bg_traces'  },
      { x: -0.75, y:  0.35, type: 'bg_traces'  },
      { x:  0.70, y: -0.55, type: 'bg_traces'  },
      { x:  0.25, y:  0.75, type: 'bg_arabic'  },
      { x: -0.55, y: -0.45, type: 'bg_arabic'  },
      { x:  0.80, y:  0.25, type: 'bg_arabic'  },
      { x: -0.20, y:  0.80, type: 'bg_arabic'  },
      { x: -0.20, y:  0.10, type: 'surge', vy: 0 },
      { x:  0.35, y: -0.30, type: 'surge', vy: 0 },
      { x: -0.50, y:  0.40, type: 'surge', vy: 0 },
    ].map((c, i) => ({
      ...c,
      vy: (Math.random() < 0.5 ? 1 : -1) * (0.000008 + Math.random() * 0.000014),
      // Each cluster gets a random size multiplier — some big, some small
      scale: 0.4 + Math.random() * 1.6,
      // Staggered activation: clusters wake up one by one over the first ~20s
      // bg and surge clusters start active; foreground clusters stagger
      dormantUntil: (c.type === 'bg_traces' || c.type === 'bg_arabic' || c.type === 'surge')
        ? 0
        : i * 1800 + Math.random() * 2000,
      // Dormancy cycle: after a random lifetime, cluster goes dormant for 1-2s then respawns
      lifetime:    8000 + Math.random() * 18000, // how long active before resting
      restDur:     1000 + Math.random() * 2000,  // how long dormant
      activeAt:    0,   // timestamp when it last became active (set on first activation)
      isDormant:   false,
    }));

    const MARK_COUNT = 1200;
    const DEEP_COUNT = 400;
    function makeDeepTrace() {
      return {
        x:         (Math.random() - 0.5) * 2.2,   // wider than screen
        y:         (Math.random() - 0.5) * 2.2,
        z:         Math.random() * 0.70,
        baseSpeed: 0.000055 + Math.random() * 0.000065,
        angle:     Math.random() * Math.PI * 2,
        size:      0.00015 + Math.pow(Math.random(), 1.8) * 0.003,
        type:      'wave_trace',
        alpha:     0.12 + Math.random() * 0.20,
        seed:      Math.random() * 100,
        noiseSeed: Math.random() * 50,
        deep:      true,
        surge:     false,
      };
    }
    const deepTraces = Array.from({ length: DEEP_COUNT }, makeDeepTrace);

    // ── Noise seeds for density automation ──
    const densitySeed = Math.random() * 100;

    const mixedTypes = [
      'arrow', 'arrow', 'arrow',
      'arabic_alef', 'arabic_alef', 'arabic_lam', 'arabic_lam',
      'arabic_mim',  'arabic_mim',  'arabic_ayn', 'arabic_nun',
      'arabic_ba',   'arabic_ha',   'arabic_kaf',
      'sanskrit_a',  'sanskrit_a',  'sanskrit_ma', 'sanskrit_ma',
      'sanskrit_i',  'sanskrit_na', 'sanskrit_ra',
      'sanskrit_sa', 'sanskrit_ha', 'sanskrit_om',
      'dash', 'cross', 'polygon', 'loop',
    ];
    const arabicTypes = [
      'arabic_alef', 'arabic_alef', 'arabic_alef',
      'arabic_lam',  'arabic_lam',  'arabic_lam',
      'arabic_mim',  'arabic_mim',  'arabic_mim',
      'arabic_ayn',  'arabic_ayn',
      'arabic_nun',  'arabic_nun',
      'arabic_ba',   'arabic_ba',
      'arabic_ha',   'arabic_ha',
      'arabic_kaf',  'arabic_kaf',
    ];
    const waveTypes = [
      'wave_saw',
      'wave_square',
      'wave_trace', 'wave_trace', 'wave_trace', 'wave_trace',
    ];
    const sanskritTypes = [
      'sanskrit_a',  'sanskrit_a',
      'sanskrit_i',  'sanskrit_ma',
      'sanskrit_na', 'sanskrit_ra',
      'sanskrit_sa', 'sanskrit_ha',
      'sanskrit_om',
    ];

    function makeMarkNearCluster(nowMs) {
      // Only pick from active (non-dormant) clusters; fall back to any if all dormant
      const now = nowMs || 0;
      const active = clusters.filter(c => !c.isDormant && now >= c.dormantUntil);
      const pool   = active.length > 0 ? active : clusters;
      const c      = pool[Math.floor(Math.random() * pool.length)];
      let types;
      const isBg    = c.type === 'bg_traces' || c.type === 'bg_arabic';
      const isSurge = c.type === 'surge';
      if      (c.type === 'arabic'    ) types = arabicTypes;
      else if (c.type === 'waves'     ) types = waveTypes;
      else if (c.type === 'sanskrit'  ) types = sanskritTypes;
      else if (c.type === 'bg_traces' ) types = waveTypes;
      else if (c.type === 'bg_arabic' ) types = arabicTypes;
      else if (c.type === 'surge'     ) types = ['straight_line'];
      else                              types = mixedTypes;

      // Spread and size scaled by the cluster's random scale multiplier
      const baseSpread = isSurge ? 0.08 + Math.random() * 0.15 : 0.05 + Math.random() * 0.12;
      const spread     = baseSpread * c.scale;
      const baseSize   = isSurge ? 0.0006 + Math.pow(Math.random(), 2.2) * 0.012
                       : isBg    ? 0.0004 + Math.pow(Math.random(), 2.2) * 0.008
                       :            0.0008 + Math.pow(Math.random(), 2.2) * 0.022;
      return {
        x:         c.x + (Math.random() - 0.5) * spread,
        y:         c.y + (Math.random() - 0.5) * spread,
        z:         isBg ? Math.random() * 0.08 : Math.random() * 0.05,
        baseSpeed: isSurge ? 0.0018 + Math.random() * 0.0022
                 : isBg    ? 0.00008 + Math.random() * 0.00012
                 :            0.00022 + Math.random() * 0.00035,
        angle:     (Math.floor(Math.random() * 4) * Math.PI * 0.5) + (Math.random() - 0.5) * 0.25,
        size:      baseSize * c.scale,
        type:      types[Math.floor(Math.random() * types.length)],
        alpha:     isSurge ? 0.85 + Math.random() * 0.15
                 : isBg    ? 0.25 + Math.random() * 0.30
                 :            0.55 + Math.random() * 0.45,
        seed:      Math.random() * 100,
        noiseSeed: Math.random() * 50,
        surge:     isSurge,
        clusterId: clusters.indexOf(c),
      };
    }

    const marks = Array.from({ length: MARK_COUNT }, () => makeMarkNearCluster(0));

    // ── World elapsed time (ms) — tracked inside draw ──
    let worldMs = 0;

    // ── Noisy line helper — draws a stroked path with per-segment wobble ──
    // pts: array of {x,y}, noiseSeed: per-mark seed, nAmt: noise amount
    // noisyStroke: pts are s-scaled. We normalize by s before noise sampling
    // so the noise input is identical every frame → zero jitter.
    function noisyStroke(pts, noiseSeed, nAmt, s) {
      if (pts.length < 2) return;
      const invS = s > 0 ? 1 / s : 1;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const ux = pts[i].x * invS;  // unit-space — frame-stable
        const uy = pts[i].y * invS;
        const nx = snoise(ux * 0.4 + noiseSeed, uy * 0.4) * nAmt;
        const ny = snoise(ux * 0.4, uy * 0.4 + noiseSeed) * nAmt;
        const px = pts[i].x + nx;
        const py = pts[i].y + ny;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // ── Draw typographic marks with noisy outlines ──
    function drawMark(m, sx, sy, s, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.lineWidth   = m.surge ? Math.max(0.6, s * 0.045) : Math.max(0.3, s * 0.055);
      ctx.translate(sx, sy);
      ctx.rotate(m.angle);

      const nAmt = s * 0.42; // chunky letterpress noise
      const ns   = m.noiseSeed;

      switch (m.type) {

        case 'arrow': {
          // plain line — varied length and slight diagonal per seed
          const dy = Math.sin(m.seed * 7.3) * s * 0.25;
          noisyStroke([{ x: -s * 0.8, y: -dy }, { x: s * 0.8, y: dy }], ns, nAmt, s);
          break;
        }

        case 'straight_line': {
          // perfectly straight — no noise, just a crisp line
          ctx.beginPath();
          ctx.moveTo(-s, 0);
          ctx.lineTo(s, 0);
          ctx.stroke();
          break;
        }

        case 'dash': {
          noisyStroke([{ x: -s * 0.5, y: 0 }, { x: s * 0.5, y: 0 }], ns, nAmt, s);
          if (Math.sin(m.seed) > 0.3) {
            ctx.globalAlpha = alpha * 0.45;
            noisyStroke([{ x: -s * 0.35, y: s * 0.2 }, { x: s * 0.35, y: s * 0.2 }], ns+3, nAmt * 0.7, s);
          }
          break;
        }

        // ── Latin letters as stroked paths ──
        case 'letter_A': {
          noisyStroke([{ x: -s * 0.5, y: s * 0.5 }, { x: 0, y: -s * 0.5 }, { x: s * 0.5, y: s * 0.5 }], ns, nAmt, s);
          noisyStroke([{ x: -s * 0.22, y: s * 0.1 }, { x: s * 0.22, y: s * 0.1 }], ns+1, nAmt, s);
          break;
        }
        case 'letter_E': {
          noisyStroke([{ x: -s * 0.4, y: -s * 0.5 }, { x: -s * 0.4, y: s * 0.5 }], ns, nAmt, s);
          noisyStroke([{ x: -s * 0.4, y: -s * 0.5 }, { x: s * 0.4, y: -s * 0.5 }], ns+1, nAmt, s);
          noisyStroke([{ x: -s * 0.4, y: 0 }, { x: s * 0.2, y: 0 }], ns+2, nAmt, s);
          noisyStroke([{ x: -s * 0.4, y: s * 0.5 }, { x: s * 0.4, y: s * 0.5 }], ns+3, nAmt, s);
          break;
        }
        case 'letter_I': {
          noisyStroke([{ x: 0, y: -s * 0.5 }, { x: 0, y: s * 0.5 }], ns, nAmt, s);
          noisyStroke([{ x: -s * 0.25, y: -s * 0.5 }, { x: s * 0.25, y: -s * 0.5 }], ns+1, nAmt, s);
          noisyStroke([{ x: -s * 0.25, y: s * 0.5 }, { x: s * 0.25, y: s * 0.5 }], ns+2, nAmt, s);
          break;
        }
        case 'letter_O': {
          const pts = [];
          for (let i = 0; i <= 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            pts.push({ x: Math.cos(a) * s * 0.42, y: Math.sin(a) * s * 0.5 });
          }
          noisyStroke(pts, ns, nAmt, s);
          break;
        }
        case 'letter_S': {
          const pts = [];
          for (let i = 0; i <= 16; i++) {
            const f = i / 16;
            const a = f * Math.PI * 2.2 - Math.PI * 0.6;
            const r = s * (f < 0.5 ? 0.38 : 0.38);
            const cy = f < 0.5 ? -s * 0.2 : s * 0.2;
            pts.push({ x: Math.cos(a) * r * (f < 0.5 ? 1 : -1), y: cy + Math.sin(a) * r * 0.55 });
          }
          noisyStroke(pts, ns, nAmt, s);
          break;
        }
        case 'letter_T': {
          noisyStroke([{ x: -s * 0.45, y: -s * 0.5 }, { x: s * 0.45, y: -s * 0.5 }], ns, nAmt, s);
          noisyStroke([{ x: 0, y: -s * 0.5 }, { x: 0, y: s * 0.5 }], ns+1, nAmt, s);
          break;
        }
        case 'letter_V': {
          noisyStroke([{ x: -s * 0.5, y: -s * 0.5 }, { x: 0, y: s * 0.5 }, { x: s * 0.5, y: -s * 0.5 }], ns, nAmt, s);
          break;
        }
        case 'letter_X': {
          noisyStroke([{ x: -s * 0.45, y: -s * 0.5 }, { x: s * 0.45, y: s * 0.5 }], ns, nAmt, s);
          noisyStroke([{ x: s * 0.45, y: -s * 0.5 }, { x: -s * 0.45, y: s * 0.5 }], ns+1, nAmt, s);
          break;
        }
        case 'letter_Z': {
          noisyStroke([
            { x: -s * 0.45, y: -s * 0.5 },
            { x: s * 0.45, y: -s * 0.5 },
            { x: -s * 0.45, y: s * 0.5 },
            { x: s * 0.45, y: s * 0.5 },
          ], ns, nAmt, s);
          break;
        }

        case 'letter_N': {
          noisyStroke([
            { x: -s * 0.4, y: s * 0.5 }, { x: -s * 0.4, y: -s * 0.5 },
            { x: s * 0.4, y: s * 0.5 },  { x: s * 0.4, y: -s * 0.5 },
          ], ns, nAmt, s);
          break;
        }

        case 'loop': {
          const pts = [];
          for (let i = 0; i <= 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            pts.push({ x: Math.cos(a) * s * 0.45, y: Math.sin(a) * s * 0.28 });
          }
          noisyStroke(pts, ns, nAmt, s);
          noisyStroke([{ x: s * 0.45, y: 0 }, { x: s * 0.85, y: s * 0.22 }], ns+5, nAmt, s);
          break;
        }

        case 'polygon': {
          const sides = 3 + Math.floor(Math.abs(Math.sin(m.seed)) * 4);
          const pts = [];
          for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * Math.PI * 2;
            const jitter = 1 + snoise(Math.cos(a) * 2 + m.seed, Math.sin(a) * 2) * 0.14;
            pts.push({ x: Math.cos(a) * s * jitter, y: Math.sin(a) * s * jitter });
          }
          noisyStroke(pts, ns, nAmt, s);
          break;
        }

        case 'cross': {
          noisyStroke([{ x: -s * 0.5, y: 0 }, { x: s * 0.5, y: 0 }], ns, nAmt, s);
          noisyStroke([{ x: 0, y: -s * 0.5 }, { x: 0, y: s * 0.5 }], ns+7, nAmt, s);
          break;
        }

        // ── Arabic additional letters ──
        // ع  Ayn — open loop with hook
        case 'arabic_ayn': {
          const loop = [];
          for (let i = 0; i <= 10; i++) {
            const a = -Math.PI * 0.3 + (i / 10) * Math.PI * 1.4;
            loop.push({ x: Math.cos(a) * s * 0.32, y: Math.sin(a) * s * 0.28 });
          }
          noisyStroke(loop, ns, nAmt, s);
          noisyStroke([{ x: s * 0.28, y: 0 }, { x: s * 0.5, y: s * 0.35 }, { x: s * 0.18, y: s * 0.48 }], ns+2, nAmt, s);
          break;
        }

        // ن  Nun — cup shape with dot implied as small circle
        case 'arabic_nun': {
          const cup = [];
          for (let i = 0; i <= 10; i++) {
            const a = Math.PI * 0.05 + (i / 10) * Math.PI * 0.9;
            cup.push({ x: Math.cos(a) * s * 0.42, y: s * 0.1 + Math.sin(a) * s * 0.32 });
          }
          noisyStroke(cup, ns, nAmt, s);
          // dot
          const dot = [];
          for (let i = 0; i <= 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            dot.push({ x: Math.cos(a) * s * 0.07, y: -s * 0.32 + Math.sin(a) * s * 0.07 });
          }
          noisyStroke(dot, ns+4, nAmt * 0.5, s);
          break;
        }

        // ب  Ba — horizontal base with dot below
        case 'arabic_ba': {
          const base = [];
          for (let i = 0; i <= 8; i++) {
            const f = i / 8;
            const a = Math.PI * 0.15 + f * Math.PI * 0.7;
            base.push({ x: -s * 0.4 + f * s * 0.8, y: s * 0.1 + Math.sin(a * 2) * s * 0.1 });
          }
          noisyStroke(base, ns, nAmt, s);
          // small upward tick on left
          noisyStroke([{ x: -s * 0.25, y: s * 0.1 }, { x: -s * 0.18, y: -s * 0.18 }], ns+2, nAmt, s);
          // dot below
          const dot2 = [];
          for (let i = 0; i <= 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            dot2.push({ x: Math.cos(a) * s * 0.07, y: s * 0.35 + Math.sin(a) * s * 0.07 });
          }
          noisyStroke(dot2, ns+5, nAmt * 0.5, s);
          break;
        }

        // ح  Ha — two connected cups
        case 'arabic_ha': {
          const left = [];
          for (let i = 0; i <= 8; i++) {
            const a = Math.PI * 0.1 + (i / 8) * Math.PI * 0.8;
            left.push({ x: -s * 0.2 + Math.cos(a) * s * 0.25, y: Math.sin(a) * s * 0.28 });
          }
          noisyStroke(left, ns, nAmt, s);
          const right = [];
          for (let i = 0; i <= 8; i++) {
            const a = Math.PI * 0.1 + (i / 8) * Math.PI * 0.8;
            right.push({ x: s * 0.2 + Math.cos(a) * s * 0.25, y: Math.sin(a) * s * 0.28 });
          }
          noisyStroke(right, ns+3, nAmt, s);
          noisyStroke([{ x: -s * 0.2, y: -s * 0.28 }, { x: s * 0.2, y: -s * 0.28 }], ns+6, nAmt * 0.5, s);
          break;
        }

        // ك  Kaf — vertical stem with curved seat and small inner mark
        case 'arabic_kaf': {
          noisyStroke([{ x: s * 0.1, y: -s * 0.5 }, { x: s * 0.1, y: s * 0.25 }], ns, nAmt, s);
          const seat = [];
          for (let i = 0; i <= 8; i++) {
            const a = -Math.PI * 0.05 + (i / 8) * Math.PI * 0.7;
            seat.push({ x: s * 0.1 - Math.cos(a) * s * 0.38, y: s * 0.25 + Math.sin(a) * s * 0.2 });
          }
          noisyStroke(seat, ns+2, nAmt, s);
          // small diagonal inner mark
          noisyStroke([{ x: -s * 0.1, y: -s * 0.15 }, { x: s * 0.08, y: -s * 0.3 }], ns+5, nAmt * 0.7, s);
          break;
        }
        case 'arabic_alef': {
          const pts = [];
          for (let i = 0; i <= 8; i++) {
            const f = i / 8;
            pts.push({
              x: snoise(f * 2 + ns, 0) * nAmt * 0.5,
              y: -s * 0.5 + f * s,
            });
          }
          noisyStroke(pts, ns, nAmt * 0.6, s);
          // small hamza-like hook at top
          noisyStroke([{ x: 0, y: -s * 0.5 }, { x: s * 0.22, y: -s * 0.28 }], ns+4, nAmt, s);
          break;
        }

        // ل  Lam — vertical then sweeping base curve
        case 'arabic_lam': {
          const stem = [];
          for (let i = 0; i <= 6; i++) {
            const f = i / 6;
            stem.push({ x: s * 0.1, y: -s * 0.5 + f * s * 0.9 });
          }
          noisyStroke(stem, ns, nAmt, s);
          // sweeping base curve left
          const base = [];
          for (let i = 0; i <= 8; i++) {
            const f = i / 8;
            const a = -Math.PI * 0.1 + f * Math.PI * 0.9;
            base.push({ x: s * 0.1 - Math.cos(a) * s * 0.38, y: s * 0.35 + Math.sin(a) * s * 0.22 });
          }
          noisyStroke(base, ns+2, nAmt, s);
          break;
        }

        // م  Mim — small closed loop with descending tail
        case 'arabic_mim': {
          // closed loop
          const loop = [];
          for (let i = 0; i <= 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            loop.push({ x: Math.cos(a) * s * 0.28, y: -s * 0.1 + Math.sin(a) * s * 0.22 });
          }
          noisyStroke(loop, ns, nAmt, s);
          // descending tail
          const tail = [];
          for (let i = 0; i <= 8; i++) {
            const f = i / 8;
            const a = -Math.PI * 0.5 + f * Math.PI * 0.85;
            tail.push({ x: Math.cos(a) * s * 0.35, y: s * 0.12 + Math.sin(a) * s * 0.35 });
          }
          noisyStroke(tail, ns+3, nAmt, s);
          break;
        }

        // ── Wave forms ──
        case 'wave_saw': {
          const cycles = 3 + Math.floor(Math.abs(Math.sin(m.seed)) * 3);
          const pts = [];
          for (let ci = 0; ci < cycles; ci++) {
            const x0 = -s + (ci / cycles) * s * 2;
            const x1 = -s + ((ci + 0.85) / cycles) * s * 2;
            pts.push({ x: x0, y: s * 0.4 });
            pts.push({ x: x1, y: -s * 0.4 });
            pts.push({ x: x1, y: s * 0.4 });
          }
          noisyStroke(pts, ns, nAmt * 0.6, s);
          break;
        }

        case 'wave_square': {
          const steps = 3 + Math.floor(Math.abs(Math.sin(m.seed)) * 3);
          const pts = [{ x: -s, y: -s * 0.35 }];
          for (let ci = 0; ci < steps; ci++) {
            const isHigh = ci % 2 === 0;
            const x0 = -s + (ci / steps) * s * 2;
            const x1 = -s + ((ci + 1) / steps) * s * 2;
            const yy  = isHigh ? -s * 0.35 : s * 0.35;
            const yn = isHigh ? s * 0.35 : -s * 0.35;
            pts.push({ x: x0, y: yy });
            pts.push({ x: x1, y: yy });
            pts.push({ x: x1, y: yn });
          }
          noisyStroke(pts, ns, nAmt * 0.5, s);
          break;
        }

        case 'wave_trace': {
          const pts = [];
          for (let i = 0; i <= 14; i++) {
            const f = i / 14;
            const wy2 = Math.sin(f * Math.PI * 3 + m.seed) * s * 0.35
                      + snoise(f * 4 + ns + 10, m.seed) * s * 0.25;
            pts.push({ x: -s + f * s * 2, y: wy2 });
          }
          noisyStroke(pts, ns, nAmt * 1.4, s);
          break;
        }

        case 'straight_line': {
          // Plain straight line at a fixed angle per seed
          const dy = Math.sin(m.seed * 3.7) * s * 0.15;
          noisyStroke([{ x: -s, y: -dy }, { x: s, y: dy }], ns, nAmt * 0.3, s);
          break;
        }

        // ── Sanskrit / Devanagari ──
        case 'sanskrit_a': {
          noisyStroke([{ x: -s*0.1, y: -s*0.5 }, { x: -s*0.1, y: s*0.5 }], ns, nAmt, s);
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: s*0.45, y: -s*0.5 }], ns+1, nAmt, s);
          const body = [];
          for (let i = 0; i <= 8; i++) {
            const f = i / 8;
            body.push({ x: -s*0.1 + f * s*0.55, y: -s*0.5 + f * s*0.5 + Math.sin(f * Math.PI) * s*0.2 });
          }
          noisyStroke(body, ns+2, nAmt, s);
          break;
        }

        case 'sanskrit_i': {
          noisyStroke([{ x: -s*0.3, y: -s*0.5 }, { x: -s*0.3, y: s*0.5 }], ns, nAmt, s);
          noisyStroke([{ x:  s*0.3, y: -s*0.5 }, { x:  s*0.3, y: s*0.1 }], ns+1, nAmt, s);
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: s*0.45, y: -s*0.5 }], ns+2, nAmt, s);
          const sarc = [];
          for (let i = 0; i <= 8; i++) {
            const a = Math.PI * 0.1 + (i / 8) * Math.PI * 0.8;
            sarc.push({ x: Math.cos(a) * s*0.3, y: s*0.1 + Math.sin(a) * s*0.28 });
          }
          noisyStroke(sarc, ns+3, nAmt, s);
          break;
        }

        case 'sanskrit_ma': {
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: s*0.45, y: -s*0.5 }], ns, nAmt, s);
          noisyStroke([{ x: -s*0.3, y: -s*0.5 }, { x: -s*0.3, y: s*0.5 }], ns+1, nAmt, s);
          noisyStroke([{ x:  s*0.3, y: -s*0.5 }, { x:  s*0.3, y: s*0.5 }], ns+2, nAmt, s);
          const marc = [];
          for (let i = 0; i <= 8; i++) {
            const a = -Math.PI*0.5 + (i/8)*Math.PI;
            marc.push({ x: Math.cos(a)*s*0.3, y: s*0.1+Math.sin(a)*s*0.28 });
          }
          noisyStroke(marc, ns+3, nAmt, s);
          break;
        }

        case 'sanskrit_na': {
          noisyStroke([{ x: -s*0.35, y: -s*0.5 }, { x: -s*0.35, y: s*0.5 }], ns, nAmt, s);
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: s*0.45, y: -s*0.5 }], ns+1, nAmt, s);
          const narc = [];
          for (let i = 0; i <= 10; i++) {
            const a = -Math.PI*0.15 + (i/10)*Math.PI*1.3;
            narc.push({ x: -s*0.35 + Math.cos(a)*s*0.42, y: -s*0.1+Math.sin(a)*s*0.38 });
          }
          noisyStroke(narc, ns+2, nAmt, s);
          break;
        }

        case 'sanskrit_ra': {
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: s*0.45, y: -s*0.5 }], ns, nAmt, s);
          const rhook = [];
          for (let i = 0; i <= 10; i++) {
            const f = i / 10;
            rhook.push({ x: s*0.1, y: -s*0.5 + f*s*0.9 + Math.sin(f*Math.PI)*s*0.2 });
          }
          noisyStroke(rhook, ns+1, nAmt, s);
          const rfoot = [];
          for (let i = 0; i <= 6; i++) {
            const a = Math.PI*0.1 + (i/6)*Math.PI*0.6;
            rfoot.push({ x: s*0.1 + Math.cos(a)*s*0.32, y: s*0.4+Math.sin(a)*s*0.2 });
          }
          noisyStroke(rfoot, ns+2, nAmt, s);
          break;
        }

        case 'sanskrit_sa': {
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: s*0.45, y: -s*0.5 }], ns, nAmt, s);
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: 0, y: s*0.1 }], ns+1, nAmt, s);
          noisyStroke([{ x: s*0.45, y: -s*0.5 }, { x: 0, y: s*0.1 }], ns+2, nAmt, s);
          noisyStroke([{ x: 0, y: s*0.1 }, { x: 0, y: s*0.5 }], ns+3, nAmt, s);
          break;
        }

        case 'sanskrit_ha': {
          noisyStroke([{ x: -s*0.45, y: -s*0.5 }, { x: s*0.45, y: -s*0.5 }], ns, nAmt, s);
          noisyStroke([{ x: 0, y: -s*0.5 }, { x: 0, y: s*0.5 }], ns+1, nAmt, s);
          const harc = [];
          for (let i = 0; i <= 10; i++) {
            const a = -Math.PI*0.1 + (i/10)*Math.PI*1.2;
            harc.push({ x: Math.cos(a)*s*0.38, y: s*0.05+Math.sin(a)*s*0.32 });
          }
          noisyStroke(harc, ns+2, nAmt, s);
          break;
        }

        case 'sanskrit_om': {
          const omcircle = [];
          for (let i = 0; i <= 12; i++) {
            const a = (i/12)*Math.PI*2;
            omcircle.push({ x: Math.cos(a)*s*0.35, y: -s*0.1+Math.sin(a)*s*0.35 });
          }
          noisyStroke(omcircle, ns, nAmt, s);
          noisyStroke([{ x: s*0.35, y: -s*0.1 }, { x: s*0.5, y: s*0.3 }, { x: s*0.2, y: s*0.5 }], ns+2, nAmt, s);
          break;
        }
      }

      ctx.restore();
    }

    return {
      reset() {
        worldMs = 0;
        // Re-randomize each cluster's scale and dormancy on reset
        clusters.forEach((c, i) => {
          c.scale       = 0.4 + Math.random() * 1.6;
          c.isDormant   = false;
          c.activeAt    = 0;
          c.lifetime    = 8000 + Math.random() * 18000;
          c.restDur     = 1000 + Math.random() * 2000;
          c.dormantUntil = (c.type === 'bg_traces' || c.type === 'bg_arabic' || c.type === 'surge')
            ? 0
            : i * 1800 + Math.random() * 2000;
        });
        for (const m of marks) Object.assign(m, makeMarkNearCluster(0));
      },
      draw(t, dt, cW, cH) {

        worldMs += dt;

        // Plain black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, cW, cH);

        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        const gridSnap = isMobile ? 4 : 2;
        const markLimit = isMobile ? Math.floor(MARK_COUNT / 2) : MARK_COUNT;
        const deepLimit = isMobile ? Math.floor(DEEP_COUNT / 2) : DEEP_COUNT;
        const surgeAmount = 1;

        // ── Cluster dormancy cycle ──
        // Foreground clusters take turns resting then waking with a new random scale.
        for (const c of clusters) {
          if (c.type === 'bg_traces' || c.type === 'bg_arabic' || c.type === 'surge') continue;
          if (worldMs < c.dormantUntil) continue; // still in staggered startup

          if (!c.isDormant) {
            // Active — check if lifetime has elapsed
            if (c.activeAt === 0) c.activeAt = worldMs;
            if (worldMs - c.activeAt > c.lifetime) {
              c.isDormant = true;
              c.dormantUntil = worldMs + c.restDur;
            }
          } else {
            // Dormant — check if rest period is over
            if (worldMs >= c.dormantUntil) {
              c.isDormant  = false;
              c.activeAt   = worldMs;
              // Respawn with new random scale, lifetime and restDur
              c.scale    = 0.3 + Math.random() * 2.0;
              c.lifetime = 8000 + Math.random() * 18000;
              c.restDur  = 1000 + Math.random() * 2000;
            }
          }
        }

        // Clusters drift vertically, bounce at bounds
        for (const c of clusters) {
          c.y += c.vy * dt;
          if (Math.abs(c.y) > 1.1) c.vy *= -1;
        }

        const camDrift = Math.sin(t * 0.055) * cH * 0.08
                       + Math.sin(t * 0.021) * cH * 0.05;
        const vpX = cW * 0.5;
        const vpY = cH * 0.5 + camDrift;

        // ── Deep trace layer ──
        for (let mi = 0; mi < deepLimit; mi++) {
          const m = deepTraces[mi];
          m.z += m.baseSpeed * dt;
          if (m.z >= 0.70) {
            Object.assign(m, makeDeepTrace());
            m.z = 0.0;
          }
          const perspective = 1 / (1 - m.z);
          const sx = vpX + m.x * perspective * cW * 0.5;
          const sy = vpY + m.y * perspective * cH * 0.5;
          if (sx < -200 || sx > cW + 200 || sy < -200 || sy > cH + 200) continue;
          const s      = Math.max(0.5, m.size * Math.min(cW, cH) * perspective);
          const fadeIn = Math.min(1, m.z * 10.0);
          const alpha  = m.alpha * fadeIn;
          if (alpha < 0.01) continue;
          drawMark(m, Math.round(sx), Math.round(sy), Math.max(1, Math.round(s)), alpha);
        }

        // ── Update + draw marks ──
        for (let mi = 0; mi < markLimit; mi++) {
          const m = marks[mi];

          // Skip marks belonging to a dormant cluster
          const c = m.clusterId != null ? clusters[m.clusterId] : null;
          if (c && (c.isDormant || worldMs < c.dormantUntil)) {
            // Don't advance z — just wait silently
            continue;
          }

          m.z += m.baseSpeed * surgeAmount * dt;
          if (m.z >= 0.96) {
            if (m.surge) {
              const sc = clusters.find(cl => cl.type === 'surge');
              if (sc) { sc.x = (Math.random() - 0.5) * 1.4; sc.y = (Math.random() - 0.5) * 1.4; }
            }
            Object.assign(m, makeMarkNearCluster(worldMs));
            m.z = 0.01;
          }

          const perspective = 1 / (1 - m.z);
          const sx = vpX + m.x * perspective * cW * 0.5;
          const sy = vpY + m.y * perspective * cH * 0.5;
          if (sx < -200 || sx > cW + 200 || sy < -200 || sy > cH + 200) continue;

          const s       = Math.max(1, m.size * Math.min(cW, cH) * perspective);
          const fadeIn  = Math.min(1, m.z * 8.0);
          const fadeOut = m.z > 0.90 ? Math.max(0, 1 - (m.z - 0.90) / 0.06) : 1;
          const alpha   = m.alpha * fadeIn * fadeOut;

          if (alpha < 0.02) continue;
          const ps = Math.max(gridSnap, Math.round(s / gridSnap) * gridSnap);
          drawMark(m, Math.round(sx), Math.round(sy), ps, alpha);
        }
      }
    };
  })();

  // ═══════════════════════════════════════
  // WORLD 2 — PALEOZOICO
  // Julia set — pixel buffer, renders only on user interaction
  // Colors from microscopy photos: deep purple bg, magenta→violet→teal
  // ═══════════════════════════════════════

  const paleozoico = (() => {

    // ── Render scale — draw at 1/3 res, CSS scales up ──
    const SCALE = 3;

    // ── Julia parameter — classic c = -0.7 + 0.27i ──
    const CR = -0.7, CI = 0.27;
    const MAX_ITER = 128;

    // ── View state — complex plane bounds ──
    // Classic Julia full view: [-2, 2] × [-1.5, 1.5]
    let viewXmin = -2.0, viewXmax = 2.0;
    let viewYmin = -1.5, viewYmax = 1.5;

    // ── Dirty flag — only re-render when view changes ──
    let dirty = true;

    // ── Rain drops ──
    const rainDrops = Array.from({ length: 200 }, (_, i) => ({
      x:     Math.random(),
      y:     Math.random(),
      speed: 0.00042 + Math.random() * 0.00055,
      len:   0.014 + Math.random() * 0.032,
      alpha: i < 80 ? (0.12 + Math.random() * 0.18) : (0.04 + Math.random() * 0.08),
      layer: i < 80 ? 'front' : 'back',
    }));

    // ── Off-screen pixel buffer ──
    let pixW = 0, pixH = 0;
    let imageData = null;


    // -- fractal coloring LUT — precompute colors for each iteration count to avoid expensive color calculations in the inner loop --
const LUT = new Uint8Array(MAX_ITER * 3);
(function buildLUT() {
  for (let i = 0; i < MAX_ITER; i++) {
    const f = i / MAX_ITER;
    let r, g, b;
    if (i === 0) {
      // Interior — matches teal background
      r = 70; g = 160; b = 180;
    } else if (f < 0.18) {
      const s = f / 0.18;
      // teal → purple-teal transition
      r = _lerp(70,  105, s); g = _lerp(160, 145, s); b = _lerp(180, 175, s);
    } else if (f < 0.40) {
      const s = (f - 0.18) / 0.22;
      // purple-teal → mid purple
      r = _lerp(105, 110, s); g = _lerp(145, 120, s); b = _lerp(175, 175, s);
    } else if (f < 0.62) {
      const s = (f - 0.40) / 0.22;
      // mid purple → deeper purple
      r = _lerp(110,  90, s); g = _lerp(120, 100, s); b = _lerp(175, 170, s);
    } else if (f < 0.82) {
      const s = (f - 0.62) / 0.20;
      // deeper purple → saturated purple
      r = _lerp(90,  110, s); g = _lerp(100,  85, s); b = _lerp(170, 190, s);
    } else {
      const s = (f - 0.82) / 0.18;
      // saturated purple → dark purple (outermost boundary)
      r = _lerp(110, 120, s); g = _lerp(85,   65, s); b = _lerp(190, 170, s);
    }
    LUT[i*3]   = Math.round(r);
    LUT[i*3+1] = Math.round(g);
    LUT[i*3+2] = Math.round(b);
  }
})();


    // ── Core Julia iteration — inline, no function call overhead ──
    function renderJulia(cW, cH) {
      pixW = Math.ceil(cW / SCALE);
      pixH = Math.ceil(cH / SCALE);

      if (!imageData || imageData.width !== pixW || imageData.height !== pixH) {
        // Create a temp canvas just for imageData
        const tmp = document.createElement('canvas');
        tmp.width  = pixW;
        tmp.height = pixH;
        imageData  = tmp.getContext('2d').createImageData(pixW, pixH);
      }

      const data  = imageData.data;
      const xSpan = viewXmax - viewXmin;
      const ySpan = viewYmax - viewYmin;

      for (let py = 0; py < pixH; py++) {
        const ci0 = viewYmin + (py / pixH) * ySpan;
        for (let px = 0; px < pixW; px++) {
          let zr = viewXmin + (px / pixW) * xSpan;
          let zi = ci0;
          let iter = 0;

          // Tight inner loop — no function calls
          while (iter < MAX_ITER && zr*zr + zi*zi < 4.0) {
            const tmp2 = zr*zr - zi*zi + CR;
            zi = 2.0*zr*zi + CI;
            zr = tmp2;
            iter++;
          }

          const idx = (py * pixW + px) * 4;
          if (iter === MAX_ITER) {
           // Interior — soft purple-grey
          data[idx]   = 125;
          data[idx+1] = 115;
          data[idx+2] = 160;
          } else {
            const li = iter * 3;
            data[idx]   = LUT[li];
            data[idx+1] = LUT[li+1];
            data[idx+2] = LUT[li+2];
          }
          data[idx+3] = 255;
        }
      }
    }

    // ── Interaction handlers ──
    let handlersAttached = false;

    function screenToComplex(sx, sy, cW, cH) {
      return [
        viewXmin + (sx / cW) * (viewXmax - viewXmin),
        viewYmin + (sy / cH) * (viewYmax - viewYmin),
      ];
    }

    function zoomAround(cx, cy, factor, cW, cH) {
      const [rx, ry] = screenToComplex(cx, cy, cW, cH);
      const xSpan = (viewXmax - viewXmin) * factor;
      const ySpan = (viewYmax - viewYmin) * factor;
      const fx = cx / cW;
      const fy = cy / cH;
      // Fix: compute both min and max from the anchor point
      viewXmin = rx - fx * xSpan;
      viewXmax = rx + (1 - fx) * xSpan;
      viewYmin = ry - fy * ySpan;
      viewYmax = ry + (1 - fy) * ySpan;
      dirty = true;
    }

    function attachHandlers(canvas) {
      if (handlersAttached) return;
      handlersAttached = true;

      // ── Mouse wheel zoom only ──
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect   = canvas.getBoundingClientRect();
        const factor = e.deltaY < 0 ? 0.8 : 1.25;
        zoomAround(e.clientX - rect.left, e.clientY - rect.top, factor,
                   canvas.width, canvas.height);
      }, { passive: false });

      // ── Pinch to zoom (touch only) ──
      let lastDist = null;
      let lastMx = 0, lastMy = 0;

      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastDist = Math.hypot(dx, dy);
          lastMx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          lastMy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 2 || !lastDist) return;
        e.preventDefault();
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const mx   = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my   = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = canvas.getBoundingClientRect();
        zoomAround(mx - rect.left, my - rect.top, lastDist / dist,
                   canvas.width, canvas.height);
        lastDist = dist; lastMx = mx; lastMy = my;
      }, { passive: false });

      canvas.addEventListener('touchend', () => { lastDist = null; }, { passive: true });
    }

    // Temp canvas for upscaling the pixel buffer
    const bufCanvas = document.createElement('canvas');
    const bufCtx    = bufCanvas.getContext('2d');

    return {
      reset() {
      // Tighter zoom — roughly 4× more zoomed than current default
      viewXmin = -0.01; viewXmax =  0.04;
      viewYmin = -0.03; viewYmax =  0.02;
      dirty = true;
      },
      draw(t, dt, cW, cH) {
        // Only attach interaction on non-touch devices
        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        if (!isMobile) attachHandlers(worldCanvas);

        // Only re-render pixel buffer when view has changed
        if (dirty) {
          renderJulia(cW, cH);
          bufCanvas.width  = pixW;
          bufCanvas.height = pixH;
          bufCtx.putImageData(imageData, 0, 0);
          dirty = false;
        }

        // Upscale bufCanvas to full screen — one drawImage call
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bufCanvas, 0, 0, cW, cH);

        // ── Rain ──
        ctx.save();
        ctx.lineCap = 'butt';
        for (const drop of rainDrops) {
          drop.y += drop.speed * dt;
          if (drop.y > 1.02) { drop.y = -0.02; drop.x = Math.random(); }
          const dx   = drop.x * cW;
          const dy   = drop.y * cH;
          const dlen = drop.len * cH;
          ctx.strokeStyle = drop.layer === 'front'
            ? `rgba(255,255,255,${drop.alpha})`
            : `rgba(255,255,255,${drop.alpha * 0.5})`;
          ctx.lineWidth = drop.layer === 'front' ? 0.5 : 0.25;
          ctx.beginPath();
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx, dy + dlen);
          ctx.stroke();
        }
        ctx.restore();
      }
    };
  })();

  // ═══════════════════════════════════════
  // WORLD 3 — SELVA DIGITAL (flowfield)
  // The flow field runs on the world canvas directly.
  // Audio reactivity is handled inside flowfield.html's IIFE via
  // window._flowfieldAnalyser (set by loadAudio when worldIdx === 3).
  // ═══════════════════════════════════════

  const selvaDigital = (() => {

    // ── Perlin noise ──
    const _fp = new Uint8Array(256);
    for (let i = 0; i < 256; i++) _fp[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [_fp[i], _fp[j]] = [_fp[j], _fp[i]];
    }
    const fperm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) fperm[i] = _fp[i & 255];

    function ffade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function flerp(a, b, t) { return a + t * (b - a); }
    function fgrad(h, x, y) {
      const g = h & 3;
      const u = g < 2 ? x : y, v = g < 2 ? y : x;
      return ((g & 1) ? -u : u) + ((g & 2) ? -v : v);
    }
    function fnoise(x, y) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      const xf = x - Math.floor(x), yf = y - Math.floor(y);
      const u = ffade(xf), v = ffade(yf);
      const a = fperm[X] + Y, b = fperm[X + 1] + Y;
      return flerp(
        flerp(fgrad(fperm[a], xf, yf), fgrad(fperm[b], xf - 1, yf), u),
        flerp(fgrad(fperm[a + 1], xf, yf - 1), fgrad(fperm[b + 1], xf - 1, yf - 1), u),
        v
      );
    }
    function ffbm(x, y, oct) {
      let v = 0, a = 0.5, f = 1, m = 0;
      for (let i = 0; i < oct; i++) {
        v += fnoise(x * f, y * f) * a;
        m += a; a *= 0.5; f *= 2.0;
      }
      return v / m;
    }

    // ── Color helpers ──
    function fhsl(h, s, l, a) {
      return `hsla(${h | 0},${s | 0}%,${l | 0}%,${a.toFixed(3)})`;
    }
    function flerpHSL(h1, s1, l1, h2, s2, l2, t) {
      let dh = h2 - h1;
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
      return [h1 + dh * t, flerp(s1, s2, t), flerp(l1, l2, t)];
    }
    function lineColor(normPos, globalPhase, alpha, bassBoost) {
      const blend = Math.sin(globalPhase * Math.PI * 2) * 0.5 + 0.5;
      const lBoost = bassBoost * 8;
      const [hA, sA, lA] = flerpHSL(185, 38, 38 + lBoost, 50, 45, 44 + lBoost, normPos);
      const [hB, sB, lB] = flerpHSL(148, 32, 36 + lBoost, 272, 30, 38 + lBoost, normPos);
      const [h, s, l] = flerpHSL(hA, sA, lA, hB, sB, lB, blend);
      return fhsl(h, s, l, alpha);
    }

    // ── Audio analysis ──
    let _analyser = null;
    let _freqData = null;

    function getAudioEnergy() {
      if (!_analyser) {
        if (window._flowfieldAnalyser) {
          _analyser = window._flowfieldAnalyser;
          _freqData = new Uint8Array(_analyser.frequencyBinCount);
        } else {
          return [0, 0, 0];
        }
      }
      _analyser.getByteFrequencyData(_freqData);
      const len = _freqData.length;
      const bassEnd = Math.floor(len * 0.05);
      const midEnd  = Math.floor(len * 0.30);
      const highEnd = Math.floor(len * 0.70);
      let bass = 0, mid = 0, high = 0;
      for (let i = 0;       i < bassEnd; i++) bass += _freqData[i];
      for (let i = bassEnd; i < midEnd;  i++) mid  += _freqData[i];
      for (let i = midEnd;  i < highEnd; i++) high += _freqData[i];
      bass /= bassEnd * 255;
      mid  /= (midEnd - bassEnd) * 255;
      high /= (highEnd - midEnd) * 255;
      return [bass, mid, high];
    }

    // ── Particle constants ──
    const NUM_LINES   = 240;
    const TAIL        = 80;
    const STEP_LEN    = 3.2;
    const NOISE_ZOOM  = 0.0018;
    const NOISE_SPEED = 0.000055;
    const CURL_AMP    = 0.45;
    const DECAY_ALPHA = 0.010;

    let lines  = [];
    let fieldT = 0;
    let colorT = 0;
    let globalT = 0;

    // Off-screen buffer — persists between draw() calls for trail effect
    const offCanvas = document.createElement('canvas');
    const offCtx    = offCanvas.getContext('2d');
    let offW = 0, offH = 0;

    function syncOff(cW, cH) {
      if (offCanvas.width !== cW || offCanvas.height !== cH) {
        offCanvas.width  = cW;
        offCanvas.height = cH;
        offW = cW; offH = cH;
      }
    }

    function randomX(cW) { return Math.random() * cW * 1.2 - cW * 0.1; }
    function randomY(cH) { return Math.random() * cH * 1.2 - cH * 0.1; }

    function fieldAngle(x, y, t, midBoost) {
      const nx = x * NOISE_ZOOM, ny = y * NOISE_ZOOM;
      const n1 = ffbm(nx + t * 1.1, ny + t * 0.7, 4);
      const curl = CURL_AMP + midBoost * 0.6;
      const n2 = ffbm(nx + 3.7 + t * 0.6, ny + 1.9 + t * 0.9, 3);
      return (n1 * 4.0 + n2 * curl) * Math.PI * 2;
    }

    function spawnLine(l, cW, cH) {
      l.x = randomX(cW);
      l.y = randomY(cH);
      l.buf  = new Float32Array(TAIL * 2);
      l.head = 0;
      l.len  = 0;
      for (let i = 0; i < TAIL; i++) {
        const angle = fieldAngle(l.x, l.y, fieldT, 0);
        l.x += Math.cos(angle) * STEP_LEN;
        l.y += Math.sin(angle) * STEP_LEN;
        l.buf[i * 2]     = l.x;
        l.buf[i * 2 + 1] = l.y;
      }
      l.head = TAIL - 1;
      l.len  = TAIL;
      const midAngle = fieldAngle(l.x, l.y, fieldT, 0);
      l.colorPos  = (midAngle / (Math.PI * 2) + 1) % 1;
      l.alpha     = Math.random() * 0.05 + 0.015;
      l.lifeSpeed = 0.004 + Math.random() * 0.008;
      l.lifeT     = Math.random() * Math.PI * 2;
    }

    function isOffscreen(x, y, cW, cH) {
      return x < -cW * 0.2 || x > cW * 1.2 || y < -cH * 0.2 || y > cH * 1.2;
    }

    function stepLine(l, midBoost, cW, cH) {
      const angle = fieldAngle(l.x, l.y, fieldT, midBoost);
      l.x += Math.cos(angle) * STEP_LEN;
      l.y += Math.sin(angle) * STEP_LEN;
      l.head = (l.head + 1) % TAIL;
      l.buf[l.head * 2]     = l.x;
      l.buf[l.head * 2 + 1] = l.y;
      if (l.len < TAIL) l.len++;
      if (isOffscreen(l.x, l.y, cW, cH)) spawnLine(l, cW, cH);
    }

    function initLines(cW, cH) {
      lines = [];
      for (let i = 0; i < NUM_LINES; i++) {
        const l = {};
        spawnLine(l, cW, cH);
        lines.push(l);
      }
    }

    let initialized = false;

    return {
      reset() {
        initialized = false;
        fieldT += 12.0 + Math.random() * 8.0;
        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        _analyser = null; // re-acquire analyser on next draw
      },
      draw(t, dt, cW, cH) {
        if (!initialized) {
          syncOff(cW, cH);
          initLines(cW, cH);
          initialized = true;
        }
        syncOff(cW, cH);

        globalT += dt * 0.001;
        fieldT  += NOISE_SPEED * dt;
        colorT  += 0.000028 * dt;

        const [bass, mid, high] = getAudioEnergy();

        // Slow gentle swell
        const raw         = Math.sin(globalT * 0.16) * 0.5 + 0.5;
        const pulsed      = Math.pow(raw, 5.0) + bass * 0.04;
        const globalPulse = Math.min(1, pulsed);

        // isDark: 1 when fully dark, 0 at peak
        const isDark = Math.max(0, 1 - globalPulse * 2.5);

        // Decay logic:
        // — bright phase (globalPulse high): 0.045 — trails fade noticeably faster, no grey buildup
        // — dark phase (isDark high):        0.18  — buffer clears to black quickly
        // The two blend smoothly as the pulse transitions.
        const brightDecay = 0.045;
        const darkDecay   = 0.18;
        const currentDecay = flerp(brightDecay, darkDecay, isDark);

        offCtx.fillStyle = `rgba(0,0,0,${currentDecay})`;
        offCtx.fillRect(0, 0, cW, cH);

        for (let i = 0; i < NUM_LINES; i++) {
          const l = lines[i];
          stepLine(l, mid, cW, cH);
          l.lifeT += l.lifeSpeed;

          const shimmer = Math.sin(l.lifeT * 60) * 0.5 + 0.5;

          // High floor in dark phase — many lines stay alive and bright
          const pulseFloor = Math.max(globalPulse, 0.55 * isDark + 0.06);
          const a = l.alpha * (0.4 + shimmer * 0.6) * pulseFloor * (1 + high * 0.10);
          const lw = 0.28 + shimmer * 0.27;

          // Dark-phase color strategy — intense saturated colors against pitch black:
          // i%5==0 → intense pure green (hue ~135, s 100%, l 45-65%)
          // i%5==1 → intense pure purple (hue ~275, s 100%, l 40-60%)
          // i%5==2 → intense teal (hue ~185, s 90%, l 45-60%)
          // i%5==3 → white-grey for contrast
          // i%5==4 → normal palette
          let col;
          const mod = i % 5;
          if (isDark > 0.25 && mod === 0) {
            // Intense green
            const l2 = 42 + shimmer * 25;
            col = `hsla(135,100%,${l2 | 0}%,${(a * 1.6).toFixed(3)})`;
          } else if (isDark > 0.25 && mod === 1) {
            // Intense purple
            const l2 = 38 + shimmer * 22;
            col = `hsla(275,100%,${l2 | 0}%,${(a * 1.6).toFixed(3)})`;
          } else if (isDark > 0.25 && mod === 2) {
            // Intense teal
            const l2 = 42 + shimmer * 22;
            col = `hsla(185,90%,${l2 | 0}%,${(a * 1.5).toFixed(3)})`;
          } else if (isDark > 0.25 && mod === 3) {
            // White-grey for contrast
            const w = 50 + shimmer * 35 + isDark * 15;
            col = `hsla(0,0%,${w | 0}%,${(a * 1.4).toFixed(3)})`;
          } else {
            col = lineColor(l.colorPos, colorT, a, bass);
          }

          offCtx.save();
          offCtx.globalCompositeOperation = 'lighter';
          offCtx.strokeStyle = col;
          offCtx.lineWidth   = lw;
          offCtx.lineCap     = 'round';
          offCtx.lineJoin    = 'round';
          offCtx.beginPath();

          const oldest = (l.head - l.len + 1 + TAIL) % TAIL;
          offCtx.moveTo(l.buf[oldest * 2], l.buf[oldest * 2 + 1]);
          for (let s = 1; s < l.len; s++) {
            const idx = (oldest + s) % TAIL;
            offCtx.lineTo(l.buf[idx * 2], l.buf[idx * 2 + 1]);
          }
          offCtx.stroke();
          offCtx.restore();
        }

        // Blit off-buffer to world canvas
        ctx.clearRect(0, 0, cW, cH);
        ctx.drawImage(offCanvas, 0, 0);
      }
    };
  })();

  // ── World lookup ──────────────────────
  const WORLDS = [ocean, geometria, paleozoico, selvaDigital];

  // ── Title color transition ────────────
  function setTitleMode(active) {
    if (!siteTitle) return;
    isCinematic = active;
    const isPaleo = active && activeWorld === 2;

    // Title + subtitle — same light color for ALL worlds including paleozoico
    const titleCol    = active ? '#eeffd3' : '';
    const navCol      = active ? '#9aa08e' : '';
    const worldCol    = active ? 'rgba(245,247,240,0.55)' : '';

    siteTitle.style.transition = 'color 3s ease';
    if (titleCol) siteTitle.style.color = titleCol;
    else siteTitle.style.removeProperty('color');

    if (siteSubtitle) {
      /* Subtitle visibility is CSS-driven on body[data-world]; keep transition for any future use */
      siteSubtitle.style.transition = 'opacity 0.45s ease, visibility 0.45s ease';
    }

    /* Default = CSS (#fff); cinematic = muted green-grey; inline overrides prior exclusion on desktop */
    navItems.forEach(el => {
      el.style.transition = 'color 3s ease';
      if (navCol) {
        el.style.color = navCol;
      } else {
        el.style.removeProperty('color');
      }
    });

    if (worldNameEl) {
      worldNameEl.style.transition = 'color 3s ease';
      worldNameEl.style.color = worldCol;
    }

    if (panelTrigger) {
      panelTrigger.style.transition = 'background-color 3s ease, color 3s ease';
      if (isPaleo) {
        // Clear inline styles — CSS body[data-world="2"] takes over
        panelTrigger.style.backgroundColor = '';
        panelTrigger.style.color           = '';
      } else {
        panelTrigger.style.backgroundColor = active ? '#0a0a0a' : '';
        panelTrigger.style.color           = active ? '#d8d8d0' : '';
      }
      panelTrigger.classList.toggle('cinematic', active);
    }

    playBtn.style.transition  = 'color 3s ease, border-color 3s ease';
    if (isPaleo) {
      // Clear inline styles — CSS body[data-world="2"] takes over
      playBtn.style.color       = '';
      playBtn.style.borderColor = '';
    } else {
      playBtn.style.color       = active ? 'rgba(255,255,255,0.85)' : '';
      playBtn.style.borderColor = active ? 'rgba(255,255,255,0.85)' : '';
    }
  }

  // ── Audio engine ──────────────────────
  let audioCtxShared = null;
  let analyserShared = null;

  function loadAudio(worldIdx) {
    if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
    window._flowfieldAnalyser = null;

    // Plain Audio — no crossOrigin, works on all servers including GitHub Pages
    audioEl = new Audio(AUDIO_SRCS[worldIdx]);
    audioEl.loop   = true;
    audioEl.volume = 0;

    audioEl.play().catch(err => {
      // Retry once after a short delay (browser autoplay policy)
      setTimeout(() => { if (audioEl) audioEl.play().catch(() => {}); }, 400);
    });

    let vol = 0;
    const fi = setInterval(() => {
      vol = Math.min(1, vol + 0.02);
      if (audioEl) audioEl.volume = vol;
      if (vol >= 1) clearInterval(fi);
    }, 80);
  }

  function fadeOutAudio(cb) {
    if (!audioEl) { cb && cb(); return; }
    let vol = audioEl.volume;
    const fo = setInterval(() => {
      vol = Math.max(0, vol - 0.04);
      if (audioEl) audioEl.volume = vol;
      if (vol <= 0) {
        clearInterval(fo);
        if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
        cb && cb();
      }
    }, 60);
  }

  // Expose globally so nav links can stop audio before navigating
  window._stopEcossistemas = function(cb) { fadeOutAudio(cb); };

  // ── Activate a world ──────────────────
  function setWorldPointerEvents(idx) {
    // Enable pointer events on world canvas only for Julia set (world 2)
    // Flowfield (world 3) handles its own click via its internal canvas listener
    worldCanvas.style.pointerEvents = (idx === 2) ? 'auto' : 'none';
  }

  function activateWorld(idx) {
    activeWorld = idx;
    worldT = 0;
    WORLDS[idx].reset();
    worldNameEl.textContent = WORLD_NAMES[idx];
    worldCanvas.classList.add('active');
    if (cinemaVeil) cinemaVeil.classList.add('active');
    worldControls.classList.add('visible');
    setTitleMode(true);
    loadAudio(idx);
    setWorldPointerEvents(idx);
    // Always tear down home mobile nav / legacy menu-open before world attribute (canvas visibility)
    if (typeof window._closeHomeMobileMenu === 'function') window._closeHomeMobileMenu();
    document.body.classList.remove('menu-open', 'home-menu-open');
    document.body.dataset.world = idx;
  }

  // ── Render loop ───────────────────────
  let lastRenderTime = performance.now();

  function renderLoop(now) {
    animFrame = requestAnimationFrame(renderLoop);
    if (activeWorld < 0) return;
    const dt = Math.min(now - lastRenderTime, 80); // cap dt to avoid jumps
    lastRenderTime = now;
    worldT += dt * 0.001;
    const cW = worldCanvas.width;
    const cH = worldCanvas.height;
    ctx.clearRect(0, 0, cW, cH);
    WORLDS[activeWorld].draw(worldT, dt, cW, cH);
  }
  requestAnimationFrame(renderLoop);

  // ── Play button ───────────────────────
  playBtn.addEventListener('click', () => {
    if (!isPlaying) {
      const startWorld = Math.floor(Math.random() * 4);
      isPlaying = true;
      playLabel.textContent = playLabelIdle;
      playIcon.textContent  = '■';
      playBtn.classList.add('playing');
      activateWorld(startWorld);
    } else {
      isPlaying = false;
      playLabel.textContent = playLabelIdle;
      playIcon.textContent  = '▶';
      playBtn.classList.remove('playing');
      worldCanvas.classList.remove('active');
      if (cinemaVeil) cinemaVeil.classList.remove('active');
      worldControls.classList.remove('visible');
      setTitleMode(false);
      fadeOutAudio();
      activeWorld = -1;
      worldCanvas.style.pointerEvents = 'none';
      if (typeof window._closeHomeMobileMenu === 'function') window._closeHomeMobileMenu();
      document.body.classList.remove('menu-open', 'home-menu-open');
      delete document.body.dataset.world;
    }
  });

  // ── Cycle worlds ──────────────────────
  function cycleWorld(dir) {
    if (!isPlaying) return;
    const next = ((activeWorld + dir) + 4) % 4;
    fadeOutAudio(() => {
      activeWorld = next;
      worldT = 0;
      WORLDS[activeWorld].reset();
      worldNameEl.textContent = WORLD_NAMES[activeWorld];
      loadAudio(activeWorld);
      setWorldPointerEvents(activeWorld);
      setTitleMode(true);
      document.body.dataset.world = activeWorld;
    });
  }

  prevBtn.addEventListener('click', () => cycleWorld(-1));
  nextBtn.addEventListener('click', () => cycleWorld(1));

})();
