import GameManager from './gameManager.js';
import AudioManager from './audio.js';

const canvas = document.getElementById('game');
const gm = new GameManager(canvas);
const audio = new AudioManager();

let last = performance.now();
let inputHeld = false;
let prevGameOver = false;

function resize() {
  // use actual viewport size for canvas to avoid layout issues in iframes
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gm.resize();
}
window.addEventListener('resize', resize);
resize();

// input handling: mouse + touch + space
window.addEventListener('mousedown', () => { inputHeld = true; if (gm.gameOver) gm.reset(); audio.playThrust(); });
window.addEventListener('mouseup', () => { inputHeld = false; });
window.addEventListener('touchstart', (e) => { e.preventDefault(); inputHeld = true; if (gm.gameOver) gm.reset(); }, {passive:false});
window.addEventListener('touchend', () => { inputHeld = false; });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { inputHeld = true; e.preventDefault(); }
  if (e.key.toLowerCase() === 'r') { gm.reset(); }
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') { inputHeld = false; } });

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  gm.update(dt, inputHeld);
  gm.draw();

  // play death sound once when game over transitions
  if (!prevGameOver && gm.gameOver) {
    audio.playDeath();
  }
  prevGameOver = gm.gameOver;

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// helpful instructions in the DOM
const instr = document.createElement('div');
instr.className = 'instructions';
instr.innerText = 'Hold mouse / touch / Space to go up';
document.body.appendChild(instr);

const hud = document.createElement('div');
hud.className = 'hud';
document.body.appendChild(hud);

// report ready to the diagnostic overlay if present
if (window.__diag) window.__diag.ready();

// resume audio on explicit user gesture event from the debug overlay
window.addEventListener('user-gesture', () => {
  try { audio.resume(); } catch (e) {}
});
