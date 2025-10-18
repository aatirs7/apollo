// Pink Peace Timer (no auto-restart; setup-first; iOS-friendly; can lessen time)
const STORAGE_KEY = "peace_timer_v2"; // stores {running, startedAt, endTime}

// Elements
const setupSec   = document.getElementById("setup");
const runningSec = document.getElementById("running");

const inH = document.getElementById("hours");
const inM = document.getElementById("minutes");
const inS = document.getElementById("seconds");

const startBtn = document.getElementById("startBtn");
const resumeBtn = document.getElementById("resumeIfAny");
const preset90 = document.getElementById("preset90");
const preset60 = document.getElementById("preset60");
const preset30 = document.getElementById("preset30");

const H = document.getElementById("H");
const M = document.getElementById("M");
const S = document.getElementById("S");
const statusText = document.getElementById("statusText");
const endHint = document.getElementById("endHint");

const pauseBtn = document.getElementById("pauseBtn");
const editBtn  = document.getElementById("editBtn");
const resetBtn = document.getElementById("resetBtn");
const lessenRow = document.getElementById("lessenRow");

let rafId = null;
let paused = false;
let pausedRemaining = 0;

// Utilities
const pad = n => String(n).padStart(2,"0");
const now = () => Date.now();

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const clearState = () => localStorage.removeItem(STORAGE_KEY);

// UI switches
function showSetup(){
  runningSec.classList.remove("active");
  setupSec.classList.add("active");
  cancelAnimationFrame(rafId);
}
function showRunning(){
  setupSec.classList.remove("active");
  runningSec.classList.add("active");
}

// Time helpers
function durationFromInputs(){
  const h = Math.max(0, Math.min(23, parseInt(inH.value || "0", 10)));
  const m = Math.max(0, Math.min(59, parseInt(inM.value || "0", 10)));
  const s = Math.max(0, Math.min(59, parseInt(inS.value || "0", 10)));
  return ((h * 60 + m) * 60 + s) * 1000;
}

function remainingMs(state){
  return Math.max(0, (state.endTime ?? 0) - now());
}

function render(ms){
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  H.textContent = pad(hrs);
  M.textContent = pad(mins);
  S.textContent = pad(secs);
}

function formatETA(endTime){
  try {
    const dt = new Date(endTime);
    const h = dt.getHours();
    const m = dt.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hr12 = (h % 12) || 12;
    return `Ends around ${hr12}:${String(m).padStart(2,"0")} ${ampm}`;
  } catch { return ""; }
}

// Core loop
function tick(){
  const state = loadState();
  if(!state || !state.running){
    // Safety: if no state, go back to setup
    showSetup();
    return;
  }

  const rem = remainingMs(state);
  render(rem);
  endHint.textContent = formatETA(state.endTime);

  if(rem <= 0){
    statusText.textContent = "Time’s up — ab gussa khatam? 💗";
    // stop and mark not running, do NOT auto-restart
    saveState({ running:false, startedAt: state.startedAt, endTime: state.endTime });
    cancelAnimationFrame(rafId);
    return;
  }

  rafId = requestAnimationFrame(() => {
    // throttle to ~4x/sec for smoothness without battery drain
    setTimeout(tick, 250);
  });
}

// Actions
function startTimer(ms){
  if(ms <= 0) return;
  const state = { running:true, startedAt: now(), endTime: now() + ms };
  saveState(state);
  paused = false;
  pauseBtn.textContent = "Pause";
  statusText.textContent = "“Bas itne der…” clock is ticking ⏳";
  showRunning();
  cancelAnimationFrame(rafId);
  tick();
}

function resumeIfPossible(){
  const state = loadState();
  if(state && state.running && remainingMs(state) > 0){
    showRunning();
    paused = false;
    pauseBtn.textContent = "Pause";
    statusText.textContent = "Resumed ⏳";
    cancelAnimationFrame(rafId);
    tick();
  } else {
    // If exists but finished, go to setup; otherwise do nothing
    showSetup();
  }
}

function pauseToggle(){
  const state = loadState();
  if(!state) return;
  if(!state.running && !paused) return;

  if(paused){
    // resume from pausedRemaining
    const newState = { running:true, startedAt: now(), endTime: now() + pausedRemaining };
    saveState(newState);
    paused = false;
    pauseBtn.textContent = "Pause";
    statusText.textContent = "Resumed ⏳";
    tick();
  } else {
    // pause
    pausedRemaining = remainingMs(state);
    saveState({ running:false, startedAt: state.startedAt, endTime: state.endTime });
    paused = true;
    pauseBtn.textContent = "Resume";
    statusText.textContent = "Paused (thoda sa pyaar break) 💞";
    cancelAnimationFrame(rafId);
  }
}

function clearTimer(){
  clearState();
  paused = false;
  pausedRemaining = 0;
  H.textContent = "00"; M.textContent = "00"; S.textContent = "00";
  endHint.textContent = "";
  showSetup();
}

// Lessen time buttons
lessenRow.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-less]");
  if(!btn) return;
  const delta = parseInt(btn.getAttribute("data-less"), 10) || 0;

  // If paused, lessen the pausedRemaining; if running, pull from state.endTime
  if(paused){
    pausedRemaining = Math.max(0, pausedRemaining - delta);
    render(pausedRemaining);
    endHint.textContent = ""; // eta unknown while paused
  } else {
    const state = loadState();
    if(!state || !state.running) return;
    const newEnd = Math.max(now(), state.endTime - delta);
    const newState = { ...state, endTime: newEnd };
    saveState(newState);
    // Instant feedback:
    render(remainingMs(newState));
    endHint.textContent = formatETA(newState.endTime);
  }
});

// Setup events
startBtn.addEventListener("click", () => startTimer(durationFromInputs()));
resumeBtn.addEventListener("click", resumeIfPossible);

preset90.addEventListener("click", () => { inH.value=1; inM.value=30; inS.value=0; });
preset60.addEventListener("click", () => { inH.value=1; inM.value=0;  inS.value=0; });
preset30.addEventListener("click", () => { inH.value=0; inM.value=30; inS.value=0; });

// Running controls
pauseBtn.addEventListener("click", pauseToggle);
editBtn.addEventListener("click", () => {
  // Let her change to any (even longer) time from setup screen.
  const state = loadState();
  if(state){
    const rem = paused ? pausedRemaining : remainingMs(state);
    // prefill current remaining into inputs
    const hrs = Math.floor(rem/3600000);
    const mins = Math.floor((rem%3600000)/60000);
    const secs = Math.floor((rem%60000)/1000);
    inH.value = hrs; inM.value = mins; inS.value = secs;
  }
  showSetup();
});
resetBtn.addEventListener("click", clearTimer);

// On load: do NOT auto-start; only show running if an active timer is mid-way
(function init(){
  const state = loadState();
  if(state && state.running && remainingMs(state) > 0){
    // If a valid running timer exists, show running (we're not "restarting", just continuing)
    showRunning();
    tick();
  } else {
    showSetup();
  }
})();
