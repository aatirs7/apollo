// Pretty Pink 2h Timer with pause + restart + localStorage persistence

const H = document.getElementById("hours");
const M = document.getElementById("minutes");
const S = document.getElementById("seconds");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");

const STORAGE_KEY = "pink_peace_timer_end";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

let endTime = null;
let paused = false;
let remainingWhenPaused = null;
let rafId = null;

function pad(n){ return String(n).padStart(2, "0"); }

function setEndTime(msFromNow=TWO_HOURS_MS){
  endTime = Date.now() + msFromNow;
  localStorage.setItem(STORAGE_KEY, String(endTime));
}

function loadEndTime(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved && !isNaN(+saved)){
    endTime = +saved;
    // if it already expired, start fresh 2h
    if(endTime <= Date.now()) setEndTime();
  } else {
    setEndTime();
  }
}

function formatRemaining(ms){
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return { hrs, mins, secs };
}

function render(ms){
  const { hrs, mins, secs } = formatRemaining(ms);
  H.textContent = pad(hrs);
  M.textContent = pad(mins);
  S.textContent = pad(secs);
}

function tick(){
  const now = Date.now();
  const remaining = endTime - now;

  if(remaining <= 0){
    render(0);
    statusEl.textContent = "Time’s up — ab gussa khatam? 💗";
    cancelAnimationFrame(rafId);
    return;
  }

  render(remaining);
  // schedule next animation frame, but keep it roughly per second
  rafId = requestAnimationFrame(() => {
    // snap to ~250ms cadence for smoother numbers
    setTimeout(tick, 250);
  });
}

function start(){
  cancelAnimationFrame(rafId);
  paused = false;
  pauseBtn.textContent = "Pause";
  statusEl.textContent = "“Bas itne der…” clock is ticking ⏳";
  tick();
}

function pause(){
  if(paused){
    // resume
    setEndTime(remainingWhenPaused);
    start();
  } else {
    // pause
    remainingWhenPaused = Math.max(0, endTime - Date.now());
    paused = true;
    cancelAnimationFrame(rafId);
    pauseBtn.textContent = "Resume";
    statusEl.textContent = "Paused (thoda sa pyaar break) 💞";
  }
}

restartBtn.addEventListener("click", () => {
  setEndTime();
  start();
});

pauseBtn.addEventListener("click", pause);

// Initialize
loadEndTime();
start();
