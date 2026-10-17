// ==========================================
// RISATOYS - LÓGICA DE LA PANTALLA DE ENTRADA
// ==========================================

const introCanvas = document.getElementById('intro-canvas');
const introCtx = introCanvas.getContext('2d');
const shootBtn = document.getElementById('shoot-trigger-btn');
const welcomeScreen = document.getElementById('retro-welcome-screen');

let targetX = 0;
let targetY = 0;
let targetVx = 3;
let targetVy = 2;
let targetRadius = 24;
let targetAngle = 0;
let isShattered = false;

// Configurar resolución del canvas según su contenedor
function setupIntroCanvas() {
    if (!introCanvas || !introCanvas.parentElement) return;
    introCanvas.width = introCanvas.parentElement.clientWidth;
    introCanvas.height = introCanvas.parentElement.clientHeight;
    
    // Posición inicial del objetivo en el centro
    targetX = introCanvas.width / 2;
    targetY = introCanvas.height / 2;
}

setupIntroCanvas();
window.addEventListener('resize', setupIntroCanvas);

// Animación del objetivo / nave rebotando en el cuadro retro
function animateIntro() {
    if (isShattered) return;

    introCtx.fillStyle = '#0a0a10';
    introCtx.fillRect(0, 0, introCanvas.width, introCanvas.height);

    // Mover el objetivo
    targetX += targetVx;
    targetY += targetVy;

    // Rebote en las paredes del contenedor
    if (targetX - targetRadius < 0 || targetX + targetRadius > introCanvas.width) {
        targetVx *= -1;
    }
    if (targetY - targetRadius < 0 || targetY + targetRadius > introCanvas.height) {
        targetVy *= -1;
    }

    // Dibujar nave / objetivo retro en movimiento
    introCtx.save();
    introCtx.translate(targetX, targetY);
    targetAngle += 0.03;
    introCtx.rotate(targetAngle);

    // Anillo giratorio
    introCtx.strokeStyle = '#00f0ff';
    introCtx.lineWidth = 3;
    introCtx.beginPath();
    introCtx.ellipse(0, 0, targetRadius + 8, targetRadius / 3, 0, 0, Math.PI * 2);
    introCtx.stroke();

    // Núcleo central
    introCtx.fillStyle = '#ff2a85';
    introCtx.beginPath();
    introCtx.arc(0, 0, targetRadius, 0, Math.PI * 2);
    introCtx.fill();
    introCtx.strokeStyle = '#ffd000';
    introCtx.lineWidth = 3;
    introCtx.stroke();

    introCtx.restore();

    requestAnimationFrame(animateIntro);
}

// Iniciar bucle del minijuego
animateIntro();

// Función de impacto / disparo que rompe la bienvenida
function triggerShatter() {
    if (isShattered) return;
    isShattered = true;

    // Efecto de ruptura usando la clase CSS
    welcomeScreen.classList.add('shattering');

    // Desaparecer la pantalla de bienvenida para revelar los proyectos
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
    }, 500);
}

// Disparo por clic directo en la nave/cuadro
introCanvas.addEventListener('click', (e) => {
    const rect = introCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calcular si el clic impactó el objetivo
    const dist = Math.hypot(clickX - targetX, clickY - targetY);
    if (dist <= targetRadius + 15) {
        triggerShatter();
    }
});

// Disparo por botón de disparo inferior
if (shootBtn) {
    shootBtn.addEventListener('click', triggerShatter);
}
