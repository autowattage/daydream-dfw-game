// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const text = "the quick brown fox jumps over the lazy dog";
let typedText = "";

// Assume canvas, ctx, text, and typedText are already defined
let frame = 0;
let fps = 0;
let lastTime = performance.now();
// keep the last 50 fps
let last_fps_counts = [];

function render() {
    const now = performance.now();
    fps = Math.round(1000 / (now - lastTime));
    last_fps_counts.push(fps);
    if (last_fps_counts.length > 50) {
        last_fps_counts.shift();
    }
    lastTime = now;

    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw frame counter
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`Frame: ${frame}, fps: ${fps}, average: ${last_fps_counts.values().}`, 20, 40);

    // Draw text with color coding
    ctx.font = '32px Wendy';
    let x = 20, y = 100;
    for (let i = 0; i < text.length; i++) {
        if (i < typedText.length) {
            ctx.fillStyle = typedText[i] === text[i] ? 'green' : 'red';
        } else {
            ctx.fillStyle = 'black';
        }
        ctx.fillText(text[i], x, y);
        x += ctx.measureText(text[i]).width;
    }

    requestAnimationFrame(render);
}

function onKey(e) {
    if (e.key === 'Backspace') {
        typedText = typedText.slice(0, -1);
    } else if (e.key.length === 1) {
        if (typedText.length < text.length) {
            typedText += e.key;
        }
    }
}

window.addEventListener('keydown', onKey);
render();