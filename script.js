import {wordList, keycaps} from "./word.js";
import {GIF} from "./gif_reader.js";
// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const target_fps = 40;
let activeScene = 'title';

const textWindow = 32;

let text = "the quick brown fox jumps over the lazy dog";
let typedText = "";
let lastTyped = "_";
let message = "REMAP = ~";

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

let opacity = 0;

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

const emptyHeartImage = new Image();
emptyHeartImage.src = 'assets/work/heart-empty.png';

const titlescreenImage = new Image();
titlescreenImage.src = 'assets/work/titlescreen.png';

const gif = new GIF();
gif.load('assets/work/pawn-shapeshift.gif');

const lose_gif = new GIF();
lose_gif.load('assets/work/stamp.gif');

function renderMainScene() {
    if (frame % 10 === 0 && frame !== 0 && counting) {
        text += " " + randomWord();
    }

    opacity /= 1.05;

    frame++;
    frameEffective++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    if (!gif.loading) {
        ctx.drawImage(gif.frames[Math.floor(frame / 3) % 38].image, 640 + 640 * Math.sin(frame / 300), 260, 82, 84)
    }
    ctx.drawImage(hudImage, 0, 0, canvas.width, canvas.height);
    if (lives < 3)
        ctx.drawImage(emptyHeartImage, 252, 554, 30, 30)
    if (lives < 2)
        ctx.drawImage(emptyHeartImage, 292, 554, 30, 30)

    // draw a semitransparent rectangle
    ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (counting) {
        end_counter = performance.now();
    }
    const average_fps = Math.round(last_fps_counts.reduce((a, b) => a + b, 0) / last_fps_counts.length);
    let wpm = Math.round((characters / 5) / ((end_counter - time_counter) / 60000));
    if (isNaN(wpm)) wpm = 100;
    // Draw frame counter
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    if (fps < 0.85 * target_fps || fps > 1.15 * target_fps) {
        ctx.fillStyle = 'red';
    }
    ctx.fillText(`fps: ${fps}/${target_fps}, ao50 fps: ${average_fps}/${target_fps}`, 5, 16);

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
        if (kc.text.toLowerCase() === lastTyped.toLowerCase()) {
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
            message = `You lost the "${keyToRemove === " " ? "SPACE": keyToRemove}" key!`;
        }
        frameEffective = 0;
        lives--;
        opacity = 1;
        if (lives === 0) {
            activeScene = "lost";
            endTime = Date.now();
            frame = 0;
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
    if (opacity > 0.01) {
        ctx.fillStyle = 'red';
    }
    ctx.font = '40px Wendy';
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

    const fmtSpd = `${wpm} WPM`;
    ctx.font = '40px Wendy';
    if (wpm > 100) {
        ctx.fillStyle = '#6ABE30';
    } else if (wpm < 50) {
        ctx.fillStyle = '#AC3232';
    }
    ctx.fillText(fmtSpd, 252, 295)
}
function renderTitleScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(titlescreenImage, 0, 0, canvas.width, canvas.height);
}
function renderLoseScene() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '48px Wendy';
    ctx.fillStyle = 'white';
    if (lose_gif.loading) {
        frame = 0;
        return;
    }
    if (!lose_gif.loading && frame < 22 * 3) {
        ctx.drawImage(lose_gif.frames[Math.floor(frame / 3)].image, canvas.width / 2 - 320, canvas.height / 2 - 180)
    } else {
        const elapsed = endTime - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const fmtTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        ctx.drawImage(lose_gif.frames[lose_gif.frameCount - 1].image, canvas.width / 2 - 320, canvas.height / 2 - 180)
        if (frame >= 22 * 3 + 10) {
            ctx.fillText(`you lasted ${fmtTime}`, canvas.width / 2 - 150, canvas.height / 2 + 200);
            ctx.fillText(`type <ENTER> to go back to the title`, canvas.width / 2 - 150, canvas.height / 2 + 250);
        }
    }
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

    setTimeout(render, 1000 / target_fps);
}

function onKey(e) {
    if (activeScene === 'title' && e.key === "Enter") {
        activeScene = 'main';
        typedText = "";
        frame = 0;
        frameEffective = 0;
        characters = 0;
        counting = false;
    }
    if (activeScene === 'lost' && e.key === "Enter") {
        activeScene = 'title';
        lives = 3;
        health = 700;
        keyMapper = {};
        // for each letter in the alphabet, map it to itself
        for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(97 + i);
            keyMapper[letter] = letter;
        }
        keyMapper[' '] = ' ';
        text = "the quick brown fox jumps over the lazy dog";
        typedText = "";
        frame = 0;
        frameEffective = 0;
        characters = 0;
        counting = false;
        message = "REMAP = ~";
        opacity = 0;
    }
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
    new Promise((resolve) => { hudImage.onload = resolve; }),
    new Promise((resolve) => { emptyHeartImage.onload = resolve; }),
    new Promise((resolve) => { titlescreenImage.onload = resolve; }),
]);

window.addEventListener('keydown', onKey);
assetLoadFuture.then(render);
