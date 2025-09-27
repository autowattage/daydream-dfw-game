// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Frame counter
let frame = 0;

// Render loop
function render() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw frame counter text
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`Frame: ${frame}`, 20, 40);

    requestAnimationFrame(render);
}

function onKey() {
    frame = 0;
}

window.addEventListener('keydown', onKey);
// Start loop
render();