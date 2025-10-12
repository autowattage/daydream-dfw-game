// noinspection DuplicatedCode

import {keycaps, wordList} from "./word.js";
import {GIF} from "./gif_reader.js";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const target_fps = 40;
let activeScene = 'title';
let doAudio = false;
let audioFadeProgress = 0;

ctx.imageSmoothingEnabled = false;

// textures
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

const titlescreen_sound = new Audio('assets/work/titlescreen.wav');
titlescreen_sound.loop = true;

const carls_theme = new Audio('assets/work/carls-theme.wav');

const easter_egg = new Audio('assets/work/driving-in-my-car.wav');
const easter_egg_chance = 0.001;

const textWindow = 32;

let gameState;
let lastTime = performance.now();
let blockTime = 0;
let frame = 0;

function resetGameState() {
  gameState = {
    active: false,

    // statistics
    startTime: Date.now(),
    lifeTime: Date.now(),
    endTime: Date.now(),
    wpmDeque: [],

    // health data
    lifeLossOpacity: 0,
    lives: 3,
    health: 700,
    maxHealth: 1000,

    // textual hud
    text: "the quick brown fox jumps over the lazy dog",
    typedText: "",
    lastTyped: "_",
    message: "REMAP = ~ | <CTRL + M> = play music",

    // remapper
    keyMapper: {},
    remapping: false,
    remapKey: null,

    // tutorial
    tutorial: {
      isTutorial: true,
      state: 0,
      states: [
        "Welcome to\noffice click clack :)",
        "<-- This is Carl\nhe's an office worker.",
        "He needs to type the text\nabove there.",
        "He can use any letter or\nnumber. He can also use\nspecial chars like -,.= etc.",
        "Sometimes, his boss Owen\ntakes away a key.",
        "Carl needs to remap a key.\nType the ~ key,\nbelow <ESC>\n",
        "Then, type the key you \nwant to remap. Try typing\nthe <Q> key.",
        "Now, press <T>",
        "Now, when you press <Q>,\nIt types 'T'!",
        "You can only use keys\nOwen hasn't taken away.",
        "You can remap go back by\nHitting ~, then <Q> twice.",
        "Good luck and have fun!"
      ]
    }
  }

  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i);
    gameState.keyMapper[letter] = letter;
  }
  gameState.keyMapper[' '] = ' ';

}

resetGameState();

function randomWord() {
  return wordList[Math.floor(Math.random() * wordList.length)];
}

