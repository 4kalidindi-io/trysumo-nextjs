const statusEl = document.getElementById('diag-status');
const logEl = document.getElementById('diag-log');
const startBtn = document.getElementById('diag-start');
const playOverlay = document.getElementById('play-overlay');
const playButton = document.getElementById('play-button');

function log(msg) {
  if (!logEl) return;
  logEl.style.display = 'block';
  logEl.textContent += msg + '\n';
}

window.addEventListener('error', (e) => {
  statusEl.textContent = 'Error detected';
  log('ERROR: ' + (e.message || e.toString()));
});

const origConsoleError = console.error;
console.error = function (...args) {
  origConsoleError.apply(console, args);
  try { log('console.error: ' + args.map(a => a && a.stack ? a.stack : String(a)).join(' ')); } catch (e) {}
};

startBtn.addEventListener('click', () => {
  // signal a user gesture to other scripts
  window.dispatchEvent(new Event('user-gesture'));
  statusEl.textContent = 'Started (user gesture)';
  startBtn.style.display = 'none';
});

if (playButton) {
  playButton.addEventListener('click', () => {
    window.dispatchEvent(new Event('user-gesture'));
    if (playOverlay) playOverlay.style.display = 'none';
    statusEl.textContent = 'Playing';
  });
}

// expose a tiny API for main to report status
window.__diag = {
  ready() { if (statusEl) statusEl.textContent = 'Loaded'; },
  msg(s) { if (statusEl) statusEl.textContent = s; log(s); }
};
