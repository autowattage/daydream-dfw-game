import {wordList} from "./word.js";
import {keycaps} from "./keycaps.js";
import {GIF} from "./gif_reader.js";
// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let activeScene = 'title';

const textWindow = 32;

let text = "the quick brown fox jumps over the lazy dog";
let typedText = "";
let lastTyped = "_";
let message = "Remap keys with `! It is on the top left, under the <ESC> key.";

// Assume canvas, ctx, text, and typedText are already defined
let frame = 0;
let frameEffective = 0;

let startTime = Date.now();
let endTime = Date.now();

let fps = 0;
let lastTime = performance.now();
// keep the last 50 fps
let last_fps_counts = [];

let time_counter = 0;
let end_counter = 0;
let characters = 0;
let counting = false;
let lives = 3;

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

ctx.imageSmoothingEnabled = false;

function randomWord() {
    return wordList[Math.floor(Math.random() * wordList.length)];
}

const backgroundImage = new Image();
backgroundImage.src = 'assets/work/background.png';

const hudImage = new Image();
hudImage.src = 'assets/work/hud.png';

const gif = new GIF();
gif.load('assets/work/pawn-shapeshift.gif');

function renderMainScene() {
    if (frame % 10 === 0 && frame !== 0 && counting) {
        text += " " + randomWord();
    }

    frame++;
    frameEffective++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    if (!gif.loading) {
        ctx.drawImage(gif.frames[Math.floor(frame / 3) % 38].image, 640 + 640 * Math.sin(frame / 300), 260, 82, 84)
    }
    ctx.drawImage(hudImage, 0, 0, canvas.width, canvas.height);

    if (counting) {
        end_counter = performance.now();
    }
    const average_fps = Math.round(last_fps_counts.reduce((a, b) => a + b, 0) / last_fps_counts.length);
    let wpm = Math.round((characters / 5) / ((end_counter - time_counter) / 60000));
    if (isNaN(wpm)) wpm = 100;
    // Draw frame counter
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`frame: ${frame}, fps: ${fps}, average: ${average_fps}, wpm: ${wpm}`, 20, 40);

    ctx.font = '40px Wendy';
    ctx.fillStyle = '#DBD7CF';
    for (const kc of keycaps) {
        let text_to_render = keyMapper[kc.text.toLowerCase()] === 'unbound' ? '' : keyMapper[kc.text.toLowerCase()];
        // if the letter is ont in the key mapper, use the kc
        if (text_to_render === undefined) text_to_render = kc.text;
        if (text_to_render === ' ') text_to_render = "_";

        if (remapping && remapKey === kc.text.toLowerCase()) {
            ctx.fillStyle = 'yellow';
        }
        ctx.fillText(text_to_render, kc.x, kc.y);
        ctx.fillStyle = '#DBD7CF';
    }

    // Draw text with color coding
    ctx.font = '50px Wendy';
    let x = 400, y = 185;

    const centerIndex = Math.max(0, typedText.length - 1);
    let windowMin = Math.max(0, centerIndex - Math.floor(textWindow / 2));
    let windowMax = Math.min(text.length, windowMin + textWindow);
    for (let i = windowMin; i < windowMax; i++) {
        if (i < typedText.length) {
            ctx.fillStyle = typedText[i] === text[i] ? '#6ABE30' : 'red';
        } else {
            ctx.fillStyle = 'white';
        }
        ctx.fillText(text[i], x, y);
        x += ctx.measureText(text[i]).width;
    }
    ctx.fillStyle = '#DBD7CF';
    ctx.font = '120px Wendy';
    ctx.fillText(lastTyped, 246 + 42, 136 + 90);

    if (counting) health -= Math.floor(frameEffective / 1000) + Math.max(0, Math.round((50 - wpm) * 0.05));
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
        frameEffective = 0;
        lives--;
        if (lives === 0) {
            activeScene = "lost";
            endTime = Date.now();
        }
    }
    if (health > max_health) health = max_health;

    // the health height is 78 * 2 px
    const missingHealth = max_health - health;
    const mHealthHeight = Math.floor((missingHealth / max_health) * (78 * 2));
    ctx.fillStyle = '#6ABE30';
    ctx.fillRect(246, 388 + mHealthHeight, 120, 78 * 2 - mHealthHeight);

    // Draw message
    ctx.fillStyle = 'black';
    ctx.font = '32px Wendy';
    ctx.fillText(message, 246, 130);


    ctx.fillStyle = '#DBD7CF';
    if (!counting) {
        ctx.fillStyle = 'gray';
    }
    ctx.font = '60px Wendy';
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const fmtTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillText(fmtTime, 255, 365);
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

function renderLoseScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Wendy';
    ctx.fillStyle = 'black';
    ctx.fillText('you lost buddy', canvas.width / 2 - 150, canvas.height / 2 - 50);
    const elapsed = endTime - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const fmtTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillText(`you lasted ${fmtTime}`, canvas.width / 2 - 150, canvas.height / 2 + 50);
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
    } else if (activeScene === "lost") {
        renderLoseScene();
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
            switch (e.key) {
                case "ArrowLeft":
                    lastTyped = "<";
                    break;
                case "ArrowRight":
                    lastTyped = ">";
                    break;
                case "ArrowUp":
                    lastTyped = "'";
                    break;
                case "ArrowDown":
                    lastTyped = ".";
            }
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
                // check if the key is already unbound
                if (keyMapper[remapKey] === 'unbound') {
                    message = `<${remapKey}> is not allowed!`;
                    remapKey = null;
                    remapping = false;
                    return;
                }
                message = `Remapping <${remapKey}> to <>`;
            } else {
                keyMapper[remapKey] = e.key.toLowerCase();
                message = `Remapped <${remapKey}> to <${e.key.toLowerCase()}>`;

                remapKey = null;
                remapping = false;
            }
            return;
        }
        if (typedText.length < text.length) {
            lastTyped = e.key.toUpperCase();
            if (typedText.length === 0) {
                time_counter = performance.now();
                end_counter = performance.now() + 1;
                characters = 0;
                counting = true;
                frameEffective = 0;
                startTime = Date.now();
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
            frameEffective = 0;
            characters = 0;
            counting = false;
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

const assetLoadFuture = Promise.all([
    new Promise((resolve) => { backgroundImage.onload = resolve; }),
    new Promise((resolve) => { hudImage.onload = resolve; })
]);

window.addEventListener('keydown', onKey);
window.addEventListener('click', onClick);
assetLoadFuture.then(render);