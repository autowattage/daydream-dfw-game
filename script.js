import {wordList} from "./word.js";
// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let activeScene = 'title';

const textWindow = 60;

let text = "the quick brown fox jumps over the lazy dog";
let typedText = "";
let message = "";

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

let keyMapper = {};
// for each letter in the alphabet, map it to itself
for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i);
    keyMapper[letter] = letter;
}
keyMapper[' '] = ' ';


let health = 700;
let max_health = 1000;

let remapping = false;
let remapKey = null;

function randomWord() {
    return wordList[Math.floor(Math.random() * wordList.length)];
}

let buttons = {
    remap: {
        x: 20,
        y: 250,
        width: 150,
        height: 40,
        text: 'Remap Key'
    }
};

function bbCheck(x, y, button) {
    return (x >= button.x && x <= button.x + button.width &&
        y >= button.y && y <= button.y + button.height);
}

const img = new Image();
img.src = 'assets/work/background.png';

function renderMainScene() {
    if (frame % 10 === 0 && frame !== 0 && counting) {
        text += " " + randomWord();
    }

    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (counting) {
        end_counter = performance.now();
    }
    const average_fps = Math.round(last_fps_counts.reduce((a, b) => a + b, 0) / last_fps_counts.length);
    let wpm = Math.round((characters / 5) / ((end_counter - time_counter) / 60000));
    if (isNaN(wpm)) wpm = 100;
    // Draw frame counter
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`Frame: ${frame}, fps: ${fps}, average: ${average_fps}, wpm: ${wpm}`, 20, 40);

    // Draw text with color coding
    ctx.font = '32px Wendy';
    let x = 20, y = 100;

    const centerIndex = Math.max(0, typedText.length - 1);
    let windowMin = Math.max(0, centerIndex - Math.floor(textWindow / 2));
    let windowMax = Math.min(text.length, windowMin + textWindow);
    for (let i = windowMin; i < windowMax; i++) {
        if (i < typedText.length) {
            ctx.fillStyle = typedText[i] === text[i] ? 'green' : 'red';
        } else {
            ctx.fillStyle = 'black';
        }
        ctx.fillText(text[i], x, y);
        x += ctx.measureText(text[i]).width;
    }

    if (counting) health -= Math.floor(frame / 1000) + Math.max(0, Math.round((50 - wpm) * 0.05));
    if (wpm > 100) health += Math.max(0, Math.round((wpm - 100) * 0.05));
    if (health < 0) {
        health = 700;
        //unmap a random key
        const keys = Object.keys(keyMapper);
        if (keys.length > 1) {
            const keyToRemove = keys[Math.floor(Math.random() * keys.length)];
            keyMapper[keyToRemove] = 'unbound';
            message = `You lost the "${keyToRemove}" key!`;
        }
        frame = 0;
    }
    if (health > max_health) health = max_health;

    let healthWidth = (health / max_health) * 300;
    ctx.fillStyle = 'grey';
    ctx.fillRect(20, 150, 300, 30);
    ctx.fillStyle = 'lime';
    ctx.fillRect(20, 150, healthWidth, 30);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(20, 150, 300, 30);
    ctx.fillStyle = 'black';
    ctx.fillText(`Health: ${health} / ${max_health}`, 25, 172);

    // Draw message
    ctx.fillStyle = 'black';
    ctx.fillText(message, 20, 220);

    // Draw remap button
    const button = buttons.remap;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    ctx.fillText(button.text, button.x + 10, button.y + 30);
}

function renderTitleScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Wendy';
    ctx.fillStyle = 'black';
    ctx.fillText('office click clack', canvas.width / 2 - 150, canvas.height / 2 - 50);

    // button
    ctx.strokeStyle = 'black';
    ctx.strokeRect(canvas.width / 2 - 100, canvas.height / 2, 200, 50);
    ctx.fillText("start", canvas.width / 2 - 40, canvas.height / 2 + 40);
}

function render() {
    const now = performance.now();
    fps = Math.round(1000 / (now - lastTime));
    last_fps_counts.push(fps);
    if (last_fps_counts.length > 50) {
        last_fps_counts.shift();
    }
    lastTime = now;

    if (activeScene === 'main') {
        renderMainScene();
    } else if (activeScene === 'title') {
        renderTitleScene();
    }

    requestAnimationFrame(render);
}

function onKey(e) {
    if (activeScene !== 'main') {
        return;
    }
    // handle arrow keys and allow remapping
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (remapping) {
            if (remapKey === null) {
                remapKey = e.key.toLowerCase();
                message = `Remapping <${remapKey}> to <>`;
            } else {
                keyMapper[remapKey] = e.key.toLowerCase();
                message = `Remapped <${remapKey}> to <${e.key.toLowerCase()}>`;
            }
        }
        else if (typedText.length < text.length) {
            handleAppend(keyMapper[e.key.toLowerCase()]);
        }
        return;
    }
    if (e.key.length === 1) {
        if (e.key === "`")  {
            remapping = !remapping;
            remapKey = null;
            if (remapping) {
                message = "Remapping <>";
            } else {
                message = "";
            }
            return;
        }
        if (remapping) {
            if (remapKey === null) {
                remapKey = e.key.toLowerCase();
                message = `Remapping <${remapKey}> to <>`;
            } else {
                keyMapper[remapKey] = e.key.toLowerCase();
                message = `Remapped <${remapKey}> to <${e.key.toLowerCase()}>`;

                remapKey = null;
                remapping = false;
            }
        }
        if (typedText.length < text.length) {
            if (typedText.length === 0) {
                time_counter = performance.now();
                end_counter = performance.now() + 1;
                characters = 0;
                counting = true;
                frame = 0;
            }
            handleAppend(keyMapper[e.key.toLowerCase()]);
        }
    }
}

function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (activeScene === 'title') {
        // Check if click is within button bounds
        if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 &&
            y >= canvas.height / 2 && y <= canvas.height / 2 + 50) {
            activeScene = 'main';
            typedText = "";
            frame = 0;
            characters = 0;
            counting = false;
        }
    } else if (activeScene === 'main') {
        if (bbCheck(x, y, buttons.remap)) {
            remapping = !remapping;
            remapKey = null;
            if (remapping) {
                message = "Click a key to remap";
            } else {
                message = "";
            }
        }
    }

}

function handleAppend(mappedKey) {
    if (mappedKey === 'unbound') {
        return;
    }
    if (text[typedText.length] === mappedKey) {
        typedText += mappedKey;
        characters++;
    } else {
        health -= 10;
    }
}

window.addEventListener('keydown', onKey);
window.addEventListener('click', onClick);
img.onload = render;