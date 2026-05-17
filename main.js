// ================= НАСТРОЙКИ АНИМАЦИИ (CONFIG) =================
const CONFIG = {
    text: "I LOVE YOU",          // Текст, который будет рисоваться по контуру сердца
    fontFamily: "Italiana, serif", // Шрифт Italiana
    fontWeight: "400",           // Толщина шрифта
    instancesInLoop: 120,        // Количество надписей на один круг (контур)
    startHeartScale: 0.025,      // Стартовый (максимальный) масштаб сердца
    scaleStep: 0.0035,           // На сколько уменьшается масштаб на каждом следующем внутреннем круге
    minHeartScale: 0.002,        // Минимальный масштаб, после которого генерация внутрь останавливается
    fontSizeFactor: 0.026,       // Базовый размер шрифта относительно экрана
    strokeWidthFactor: 0.06,     // Толщина обводки букв относительно размера шрифта
    shadowBlur: 28,              // Размытие неонового свечения
    shadowColor: "rgba(163, 20, 56, 0.45)", // Винный оттенок свечения
    
    // Градиент цвета текста
    gradientColors: [
        { offset: 0, color: "#d38fa6" },
        { offset: 0.5, color: "#b3596f" },
        { offset: 1, color: "#d38fa6" }
    ],

    // Тайминги сердца
    loopAppearanceTime: 1200,    // Время прорисовки одного полного круга контура (мс)
    singleTextDuration: 700      // Время прорисовки одного слова в штрихах (мс)
};
// ===============================================================

const button = document.getElementById('startBtn');
const canvas = document.getElementById('heart');
const ctx = canvas.getContext('2d');
const typewriterElement = document.getElementById('typewriter');

let lastTimestamp = 0;
let textInstances = [];
let globalTimeElapsed = 0;
let animating = false;
const TOTAL_ANIMATION_DURATION = 9999999; 

// --- Параметры и логика печатной машинки ---
const targetPhrase = "I LOVE YOU";
// Возможные ошибочные варианты для симуляции опечаток
const typoPool = [
    "I LOEV",     // Перепутаны буквы местами
    "I LIVE YOU", // Опечатка в букве
    "I LOVVE",    // Двойное нажатие клавиши
    "I LVOE YOU", // Ранняя ошибка
    "I LOVE YUO"  // Ошибка в слове YOU
];

let typewriterQueue = []; // Очередь команд для анимации букв
let currentTypeText = "";
let typewriterTimer = 0;
let queueIndex = 0;

function generateTypewriterPath() {
    currentTypeText = "";
    typewriterQueue = [];
    queueIndex = 0;
    typewriterTimer = 0;

    // Выбираем случайную ошибку из пула
    const typo = typoPool[Math.floor(Math.random() * typoPool.length)];
    
    // Находим, до какого момента ошибочный текст совпадает с правильным
    let matchLength = 0;
    while (matchLength < targetPhrase.length && matchLength < typo.length && targetPhrase[matchLength] === typo[matchLength]) {
        matchLength++;
    }

    // 1. Печатаем правильную часть до ошибки
    for (let i = 1; i <= matchLength; i++) {
        typewriterQueue.push({ action: 'type', text: targetPhrase.substring(0, i), delay: 80 + Math.random() * 120 });
    }

    // 2. Печатаем ошибочный хвост
    for (let i = matchLength + 1; i <= typo.length; i++) {
        typewriterQueue.push({ action: 'type', text: typo.substring(0, i), delay: 70 + Math.random() * 100 });
    }

    // 3. Замираем в замешательстве (осознание ошибки)
    typewriterQueue.push({ action: 'wait', text: typo, delay: 350 + Math.random() * 200 });

    // 4. Стираем ошибочные буквы через Backspace (по одной)
    for (let i = typo.length - 1; i >= matchLength; i--) {
        typewriterQueue.push({ action: 'delete', text: typo.substring(0, i), delay: 50 + Math.random() * 50 });
    }

    // 5. Небольшая пауза перед тем, как начать писать правильно
    typewriterQueue.push({ action: 'wait', text: targetPhrase.substring(0, matchLength), delay: 200 });

    // 6. Допечатываем фразу правильно до самого конца
    for (let i = matchLength + 1; i <= targetPhrase.length; i++) {
        typewriterQueue.push({ action: 'type', text: targetPhrase.substring(0, i), delay: 90 + Math.random() * 140 });
    }
}

function updateTypewriter(deltaTime) {
    if (queueIndex >= typewriterQueue.length) return;

    typewriterTimer += deltaTime;
    const currentStep = typewriterQueue[queueIndex];

    if (typewriterTimer >= currentStep.delay) {
        currentTypeText = currentStep.text;
        typewriterElement.textContent = currentTypeText;
        
        // Добавляем кастомный класс для эффекта мигания каретки во время ожидания
        if (currentStep.action === 'wait') {
            typewriterElement.classList.add('waiting');
        } else {
            typewriterElement.classList.remove('waiting');
        }

        typewriterTimer = 0;
        queueIndex++;
    }
}
// -------------------------------------------

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    if (!canvas.classList.contains('hidden')) {
        drawBackground();
    }
});

