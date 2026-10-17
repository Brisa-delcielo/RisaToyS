window.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MINIJUEGO PANTALLA DE ENTRADA & RUPTURA
    // ==========================================
    const introCanvas = document.getElementById('intro-canvas');
    const welcomeScreen = document.getElementById('welcome-screen');
    const shootBtn = document.getElementById('shoot-btn');

    let targetX = 0, targetY = 0;
    let targetVx = 2.5, targetVy = 1.8;
    let targetRadius = 26;
    let targetAngle = 0;
    let isGameActive = true;
    let explosionParticles = [];

    if (introCanvas) {
        const introCtx = introCanvas.getContext('2d');

        function resizeIntroCanvas() {
            if (!introCanvas.parentElement) return;
            introCanvas.width = introCanvas.parentElement.clientWidth || 400;
            introCanvas.height = introCanvas.parentElement.clientHeight || 280;

            if (targetX === 0 && targetY === 0) {
                targetX = introCanvas.width / 2;
                targetY = introCanvas.height / 2;
            }
        }

        resizeIntroCanvas();
        window.addEventListener('resize', resizeIntroCanvas);

        function drawIntroGame() {
            introCtx.fillStyle = '#0a0a10';
            introCtx.fillRect(0, 0, introCanvas.width, introCanvas.height);

            if (isGameActive) {
                // Movimiento
                targetX += targetVx;
                targetY += targetVy;

                if (targetX - targetRadius < 0 || targetX + targetRadius > introCanvas.width) targetVx *= -1;
                if (targetY - targetRadius < 0 || targetY + targetRadius > introCanvas.height) targetVy *= -1;

                // Dibujar Objetivo
                introCtx.save();
                introCtx.translate(targetX, targetY);
                targetAngle += 0.03;
                introCtx.rotate(targetAngle);

                // Anillo exterior
                introCtx.strokeStyle = '#00f0ff';
                introCtx.lineWidth = 3;
                introCtx.beginPath();
                introCtx.ellipse(0, 0, targetRadius + 10, targetRadius / 2.5, 0, 0, Math.PI * 2);
                introCtx.stroke();

                // Núcleo
                introCtx.fillStyle = '#ff2a85';
                introCtx.beginPath();
                introCtx.arc(0, 0, targetRadius, 0, Math.PI * 2);
                introCtx.fill();
                introCtx.strokeStyle = '#ffd000';
                introCtx.lineWidth = 3;
                introCtx.stroke();

                introCtx.restore();
            } else {
                // Animar partículas de explosión
                for (let i = explosionParticles.length - 1; i >= 0; i--) {
                    let p = explosionParticles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.alpha -= 0.03;

                    introCtx.fillStyle = p.color;
                    introCtx.globalAlpha = Math.max(p.alpha, 0);
                    introCtx.fillRect(p.x, p.y, p.size, p.size);
                    introCtx.globalAlpha = 1.0;

                    if (p.alpha <= 0) explosionParticles.splice(i, 1);
                }
            }

            requestAnimationFrame(drawIntroGame);
        }

        drawIntroGame();

        function createExplosion(x, y) {
            explosionParticles = [];
            const colors = ['#ffd000', '#ff2a85', '#00f0ff', '#ffffff'];
            for (let i = 0; i < 40; i++) {
                explosionParticles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    size: Math.random() * 8 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1.0
                });
            }
        }

        function triggerShatter(clickX, clickY) {
            if (!isGameActive) return;
            isGameActive = false;

            const explodeX = clickX || targetX;
            const explodeY = clickY || targetY;

            playPop();
            createExplosion(explodeX, explodeY);

            if (welcomeScreen) {
                setTimeout(() => {
                    welcomeScreen.classList.add('shatter-effect');
                }, 200);

                setTimeout(() => {
                    welcomeScreen.classList.add('hidden');
                }, 800);
            }
        }

        // Disparo por clic o toque directo en todo el canvas
        introCanvas.addEventListener('click', (e) => {
            const rect = introCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Al hacer clic dentro del contenedor, dispara y destruye el objetivo
            triggerShatter(clickX, clickY);
        });

        // Disparo por botón inferior
        if (shootBtn) {
            shootBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerShatter();
            });
        }
    }

    // ==========================================
    // 2. SISTEMA DE AUDIO (TONE.JS)
    // ==========================================
    let soundEnabled = true;
    let synth, noiseSynth;

    function initAudio() {
        if (!synth && typeof Tone !== 'undefined') {
            synth = new Tone.Synth({
                oscillator: { type: "square" },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
            }).toDestination();
            synth.volume.value = -12;

            noiseSynth = new Tone.NoiseSynth({
                noise: { type: "white" },
                envelope: { attack: 0.005, decay: 0.05, sustain: 0 }
            }).toDestination();
            noiseSynth.volume.value = -18;
        }
    }

    window.addEventListener('click', async () => {
        if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
            await Tone.start();
        }
    }, { once: true });

    function playBlip(freq = 440) {
        if (!soundEnabled) return;
        initAudio();
        if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state === 'running') {
            synth.triggerAttackRelease(freq, "8n");
        }
    }

    function playPop() {
        if (!soundEnabled) return;
        initAudio();
        if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state === 'running') {
            noiseSynth.triggerAttackRelease("16n");
        }
    }

    const soundBtn = document.getElementById('sound-toggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundBtn.innerHTML = soundEnabled ? '<span>🔊</span> AUDIO: ON' : '<span>🔇</span> AUDIO: OFF';
            if (soundEnabled) playBlip(600);
        });
    }

    // ==========================================
    // 3. FONDO: POLVO DE ESTRELLAS
    // ==========================================
    const starCanvas = document.getElementById('stardust-canvas');
    if (starCanvas) {
        const starCtx = starCanvas.getContext('2d');
        let particles = [];
        let backgroundStars = [];

        function resizeStarCanvas() {
            starCanvas.width = window.innerWidth;
            starCanvas.height = window.innerHeight;
            
            backgroundStars = [];
            for(let i = 0; i < 60; i++) {
                backgroundStars.push({
                    x: Math.random() * starCanvas.width,
                    y: Math.random() * starCanvas.height,
                    size: Math.random() * 3 + 1,
                    alpha: Math.random()
                });
            }
        }
        resizeStarCanvas();
        window.addEventListener('resize', resizeStarCanvas);

        class StardustParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.floor(Math.random() * 8) + 4;
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4 - 1;
                this.colors = ['#ffd000', '#00f0ff', '#ff2a85', '#00ff66', '#ffffff'];
                this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
                this.life = 1.0;
                this.decay = Math.random() * 0.03 + 0.015;
                this.shape = Math.random() > 0.5 ? 'square' : 'cross';
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
            }

            draw() {
                starCtx.save();
                starCtx.fillStyle = this.color;
                starCtx.globalAlpha = Math.max(this.life, 0);

                if (this.shape === 'square') {
                    starCtx.fillRect(this.x, this.y, this.size, this.size);
                } else {
                    const s = this.size;
                    starCtx.fillRect(this.x - s/2, this.y - s/6, s, s/3);
                    starCtx.fillRect(this.x - s/6, this.y - s/2, s/3, s);
                }
                starCtx.restore();
            }
        }

        function addDust(x, y, count = 2) {
            for (let i = 0; i < count; i++) {
                particles.push(new StardustParticle(x, y));
            }
        }

        window.addEventListener('mousemove', (e) => addDust(e.clientX, e.clientY, 2));
        window.addEventListener('touchmove', (e) => {
            if(e.touches[0]) addDust(e.touches[0].clientX, e.touches[0].clientY, 3);
        });

        window.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
                playPop();
                addDust(e.clientX, e.clientY, 20);
            }
        });

        function animateStardust() {
            starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
            
            starCtx.fillStyle = "#ffffff";
            backgroundStars.forEach(star => {
                star.alpha += (Math.random() - 0.5) * 0.05;
                if(star.alpha < 0.2) star.alpha = 0.2;
                if(star.alpha > 1) star.alpha = 1;
                starCtx.globalAlpha = star.alpha;
                starCtx.fillRect(star.x, star.y, star.size, star.size);
            });

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) particles.splice(i, 1);
            }
            requestAnimationFrame(animateStardust);
        }
        animateStardust();
    }

    // ==========================================
    // 4. FONDO: FÍSICAS (MATTER.JS)
    // ==========================================
    if (typeof Matter !== 'undefined') {
        const Engine = Matter.Engine,
              Render = Matter.Render,
              World = Matter.World,
              Bodies = Matter.Bodies,
              Mouse = Matter.Mouse,
              MouseConstraint = Matter.MouseConstraint;

        const engine = Engine.create();
        engine.world.gravity.y = 0.8;

        const container = document.getElementById('physics-container');
        if (container) {
            const render = Render.create({
                element: container,
                engine: engine,
                options: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    wireframes: false,
                    background: 'transparent' 
                }
            });

            let ground, leftWall, rightWall;

            function updateBounds() {
                const w = window.innerWidth;
                const h = window.innerHeight;
                
                if (ground) World.remove(engine.world, [ground, leftWall, rightWall]);

                ground = Bodies.rectangle(w / 2, h + 30, w * 2, 60, { isStatic: true });
                leftWall = Bodies.rectangle(-30, h / 2, 60, h * 2, { isStatic: true });
                rightWall = Bodies.rectangle(w + 30, h / 2, 60, h * 2, { isStatic: true });

                World.add(engine.world, [ground, leftWall, rightWall]);
                render.canvas.width = w;
                render.canvas.height = h;
            }

            updateBounds();
            window.addEventListener('resize', updateBounds);

            const mouse = Mouse.create(render.canvas);
            const mouseConstraint = MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: { stiffness: 0.2, render: { visible: false } }
            });
            World.add(engine.world, mouseConstraint);

            Matter.Runner.run(engine);
            Render.run(render);

            const colors = ['#ffd000', '#00f0ff', '#ff2a85', '#00ff66'];
            let toys = [];

            function spawnToy() {
                playBlip(523.25);
                const x = Math.random() * (window.innerWidth - 100) + 50;
                const size = Math.floor(Math.random() * 18) + 22;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const shapes = ['box', 'circle', 'polygon'];
                const shapeType = shapes[Math.floor(Math.random() * shapes.length)];

                let body;
                const options = {
                    restitution: 0.8,
                    friction: 0.05,
                    render: { fillStyle: color, strokeStyle: '#000000', lineWidth: 3 }
                };

                if (shapeType === 'box') {
                    body = Bodies.rectangle(x, -50, size * 1.5, size * 1.5, options);
                } else if (shapeType === 'circle') {
                    body = Bodies.circle(x, -50, size, options);
                } else {
                    body = Bodies.polygon(x, -50, 5, size, options);
                }

                toys.push(body);
                World.add(engine.world, body);
            }

            const spawnBtn = document.getElementById('spawn-btn');
            if (spawnBtn) spawnBtn.addEventListener('click', spawnToy);

            const clearBtn = document.getElementById('clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    playPop();
                    toys.forEach(toy => World.remove(engine.world, toy));
                    toys = [];
                });
            }
        }
    }

    // ==========================================
    // 5. CANVASES DE PREVISUALIZACIÓN DE TARJETAS
    // ==========================================
    const c1 = document.getElementById('preview-canvas-1');
    const c2 = document.getElementById('preview-canvas-2');
    const c3 = document.getElementById('preview-canvas-3');

    if (c1 && c2 && c3) {
        const ctx1 = c1.getContext('2d');
        const ctx2 = c2.getContext('2d');
        const ctx3 = c3.getContext('2d');

        function updatePreviewSizes() {
            [c1, c2, c3].forEach(canvas => {
                if (canvas && canvas.parentElement) {
                    const width = canvas.parentElement.clientWidth || 300;
                    if (canvas.width !== width) canvas.width = width;
                    canvas.height = 120;
                }
            });
        }

        window.addEventListener('resize', updatePreviewSizes);

        // Preview VALKYRIE-9
        let angle1 = 0;
        function drawPreview1() {
            updatePreviewSizes();
            const w = c1.width || 300;
            ctx1.clearRect(0, 0, w, 120);

            ctx1.fillStyle = '#080810';
            ctx1.fillRect(0, 0, w, 120);

            ctx1.save();
            ctx1.translate(w / 2, 60);
            ctx1.rotate(0.3);
            ctx1.strokeStyle = '#ffd000';
            ctx1.lineWidth = 4;
            ctx1.beginPath();
            ctx1.ellipse(0, 0, 38, 12, 0, 0, Math.PI * 2);
            ctx1.stroke();
            ctx1.restore();

            ctx1.fillStyle = '#ff2a85';
            ctx1.beginPath();
            ctx1.arc(w / 2, 60, 20, 0, Math.PI * 2);
            ctx1.fill();
            ctx1.lineWidth = 3;
            ctx1.strokeStyle = '#000';
            ctx1.stroke();

            angle1 += 0.03;
            const px = w / 2 + Math.cos(angle1) * 15;
            const py = 60 + Math.sin(angle1) * 6;
            ctx1.fillStyle = '#ffffff';
            ctx1.fillRect(px - 2, py - 2, 4, 4);

            requestAnimationFrame(drawPreview1);
        }
        drawPreview1();

        // Preview APEX
        let bx = 30, by = 30, vx = 2.5, vy = 2;
        function drawPreview2() {
            const w = c2.width || 300;
            ctx2.clearRect(0, 0, w, 120);

            ctx2.fillStyle = '#080810';
            ctx2.fillRect(0, 0, w, 120);

            bx += vx;
            by += vy;

            if (bx < 15 || bx > w - 15) vx *= -1;
            if (by < 15 || by > 105) vy *= -1;

            ctx2.fillStyle = '#00f0ff';
            ctx2.fillRect(bx - 10, by - 10, 20, 20);
            ctx2.strokeStyle = '#000000';
            ctx2.lineWidth = 3;
            ctx2.strokeRect(bx - 10, by - 10, 20, 20);

            requestAnimationFrame(drawPreview2);
        }
        drawPreview2();

        // Preview MISIÓN
        let radarAngle = 0;
        function drawPreview3() {
            const w = c3.width || 300;
            ctx3.clearRect(0, 0, w, 120);

            ctx3.fillStyle = '#080810';
            ctx3.fillRect(0, 0, w, 120);

            ctx3.strokeStyle = '#00ff66';
            ctx3.lineWidth = 2;
            ctx3.beginPath();
            ctx3.arc(w / 2, 60, 38, 0, Math.PI * 2);
            ctx3.arc(w / 2, 60, 18, 0, Math.PI * 2);
            ctx3.stroke();

            radarAngle += 0.04;
            ctx3.save();
            ctx3.translate(w / 2, 60);
            ctx3.rotate(radarAngle);
            ctx3.strokeStyle = '#00ff66';
            ctx3.lineWidth = 2;
            ctx3.beginPath();
            ctx3.moveTo(0, 0);
            ctx3.lineTo(38, 0);
            ctx3.stroke();
            ctx3.restore();

            requestAnimationFrame(drawPreview3);
        }
        drawPreview3();
    }

    document.querySelectorAll('.toy-card:not(.disabled)').forEach(card => {
        card.addEventListener('mouseenter', () => playBlip(300));
    });

});
