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

let time_counter = 0;
let end_counter = 0;
let characters = 0;
let counting = false;

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
    if (counting) {
        end_counter = performance.now();
    }
    const average_fps = Math.round(last_fps_counts.reduce((a, b) => a + b, 0) / last_fps_counts.length);
    const wpm = Math.round((characters / 5) / ((end_counter - time_counter) / 60000));
    // Draw frame counter
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`Frame: ${frame}, fps: ${fps}, average: ${average_fps}, wpm: ${wpm}`, 20, 40);

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
    if (text.length === typedText.length) {
        counting = false;
        return;
    }
    if (e.key === 'Backspace') {
        typedText = typedText.slice(0, -1);
    } else if (e.key.length === 1) {
        if (typedText.length < text.length) {
            if (typedText.length === 0) {
                time_counter = performance.now();
                end_counter = performance.now() + 1;
                characters = 0;
                counting = true;
            }
            typedText += e.key;
            characters++;
        }
    }
}

window.addEventListener('keydown', onKey);
render();