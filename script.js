import {wordList} from "./word.js";
// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const textWindow = 60;

let text = "the quick brown fox jumps over the lazy dog";
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

let keyMapper = {};
// for each letter in the alphabet, map it to itself
for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i);
    keyMapper[letter] = letter;
}
keyMapper[' '] = ' ';


let health = 700;
let max_health = 1000;

function randomWord() {
    return wordList[Math.floor(Math.random() * wordList.length)];
}

function render() {
    const now = performance.now();
    fps = Math.round(1000 / (now - lastTime));
    last_fps_counts.push(fps);
    if (last_fps_counts.length > 50) {
        last_fps_counts.shift();
    }
    lastTime = now;

    // add a new word every 100 frames
    if (frame % 10 === 0 && frame !== 0 && counting) {
        text += " " + randomWord();
    }

    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    if (counting) health -= 1 + Math.round((100 - wpm) * 0.05);
    if (wpm > 100) health += Math.round((wpm - 100) * 0.05);
    if (health < 0) health = 0;
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

    requestAnimationFrame(render);
}

function onKey(e) {
    if (text.length === typedText.length || health <= 0) {
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
            handleAppend(keyMapper[e.key.toLowerCase()]);
        }
    }
}

function handleAppend(mappedKey) {
    if (text[typedText.length] === mappedKey) {
        typedText += mappedKey;
        characters++;
    } else {
        health -= 10;
    }
}

window.addEventListener('keydown', onKey);
render();