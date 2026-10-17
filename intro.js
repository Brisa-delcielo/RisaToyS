// ==========================================
// 1. GESTIÓN DE AUDIO (TONE.JS)
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
// 2. FONDO INTERACTIVO: POLVO DE ESTRELLAS
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
// 3. FONDO INTERACTIVO: FÍSICAS (MATTER.JS)
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

        const spawnBtn = document.getElementById('spawn-toy-btn');
        if (spawnBtn) spawnBtn.addEventListener('click', spawnToy);

        const clearBtn = document.getElementById('clear-toys-btn');
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
// 4. ANIMACIÓN DE MINI CANVASES (PROYECTOS)
// ==========================================
const c1 = document.getElementById('mini-canvas-1');
const c2 = document.getElementById('mini-canvas-2');
const c3 = document.getElementById('mini-canvas-3');

if (c1 && c2 && c3) {
    const ctx1 = c1.getContext('2d');
    const ctx2 = c2.getContext('2d');
    const ctx3 = c3.getContext('2d');

    function updateMiniCanvasDimensions() {
        [c1, c2, c3].forEach(canvas => {
            if (canvas && canvas.parentElement) {
                const width = canvas.parentElement.clientWidth || 300;
                if (canvas.width !== width) canvas.width = width;
                canvas.height = 120;
            }
        });
    }

    window.addEventListener('resize', updateMiniCanvasDimensions);

    // VALKYRIE-9
    let angle1 = 0;
    function drawCanvas1() {
        updateMiniCanvasDimensions();
        const w = c1.width || 300;
        ctx1.clearRect(0, 0, w, 120);

        ctx1.fillStyle = '#080810';
        ctx1.fillRect(0, 0, w, 120);

        ctx1.save();
        ctx1.translate(w/2, 60);
        ctx1.rotate(0.3);
        ctx1.strokeStyle = '#ffd000';
        ctx1.lineWidth = 4;
        ctx1.beginPath();
        ctx1.ellipse(0, 0, 38, 12, 0, 0, Math.PI * 2);
        ctx1.stroke();
        ctx1.restore();

        ctx1.fillStyle = '#ff2a85';
        ctx1.beginPath();
        ctx1.arc(w/2, 60, 20, 0, Math.PI * 2);
        ctx1.fill();
        ctx1.lineWidth = 3;
        ctx1.strokeStyle = '#000';
        ctx1.stroke();

        angle1 += 0.03;
        const px = w/2 + Math.cos(angle1) * 15;
        const py = 60 + Math.sin(angle1) * 6;
        ctx1.fillStyle = '#ffffff';
        ctx1.fillRect(px - 2, py - 2, 4, 4);

        requestAnimationFrame(drawCanvas1);
    }
    drawCanvas1();

    // APEX
    let bx = 30, by = 30, vx = 2.5, vy = 2;
    function drawCanvas2() {
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

        requestAnimationFrame(drawCanvas2);
    }
    drawCanvas2();

    // MISIÓN
    let radarAngle = 0;
    function drawCanvas3() {
        const w = c3.width || 300;
        ctx3.clearRect(0, 0, w, 120);

        ctx3.fillStyle = '#080810';
        ctx3.fillRect(0, 0, w, 120);

        ctx3.strokeStyle = '#00ff66';
        ctx3.lineWidth = 2;
        ctx3.beginPath();
        ctx3.arc(w/2, 60, 38, 0, Math.PI * 2);
        ctx3.arc(w/2, 60, 18, 0, Math.PI * 2);
        ctx3.stroke();

        radarAngle += 0.04;
        ctx3.save();
        ctx3.translate(w/2, 60);
        ctx3.rotate(radarAngle);
        ctx3.strokeStyle = '#00ff66';
        ctx3.lineWidth = 2;
        ctx3.beginPath();
        ctx3.moveTo(0, 0);
        ctx3.lineTo(38, 0);
        ctx3.stroke();
        ctx3.restore();

        requestAnimationFrame(drawCanvas3);
    }
    drawCanvas3();
}

document.querySelectorAll('.toy-card:not(.disabled)').forEach(card => {
    card.addEventListener('mouseenter', () => playBlip(300));
});
