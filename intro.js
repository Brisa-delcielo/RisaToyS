(function () {
    const welcomeScreen = document.getElementById('retro-welcome-screen');
    const canvas = document.getElementById('intro-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let destroyed = false;

    function resizeIntro() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resizeIntro();
    window.addEventListener('resize', resizeIntro);

    let shipX = 40;
    let shipSpeed = 2;
    let shipDirection = 1;
    let shipY = 55;

    let laser = null;
    let explosions = [];

    const stars = Array.from({ length: 30 }, () => ({
        x: Math.random() * 500,
        y: Math.random() * 320,
        size: Math.random() * 2 + 1
    }));

    function gameLoop() {
        ctx.fillStyle = '#05050d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#ffffff';
        stars.forEach(s => ctx.fillRect(s.x % canvas.width, s.y % canvas.height, s.size, s.size));

        shipX += shipSpeed * shipDirection;
        if (shipX > canvas.width - 60 || shipX < 20) {
            shipDirection *= -1;
        }

        if (!destroyed) {
            drawRetroTarget(shipX, shipY);
        }

        drawPixelGun(canvas.width / 2, canvas.height - 15);

        if (laser) {
            laser.y += laser.vy;
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(laser.x - 3, laser.y, 6, 16);

            if (!destroyed && Math.abs(laser.x - (shipX + 20)) < 25 && Math.abs(laser.y - shipY) < 20) {
                triggerPacmanDeathAndShatter(shipX + 20, shipY);
                laser = null;
            } else if (laser.y < -20) {
                laser = null;
            }
        }

        explosions.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(p.alpha, 0);
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1.0;
            if (p.alpha <= 0) explosions.splice(index, 1);
        });

        if (!destroyed || explosions.length > 0) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function drawRetroTarget(x, y) {
        ctx.save();
        ctx.fillStyle = '#ffd000';
        ctx.fillRect(x + 10, y - 10, 20, 8);
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(x + 4, y, 32, 10);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(x + 12, y + 2, 16, 6);
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(x, y + 10, 8, 6);
        ctx.fillRect(x + 32, y + 10, 8, 6);
        ctx.restore();
    }

    function drawPixelGun(x, y) {
        ctx.save();
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(x - 6, y - 28, 12, 28);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 3, y - 36, 6, 8);
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(x - 18, y - 6, 36, 10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 2, y - 18, 4, 8);
        ctx.restore();
    }

    function shoot() {
        if (laser || destroyed) return;
        laser = { x: canvas.width / 2, y: canvas.height - 40, vy: -12 };

        if (window.Tone) {
            try {
                Tone.start();
                const synth = new Tone.Synth().toDestination();
                synth.triggerAttackRelease("C6", "16n");
            } catch (e) {}
        }
    }

    canvas.addEventListener('click', shoot);
    document.getElementById('shoot-trigger-btn').addEventListener('click', shoot);

    function triggerPacmanDeathAndShatter(impactX, impactY) {
        destroyed = true;

        if (window.Tone) {
            try {
                Tone.start();
                const now = Tone.now();
                const synth = new Tone.Synth({
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }
                }).toDestination();

                const pacmanNotes = [
                    "B4", "B5", "F#5", "D#5", "B5", "F#5", "D#5",
                    "C5", "C6", "G5", "E5", "C6", "G5", "E5",
                    "B4", "B5", "F#5", "D#5", "B5", "F#5", "D#5",
                    "F5", "F#5", "G5", "G#5", "A5"
                ];

                pacmanNotes.forEach((note, i) => {
                    synth.triggerAttackRelease(note, "32n", now + i * 0.045);
                });
            } catch (e) {}
        }

        for (let i = 0; i < 40; i++) {
            explosions.push({
                x: impactX,
                y: impactY,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: Math.floor(Math.random() * 6) + 4,
                color: ['#ffd000', '#ff2a85', '#00f0ff', '#ffffff'][Math.floor(Math.random() * 4)],
                alpha: 1.0
            });
        }

        setTimeout(() => {
            createGlassShatterEffect();
            welcomeScreen.classList.add('shattering');
            setTimeout(() => {
                welcomeScreen.style.display = 'none';
                cancelAnimationFrame(animationFrameId);
            }, 600);
        }, 300);
    }

    function createGlassShatterEffect() {
        const shatterCanvas = document.createElement('canvas');
        shatterCanvas.id = 'shatter-canvas';
        shatterCanvas.width = window.innerWidth;
        shatterCanvas.height = window.innerHeight;
        document.body.appendChild(shatterCanvas);

        const sCtx = shatterCanvas.getContext('2d');
        const shards = [];

        for (let i = 0; i < 35; i++) {
            shards.push({
                x: Math.random() * shatterCanvas.width,
                y: Math.random() * shatterCanvas.height,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20 - 5,
                rot: 0,
                vRot: (Math.random() - 0.5) * 0.2,
                points: [
                    { x: 0, y: 0 },
                    { x: Math.random() * 60 - 30, y: Math.random() * 60 + 30 },
                    { x: Math.random() * 60 + 30, y: Math.random() * 60 - 30 }
                ],
                alpha: 1.0
            });
        }

        let frame = 0;
        function animateShatter() {
            sCtx.clearRect(0, 0, shatterCanvas.width, shatterCanvas.height);
            shards.forEach(s => {
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.5;
                s.rot += s.vRot;
                s.alpha -= 0.02;

                sCtx.save();
                sCtx.translate(s.x, s.y);
                sCtx.rotate(s.rot);
                sCtx.fillStyle = 'rgba(255, 255, 255, ' + Math.max(s.alpha, 0) + ')';
                sCtx.strokeStyle = 'rgba(0, 240, 255, ' + Math.max(s.alpha, 0) + ')';
                sCtx.lineWidth = 2;

                sCtx.beginPath();
                sCtx.moveTo(s.points[0].x, s.points[0].y);
                sCtx.lineTo(s.points[1].x, s.points[1].y);
                sCtx.lineTo(s.points[2].x, s.points[2].y);
                sCtx.closePath();
                sCtx.fill();
                sCtx.stroke();
                sCtx.restore();
            });

            frame++;
            if (frame < 60) {
                requestAnimationFrame(animateShatter);
            } else {
                shatterCanvas.remove();
            }
        }
        animateShatter();
    }

    gameLoop();
})();