function renderMainScene() {
  // update text
  if (gameState.active && gameState.text.length - gameState.typedText.length <= 20) {
    gameState.text += " " + randomWord();
  }

  // update opacity
  gameState.lifeLossOpacity /= 1.05;

  // metrics updater
  const now = performance.now();
  const fps = Math.round(1000 / (now - lastTime));
  const earliest = gameState.wpmDeque[0] || Date.now() + 1000;
  const wpm = Math.round((gameState.wpmDeque.length / 4) / ((Date.now() - earliest) / 60000));
  // remove all entries older than 30 seconds
  while (gameState.wpmDeque.length > 0 && Date.now() - gameState.wpmDeque[0] > 30000) {
    gameState.wpmDeque.shift();
  }
  lastTime = now;

  // music player
  if (doAudio) {
    if (gameState.active && carls_theme.paused && easter_egg.paused) {
      const roll = Math.random();
      console.log(roll);
      if (roll < easter_egg_chance) {
        easter_egg.play();
      } else {
        carls_theme.play();
      }
    }
    if (gameState.active && !titlescreen_sound.paused && audioFadeProgress < 1) {
      audioFadeProgress += 0.05;
      titlescreen_sound.volume = Math.max(0, 1 - audioFadeProgress);
      carls_theme.volume = Math.min(1, audioFadeProgress);
      easter_egg.volume = Math.min(1, audioFadeProgress);
    }
  }

  // background image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  if (!gif.loading) {
    ctx.drawImage(gif.frames[Math.floor(frame / 3) % 38].image, 640 + 640 * Math.sin(frame / 300), 260, 82, 84)
  }
  ctx.drawImage(hudImage, 0, 0, canvas.width, canvas.height);

  // heart drawer
  if (gameState.lives < 3)
    ctx.drawImage(emptyHeartImage, 252, 554, 30, 30)
  if (gameState.lives < 2)
    ctx.drawImage(emptyHeartImage, 292, 554, 30, 30)

  // life loss rectangle
  ctx.fillStyle = `rgba(255, 0, 0, ${gameState.lifeLossOpacity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw frame counter
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  if (fps < 0.85 * target_fps || fps > 1.15 * target_fps) {
    ctx.fillStyle = 'red';
  }
  ctx.fillText(`fps: ${fps}/${target_fps}, block time: ${blockTime}`, 5, 16);

  // keycap mapper
  ctx.font = '40px Wendy';
  ctx.fillStyle = '#DBD7CF';
  for (const kc of keycaps) {
    let text_to_render = gameState.keyMapper[kc.text.toLowerCase()] === 'unbound' ? '' : gameState.keyMapper[kc.text.toLowerCase()];
    // if the letter is ont in the key mapper, use the kc
    if (text_to_render === undefined) text_to_render = kc.text;
    if (text_to_render === ' ') text_to_render = "_";

    if (gameState.remapping && gameState.remapKey === kc.text.toLowerCase()) {
      ctx.fillStyle = 'yellow';
    }
    if (kc.text.toLowerCase() === gameState.lastTyped.toLowerCase()) {
      ctx.fillStyle = 'yellow';
    }
    ctx.fillText(text_to_render, kc.x, kc.y);
    ctx.fillStyle = '#DBD7CF';
  }

  // Draw text with color coding
  ctx.font = '50px Wendy';
  let x = 400, y = 185;
  const centerIndex = Math.max(0, gameState.typedText.length - 1);
  let windowMin = Math.max(0, centerIndex - Math.floor(textWindow / 2));
  let windowMax = Math.min(gameState.text.length, windowMin + textWindow);
  for (let i = windowMin; i < windowMax; i++) {
    if (i < gameState.typedText.length) {
      ctx.fillStyle = '#6ABE30';
    } else {
      ctx.fillStyle = 'white';
    }
    ctx.fillText(gameState.text[i], x, y);
    x += ctx.measureText(gameState.text[i]).width;
  }
  ctx.fillStyle = '#DBD7CF';
  ctx.font = '120px Wendy';
  ctx.fillText(gameState.lastTyped, 246 + 42, 136 + 90);

  // health manager
  const half_minute_elapsed = (Date.now() - gameState.lifeTime) / (1000 * 30);
  const regenLevel = 100 + half_minute_elapsed * 10;
  const drainLevel = 50 - half_minute_elapsed * 10;
  if (gameState.active) {
    if (wpm > regenLevel) {
      gameState.health += Math.max(0, Math.round((wpm - regenLevel) * 0.05));
    } else if (wpm < drainLevel) {
      gameState.health -= Math.max(0, Math.round((50 - wpm) * 0.05));
    }
    gameState.health -= half_minute_elapsed;
  }
  if (gameState.health < 0) {
    gameState.health = 700;
    //unmap a random key
    const keys = Object.keys(gameState.keyMapper);
    if (keys.length > 1) {
      const keyToRemove = keys[Math.floor(Math.random() * keys.length)];
      gameState.keyMapper[keyToRemove] = 'unbound';
      gameState.message = `You lost the "${keyToRemove === " " ? "SPACE" : keyToRemove}" key!`;
    }
    gameState.lifeTime = Date.now();
    gameState.lives--;
    gameState.lifeLossOpacity = 1;
    if (gameState.lives === 0) {
      activeScene = "lost";
      gameState.endTime = Date.now();
      frame = 0;
    }
  }
  if (gameState.health > gameState.maxHealth) gameState.health = gameState.maxHealth;

  // health bar drawer
  const missingHealth = gameState.maxHealth - gameState.health;
  const mHealthHeight = Math.floor((missingHealth / gameState.maxHealth) * (78 * 2));
  ctx.fillStyle = '#6ABE30';
  ctx.fillRect(246, 388 + mHealthHeight, 120, 78 * 2 - mHealthHeight);

  // Draw message
  ctx.fillStyle = 'black';
  if (gameState.lifeLossOpacity > 0.01) {
    ctx.fillStyle = 'red';
  }
  ctx.font = '40px Wendy';
  ctx.fillText(gameState.message, 246, 130);


  ctx.fillStyle = '#DBD7CF';
  if (!gameState.active) {
    ctx.fillStyle = 'gray';
  }
  ctx.font = '60px Wendy';
  const elapsed = Date.now() - gameState.startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const fmtTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  ctx.fillText(fmtTime, 255, 365);

  const fmtSpd = `${wpm} WPM`;
  ctx.font = '40px Wendy';
  if (wpm > regenLevel) {
    ctx.fillStyle = '#6ABE30';
  } else if (wpm < drainLevel) {
    ctx.fillStyle = '#AC3232';
  }
  if (!gameState.active) {
    ctx.fillStyle = 'gray';
  }
  ctx.fillText(fmtSpd, 252, 295);

  if (gameState.tutorial.isTutorial) {
    ctx.fillStyle = '#222034';
    ctx.beginPath();
    ctx.roundRect(640, 226, 300, 136, 20);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = '30px Wendy';

    function drawWithLineBreaks(text, x, y) {
      const parts = text.split('\n');
      for (const part of parts) {
        ctx.fillText(part, x, y);

        const metrics = ctx.measureText(part);
        y += metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      }
    }

    drawWithLineBreaks(gameState.tutorial.states[gameState.tutorial.state], 650, 260);

    if (gameState.tutorial.state === 0) {
      ctx.fillText("<ESC> to skip", 650, 328);
    }
    ctx.fillText("<ENT> to continue", 650, 350)
  }
}

function renderTitleScene() {

  if (doAudio && titlescreen_sound.paused) {
    titlescreen_sound.play();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(titlescreenImage, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#DBD7CF';
  ctx.strokeStyle = '#222034';
  ctx.lineWidth = 3;
  ctx.font = '30px Wendy';

  ctx.strokeText('Press <M> to enable sound!', 10, 700)
  ctx.fillText('Press <M> to enable sound!', 10, 700);
}

function renderLoseScene() {
  if (!carls_theme.paused) {
    carls_theme.pause();
  }
  if (!titlescreen_sound.paused) {
    titlescreen_sound.pause();
  }

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
    const elapsed = gameState.endTime - gameState.startTime;
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
  frame++;

  const now = performance.now();
  const frameDuration = 1000 / target_fps;

  if (activeScene === 'main') {
    renderMainScene();
  } else if (activeScene === 'title') {
    renderTitleScene();
  } else if (activeScene === "lost") {
    renderLoseScene();
  }

  const waitTime = frameDuration - (performance.now() - now);
  blockTime = Math.max(0, Math.round(waitTime));
  setTimeout(render, blockTime);
}

function onKey(e) {
  if (activeScene === 'title' && e.key === "Enter") {
    resetGameState();
    activeScene = 'main';
    return;
  }
  if (activeScene === 'title' && e.key.toLowerCase() === 'm') {
    doAudio = true;
  }
  if (activeScene === 'lost' && e.key === "Enter") {
    activeScene = 'title';
  }
  if (e.key === "Enter" && gameState.tutorial.isTutorial) {
    gameState.tutorial.state++;
    if (gameState.tutorial.state >= gameState.tutorial.states.length) {
      gameState.tutorial.isTutorial = false;
    }
  }
  if (e.key === "Escape" && gameState.tutorial.isTutorial && gameState.tutorial.state === 0) {
    gameState.tutorial.isTutorial = false;
  }
  if (e.key.toLowerCase() === 'm' && e.ctrlKey) {
    doAudio = !doAudio;
  }
  if (e.key.length === 1 && !e.ctrlKey) {
    if (e.key === "`") {
      gameState.remapping = !gameState.remapping;
      gameState.remapKey = null;
      if (gameState.remapping) {
        gameState.message = "Remapping <>";
      } else {
        gameState.message = "";
      }
    } else if (gameState.remapping) {
      if (gameState.remapKey === null) {
        gameState.remapKey = e.key.toLowerCase();
        // check if the key is already unbound
        if (gameState.keyMapper[gameState.remapKey] === 'unbound') {
          gameState.message = `<${gameState.remapKey}> is not allowed!`;
          gameState.remapKey = null;
          gameState.remapping = false;
          return;
        }
        gameState.message = `Remapping <${gameState.remapKey}> to <>`;
      } else {
        gameState.keyMapper[gameState.remapKey] = e.key.toLowerCase();
        gameState.message = `Remapped <${gameState.remapKey}> to <${e.key.toLowerCase()}>`;

        gameState.remapKey = null;
        gameState.remapping = false;
      }
    } else if (gameState.typedText.length < gameState.text.length) {
      gameState.lastTyped = e.key.toUpperCase();
      if (!gameState.active) {
        gameState.startTime = Date.now();
        gameState.lifeTime = Date.now();
        gameState.active = true;
      }
      handleAppend(gameState.keyMapper[e.key.toLowerCase()]);
    }
  }
}

function handleAppend(mappedKey) {
  if (mappedKey === 'unbound') {
    return;
  }
  if (gameState.text[gameState.typedText.length] === mappedKey) {
    gameState.typedText += mappedKey;
    gameState.wpmDeque.push(Date.now());
  } else {
    gameState.health -= 10;
  }
}

const assetLoadFuture = Promise.all([
  new Promise((resolve) => {
    backgroundImage.onload = resolve;
  }),
  new Promise((resolve) => {
    hudImage.onload = resolve;
  }),
  new Promise((resolve) => {
    emptyHeartImage.onload = resolve;
  }),
  new Promise((resolve) => {
    titlescreenImage.onload = resolve;
  })
]);

window.addEventListener('keydown', onKey);
assetLoadFuture.then(() => {
  render();
});
