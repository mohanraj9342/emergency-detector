/**
 * ui.js — SentinelAI UI enhancement layer
 * Handles: SVG gauge (single prediction), alert card, status dot, scan-line
 */

const statusDot     = document.getElementById('statusDot');
const alertCard     = document.getElementById('alertCard');
const alertIconWrap = document.getElementById('alertIconWrap');
const alertIcon     = document.getElementById('alertIcon');
const threatSub     = document.getElementById('threatSub');
const scanOverlay   = document.getElementById('scanOverlay');
const emergencyArc  = document.getElementById('emergencyArc');  // single prediction arc
const emergencyPct  = document.getElementById('emergencyPct');
const normalBar     = document.getElementById('normalBar');

// Half-circle SVG path total arc length ≈ 126
const ARC_LEN = 126;

/**
 * Update the single prediction SVG gauge.
 * Colour shifts: low = cyan, high = rose (danger)
 */
function setPredictionGauge(fraction) {
  if (!emergencyArc) return;
  const filled = Math.max(0, Math.min(1, fraction)) * ARC_LEN;
  emergencyArc.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${ARC_LEN}`);

  // Dynamic colour: cyan → amber → rose as fraction rises
  if (fraction < 0.4) {
    emergencyArc.style.stroke = 'var(--cyan)';
  } else if (fraction < 0.72) {
    emergencyArc.style.stroke = 'var(--amber)';
  } else {
    emergencyArc.style.stroke = 'var(--rose)';
  }
}

/**
 * Set the status dot state: 'idle' | 'active' | 'error'
 */
function setStatusDot(state) {
  statusDot.classList.remove('active', 'error');
  if (state === 'active') statusDot.classList.add('active');
  if (state === 'error')  statusDot.classList.add('error');
}

/**
 * Toggle the scan-line overlay (shown when camera is running)
 */
function setScanOverlay(visible) {
  scanOverlay.hidden = !visible;
}

/**
 * Main UI update called from main.js after each prediction
 */
function updateSentinelUI(result) {
  const ep = result.emergencyProbability;
  const np = result.nonEmergencyProbability;

  // Single prediction gauge (shows emergency probability 0–100%)
  setPredictionGauge(ep);

  // Pct labels
  if (emergencyPct) emergencyPct.textContent = `${(ep * 100).toFixed(2)}%`;

  // Normal bar
  const normalPctEl = document.getElementById('normalPct');
  const normalBarEl = document.getElementById('normalBar');
  if (normalPctEl) normalPctEl.textContent = `${(np * 100).toFixed(2)}%`;
  if (normalBarEl) normalBarEl.style.width = `${(np * 100).toFixed(1)}%`;

  // Alert card appearance
  if (result.isEmergency) {
    alertCard.classList.add('emergency-mode');
    alertIconWrap.classList.add('danger');
    alertIcon.className = 'fas fa-triangle-exclamation';
    threatSub.textContent = 'Emergency detected — act immediately';
  } else {
    alertCard.classList.remove('emergency-mode');
    alertIconWrap.classList.remove('danger');
    alertIcon.className = 'fas fa-circle-check';
    threatSub.textContent = 'All systems normal';
  }
}

// Expose globally so main.js can call them
window.setStatusDot     = setStatusDot;
window.setScanOverlay   = setScanOverlay;
window.updateSentinelUI = updateSentinelUI;
