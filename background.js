/* ============================================================
   Interstellar backdrop
   - twinkling starfield with mouse parallax
   - occasional shooting stars
   - pointer-reactive "gravitational lensing" glow that brightens
     nearby stars, trailing stardust, and click/tap ripples
   ============================================================ */
(function () {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars = [];
    let shootingStars = [];
    let dust = [];
    let ripples = [];

    let mouseX = -9999, mouseY = -9999;   // raw pointer position
    let glowX = -9999, glowY = -9999;     // eased "gravity well" position
    let hasPointer = false;
    let lastDustX = 0, lastDustY = 0;

    let w, h;

    const ACCENTS = [
        [242, 166, 64],  // amber
        [95, 217, 199],  // teal
        [155, 140, 255]  // violet
    ];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        const count = Math.floor((w * h) / 8000);
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.3 + 0.3,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.008,
            depth: Math.random() * 0.6 + 0.4
        }));
    }
    window.addEventListener('resize', resize);
    resize();

    function setPointer(x, y) {
        mouseX = x; mouseY = y; hasPointer = true;
    }
    window.addEventListener('mousemove', (e) => setPointer(e.clientX, e.clientY));
    window.addEventListener('mouseleave', () => { hasPointer = false; });
    window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', () => { hasPointer = false; });

    function spawnRipple(x, y) {
        ripples.push({ x, y, r: 4, alpha: 0.55, color: ACCENTS[Math.floor(Math.random() * ACCENTS.length)] });
    }
    window.addEventListener('click', (e) => spawnRipple(e.clientX, e.clientY));
    window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) spawnRipple(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    function spawnShootingStar() {
        const fromLeft = Math.random() > 0.5;
        const startY = Math.random() * h * 0.5;
        shootingStars.push({
            x: fromLeft ? -50 : w + 50,
            y: startY,
            vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 4),
            vy: 2.5 + Math.random() * 1.5,
            life: 0,
            maxLife: 40 + Math.random() * 20,
            len: 90 + Math.random() * 60
        });
    }

    function spawnDust(x, y) {
        const c = ACCENTS[Math.floor(Math.random() * ACCENTS.length)];
        dust.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            r: Math.random() * 1.6 + 0.6,
            life: 0,
            maxLife: 50 + Math.random() * 30,
            color: c
        });
    }

    let t = 0;
    let nextShoot = 120 + Math.random() * 200;

    function draw() {
        ctx.clearRect(0, 0, w, h);

        // ease the "gravity well" toward the real pointer position
        if (hasPointer) {
            glowX += (mouseX - glowX) * 0.12;
            glowY += (mouseY - glowY) * 0.12;
        }

        // ---- gravitational lensing glow under the cursor ----
        if (hasPointer) {
            const grad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 170);
            grad.addColorStop(0, 'rgba(242, 166, 64, 0.10)');
            grad.addColorStop(0.5, 'rgba(155, 140, 255, 0.05)');
            grad.addColorStop(1, 'rgba(95, 217, 199, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(glowX, glowY, 170, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---- stars (brighten + slightly magnify near the pointer) ----
        for (const s of stars) {
            const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed + s.phase));
            const px = s.x + (mouseX === -9999 ? 0 : (mouseX / w - 0.5)) * 16 * s.depth;
            const py = s.y + (mouseY === -9999 ? 0 : (mouseY / h - 0.5)) * 16 * s.depth;

            let boost = 0;
            let sizeBoost = 0;
            if (hasPointer) {
                const dx = px - glowX, dy = py - glowY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 160) {
                    const f = 1 - dist / 160;
                    boost = f * 0.6;
                    sizeBoost = f * 1.3;
                }
            }

            ctx.beginPath();
            ctx.arc(px, py, s.r + sizeBoost, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(234, 230, 218, ${Math.min(1, twinkle * 0.85 + boost)})`;
            ctx.fill();
        }

        // ---- stardust trail following the pointer ----
        if (!reduceMotion && hasPointer) {
            const dx = mouseX - lastDustX, dy = mouseY - lastDustY;
            if (Math.sqrt(dx * dx + dy * dy) > 6) {
                spawnDust(mouseX, mouseY);
                lastDustX = mouseX; lastDustY = mouseY;
            }
        }
        dust.forEach((d) => {
            d.x += d.vx; d.y += d.vy; d.life++;
            const alpha = Math.max(0, 1 - d.life / d.maxLife);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r * alpha, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${d.color[0]}, ${d.color[1]}, ${d.color[2]}, ${alpha * 0.7})`;
            ctx.fill();
        });
        dust = dust.filter((d) => d.life < d.maxLife);

        // ---- click / tap ripples ----
        ripples.forEach((r) => {
            r.r += 3.2;
            r.alpha *= 0.955;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r.color[0]}, ${r.color[1]}, ${r.color[2]}, ${r.alpha})`;
            ctx.lineWidth = 1.4;
            ctx.stroke();
        });
        ripples = ripples.filter((r) => r.alpha > 0.02);

        // ---- shooting stars ----
        if (!reduceMotion) {
            if (t > nextShoot) {
                spawnShootingStar();
                nextShoot = t + 180 + Math.random() * 260;
            }
            shootingStars.forEach((s) => {
                s.x += s.vx;
                s.y += s.vy;
                s.life++;
                const alpha = Math.max(0, 1 - s.life / s.maxLife);
                const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * (s.len / 8), s.y - s.vy * (s.len / 8));
                grad.addColorStop(0, `rgba(242, 166, 64, ${alpha})`);
                grad.addColorStop(1, 'rgba(242, 166, 64, 0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * (s.len / 8), s.y - s.vy * (s.len / 8));
                ctx.stroke();
            });
            shootingStars = shootingStars.filter((s) => s.life < s.maxLife && s.x > -100 && s.x < w + 100);
        }

        t += 1;
        requestAnimationFrame(draw);
    }
    draw();
})();