resizeCanvas();

function clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function drawBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    ctx.fillStyle = '#0b0a0c';
    ctx.fillRect(0, 0, width, height);

    const g1 = ctx.createRadialGradient(width * 0.15, height * 0.2, 0, width * 0.15, height * 0.2, Math.max(width, height) * 0.75);
    g1.addColorStop(0, 'rgba(117, 14, 38, 0.09)');
    g1.addColorStop(0.5, 'rgba(74, 6, 22, 0.03)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    const g2 = ctx.createRadialGradient(width * 0.85, height * 0.8, 0, width * 0.85, height * 0.8, Math.max(width, height) * 0.75);
    g2.addColorStop(0, 'rgba(145, 42, 64, 0.07)');
    g2.addColorStop(0.6, 'rgba(54, 10, 20, 0.01)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.8);
    bg.addColorStop(0, '#151318');
    bg.addColorStop(1, '#070608');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
}

function getHeartPoint(t, scale) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return {
        x: x * scale,
        y: -y * scale
    };
}

function generateMultiLayerSequence() {
    textInstances = [];
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const centerX = width / 2;
    const centerY = height / 2 - Math.min(width, height) * 0.03;
    const baseFontSize = Math.min(width, height) * CONFIG.fontSizeFactor;

    let currentScale = CONFIG.startHeartScale;
    let globalDelayOffset = 0; 

    while (currentScale > CONFIG.minHeartScale) {
        const scaleRatio = currentScale / CONFIG.startHeartScale;
        const currentFontSize = Math.max(8, baseFontSize * (0.4 + scaleRatio * 0.6));

        for (let i = 0; i < CONFIG.instancesInLoop; i++) {
            const angle = (i / CONFIG.instancesInLoop) * Math.PI * 2;
            const pt = getHeartPoint(angle, Math.min(width, height) * currentScale);

            const localDelay = (i / CONFIG.instancesInLoop) * CONFIG.loopAppearanceTime;
            const finalDelay = globalDelayOffset + localDelay;

            textInstances.push({
                x: centerX + pt.x,
                y: centerY + pt.y,
                fontSize: currentFontSize,
                delay: finalDelay,
                duration: CONFIG.singleTextDuration,
                timeProgress: 0 
            });
        }

        currentScale -= CONFIG.scaleStep;
        globalDelayOffset += CONFIG.loopAppearanceTime * 0.6; 
    }
}

function drawSingleText(inst, progress) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${CONFIG.fontWeight} ${inst.fontSize}px ${CONFIG.fontFamily}`;
    
    ctx.translate(inst.x, inst.y);
    ctx.globalAlpha = clamp(progress * 2);

    const grad = ctx.createLinearGradient(-inst.fontSize, -inst.fontSize, inst.fontSize, inst.fontSize);
    CONFIG.gradientColors.forEach(item => {
        grad.addColorStop(item.offset, item.color);
    });
    
    ctx.strokeStyle = grad;
    ctx.lineWidth = inst.fontSize * CONFIG.strokeWidthFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.shadowColor = CONFIG.shadowColor;
    ctx.shadowBlur = CONFIG.shadowBlur;

    const totalLen = 3000;
    const strokeProgress = easeOutCubic(progress);
    ctx.setLineDash([strokeProgress * totalLen, totalLen]);
    
    ctx.strokeText(CONFIG.text, 0, 0);
    ctx.restore();
}

function startSequence() {
    if (animating) return;
    animating = true;
    button.classList.add('hidden');
    canvas.classList.remove('hidden');
    
    // Показываем блок пишущей машинки
    typewriterElement.classList.remove('hidden');
    
    globalTimeElapsed = 0;
    lastTimestamp = 0;
    
    resizeCanvas();
    generateMultiLayerSequence();
    generateTypewriterPath(); // Генерируем случайный путь опечаток
    requestAnimationFrame(loop);
}

function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    globalTimeElapsed += deltaTime;
    
    drawBackground();
    updateTypewriter(deltaTime); // Обновляем текст пишущей машинки

    for (const inst of textInstances) {
        if (globalTimeElapsed < inst.delay) {
            continue;
        }
        
        inst.timeProgress += deltaTime;
        const instanceProgress = clamp(inst.timeProgress / inst.duration);

        ctx.save();
        ctx.globalAlpha = 1;
        drawSingleText(inst, instanceProgress);
        ctx.restore();
    }

    if (globalTimeElapsed < TOTAL_ANIMATION_DURATION) {
        requestAnimationFrame(loop);
    } else {
        finalizeSequence();
    }
}

function finalizeSequence() {
    animating = false;
}

button.addEventListener('click', startSequence);