
let started = false, paused = false, watchId = null, timer = null, lastPos = null;
let baseFare = 1000, distance = 0, waitTime = 0, speed = 0;
let extras = { bags: 0, animals: 0, bulky: 0, elevation: 0, pax: false, van: false };

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}

function toggleStartStop() {
  const btn = document.getElementById('startStopBtn');
  if (!started) {
    startTrip();
    btn.textContent = 'STOP';
    btn.classList.remove('start');
    btn.classList.add('stop');
  } else {
    stopTrip();
    btn.textContent = 'START';
    btn.classList.remove('stop');
    btn.classList.add('start');
  }
}

function startTrip() {
  started = true;
  paused = false;
  document.getElementById('printBtn').style.display = 'none';
  speak("Taximeter started.");
  watchId = navigator.geolocation.watchPosition(updatePosition, null, { enableHighAccuracy: true });
  timer = setInterval(() => {
    if (!paused && speed < 10) waitTime++;
    updateDisplay();
  }, 1000);
}

function stopTrip() {
  started = false;
  clearInterval(timer);
  navigator.geolocation.clearWatch(watchId);
  updateDisplay();
  let totalFare = document.getElementById('fare').innerText;
  speak("Trip stopped. Total fare is XPF " + totalFare);
  document.getElementById('printBtn').style.display = 'inline-block';
}

function resetTrip() {
  speak("Taximeter reset.");
  distance = 0; waitTime = 0; speed = 0; lastPos = null;
  baseFare = 1000;
  document.getElementById('printBtn').style.display = 'none';
  updateDisplay();
}

function updatePosition(pos) {
  speed = (pos.coords.speed || 0) * 3.6;
  if (speed > 80) document.getElementById('alertSound').play();
  if (!paused && speed >= 10 && lastPos) {
    distance += calcDist(lastPos.coords.latitude, lastPos.coords.longitude, pos.coords.latitude, pos.coords.longitude);
  }
  lastPos = pos;
  updateDisplay();
}

function updateDisplay() {
  let isNight = (new Date().getHours() >= 20 || new Date().getHours() < 6);
  let rate = isNight ? 260 : 160;
  let distFare = distance * rate;
  let waitFare = (waitTime / 60) * 42;
  let extraFare = extras.bags * 100 + extras.animals * 100 + extras.bulky * 500 + extras.elevation * 500 + (extras.pax ? 500 : 0) + (extras.van ? 500 : 0);
  let total = baseFare + distFare + waitFare + extraFare;
  total = Math.ceil(total / 5) * 5;

  document.getElementById('fare').innerText = total.toFixed(0);
  document.getElementById('distance').innerText = distance.toFixed(1) + " km";
  document.getElementById('wait').innerText = formatTime(waitTime);
  document.getElementById('speed').innerText = speed.toFixed(0) + " km/h";
  document.getElementById('status').innerText = started ? (speed < 10 ? 'WAITING' : 'RUNNING') : 'FOR HIRE';
}

function pauseTrip() {
  const btn = document.querySelector('.pause');
  paused = !paused;
  btn.textContent = paused ? 'RESUME' : 'PAUSE';
  speak(paused ? "Taximeter paused." : "Taximeter resumed.");
  const btn = document.querySelector('.pause');
  paused = !paused;
  btn.textContent = paused ? 'RESUME' : 'PAUSE';
  paused = !paused;
  speak(paused ? "Taximeter paused." : "Taximeter resumed.");
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateExtras() {
  extras.bags = parseInt(document.getElementById('bags').value);
  extras.animals = parseInt(document.getElementById('animals').value);
  extras.bulky = parseInt(document.getElementById('bulky').value);
  extras.elevation = parseInt(document.getElementById('elevation').value);
  extras.pax = document.getElementById('pax').checked;
  extras.van = document.getElementById('van').checked;
}

function printReceipt() {
  const receipt = `
TOTAL FARE
------------------------
Fare: XPF ${document.getElementById('fare').innerText}
Distance: ${document.getElementById('distance').innerText}
Wait Time: ${document.getElementById('wait').innerText}
Extras:
🎒 Bags: ${extras.bags}
🐱 Animals: ${extras.animals}
📦 Bulky Items: ${extras.bulky}
⛰️ Elevation: ${extras.elevation}
5+ Pax: ${extras.pax ? 'Yes' : 'No'}
🚐 Van Reservation: ${extras.van ? 'Yes' : 'No'}
Date: ${new Date().toLocaleString()}
------------------------`;
  const win = window.open('', '', 'width=400,height=600');
  win.document.write('<pre>' + receipt + '</pre><button onclick="window.print()">Print Receipt</button>');
}

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
}
