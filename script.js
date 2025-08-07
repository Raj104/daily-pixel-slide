const PEXELS_API_KEY = 'ohRAsOUg2oRkKuTMZqvVikan12qiriCAHy3Bh0nZLxR2RfSqY47iwFMB'; // <-- Replace with your key
const QUERY = 'nature'; // Change topic as desired

const gridSize = 3;
let tiles = [];
let emptyIndex = 8;
let timer = 0;
let timerInterval;
let started = false;
let moves = 0;

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Save today's day in localStorage
const today = getDayOfYear();
const lastDay = localStorage.getItem('lastDay');
// Reset best and last only at the start of a new day
if (lastDay != today) {
  localStorage.setItem('bestTime', null);
  localStorage.setItem('bestMoves', null);
  localStorage.setItem('lastTime', null);
  localStorage.setItem('lastMoves', null);
  localStorage.setItem('lastDay', today);
}

let bestTime = localStorage.getItem('bestTime');
let bestMoves = localStorage.getItem('bestMoves');
let lastTime = localStorage.getItem('lastTime');
let lastMoves = localStorage.getItem('lastMoves');

// Add a global variable to store the daily image URL and photographer info
let dailyImageUrl = null;
let dailyPhotographer = null;
let dailyPhotographerUrl = null;
let dailyPhotoUrl = null;

async function fetchDailyImage() {
  const url = `https://api.pexels.com/v1/search?query=${QUERY}&per_page=1&page=${getDayOfYear()}`;
  const res = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY }
  });
  const data = await res.json();
  if (data.photos && data.photos.length > 0) {
    return data.photos[0];
  }
  throw new Error('No image found');
}

// Update your fetchDailyImage usage to store these
async function setupDailyImage() {
  try {
    const photo = await fetchDailyImage();
    dailyImageUrl = photo.src.large;
    dailyPhotographer = photo.photographer;
    dailyPhotographerUrl = photo.photographer_url;
    dailyPhotoUrl = photo.url;

    // Load the image and split into tiles
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dailyImageUrl;
    img.onload = function() {
      // Make the image square by cropping to the smallest side
      const minSide = Math.min(img.width, img.height);
      const tileSize = Math.floor(minSide / 3);

      // Create a square canvas and draw the cropped image
      const squareCanvas = document.createElement('canvas');
      squareCanvas.width = minSide;
      squareCanvas.height = minSide;
      const squareCtx = squareCanvas.getContext('2d');
      squareCtx.drawImage(
        img,
        (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide,
        0, 0, minSide, minSide
      );

      // Store the cropped square image for reference display
      window.croppedReferenceDataUrl = squareCanvas.toDataURL();

      // Split the square image into tiles
      window.puzzleTiles = splitImageToTiles(squareCanvas, tileSize);

      createPuzzle();
      renderReference();
    };
  } catch (e) {
    alert('Could not load image: ' + e.message);
  }
}

function createPuzzle() {
  const puzzle = document.getElementById('puzzle');
  puzzle.innerHTML = '';
  tiles = [1, 2, 3, 4, 5, 6, 7, 8, null];
  emptyIndex = tiles.indexOf(null);

  scramblePuzzle(10);
  moves = 0;
  updateStats();
  tiles.forEach((value, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (value === null) {
      tile.classList.add('empty');
    } else if (window.puzzleTiles && window.puzzleTiles[value - 1]) {
      const img = document.createElement('img');
      img.src = window.puzzleTiles[value - 1];
      img.alt = `Tile ${value}`;
      img.style.width = '100%';
      img.style.height = '100%';
      tile.appendChild(img);
    }
    tile.addEventListener('click', () => slideTile(i));
    puzzle.appendChild(tile);
  });
  renderReference();
}

// Update renderReference to show the image and credit
function renderReference() {
  const reference = document.getElementById('reference');
  reference.innerHTML = '';

  // Use tiles to create a reference image
  if (window.croppedReferenceDataUrl) {
    const img = document.createElement('img');
    img.src = window.croppedReferenceDataUrl;
    img.alt = 'Reference';
    img.style.width = '100%';
    img.style.height = 'auto';
    reference.appendChild(img);
  }

  // Set credit text in the dedicated div
  const credit = document.getElementById('reference-credit');
  credit.innerHTML = `Photo by <a href="${dailyPhotoUrl}" target="_blank">${dailyPhotographer}</a> `;
}

function updatePuzzle() {
  const puzzle = document.getElementById('puzzle');
  puzzle.innerHTML = '';
  tiles.forEach((value, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (value === null) {
      tile.classList.add('empty');
    } else if (window.puzzleTiles && window.puzzleTiles[value - 1]) {
      const img = document.createElement('img');
      img.src = window.puzzleTiles[value - 1];
      img.alt = `Tile ${value}`;
      img.style.width = '100%';
      img.style.height = '100%';
      tile.appendChild(img);
    }
    tile.addEventListener('click', () => slideTile(i));
    puzzle.appendChild(tile);
  });
}

function slideTile(index) {
  const validMoves = getValidMoves(emptyIndex);
  if (!validMoves.includes(index)) return;

  if (!started) startTimer();

  [tiles[emptyIndex], tiles[index]] = [tiles[index], tiles[emptyIndex]];
  emptyIndex = index;
  moves++;
  updateStats();
  updatePuzzle();

  if (isSolved()) {
    stopTimer();
    updateStats(true);
    showResultPopup(moves, 10); // 10 = scramble depth
  }
}

function scramblePuzzle(totalMoves) {
  let lastMove = -1;

  for (let i = 0; i < totalMoves; i++) {
    const validMoves = getValidMoves(emptyIndex).filter(m => m !== lastMove); // Avoid undoing the last move
    let move;
    let attempts = 0;

    do {
      move = validMoves[Math.floor(Math.random() * validMoves.length)];
      attempts++;
      if (attempts > 10) break; // prevent infinite loop in edge cases
    } while (wouldPlaceCorrect(move));

    // Do the move
    [tiles[emptyIndex], tiles[move]] = [tiles[move], tiles[emptyIndex]];
    lastMove = emptyIndex;
    emptyIndex = move;
  }
}

function wouldPlaceCorrect(moveIndex) {
  const tileValue = tiles[moveIndex];
  if (tileValue === null) return false; // don't care about empty
  return emptyIndex === tileValue - 1; // would land in correct place
}

function getValidMoves(index) {
  const moves = [];
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      moves.push(r * gridSize + c);
    }
  });
  return moves;
}

function isSolved() {
  return tiles.slice(0, 8).every((v, i) => v === i + 1);
}

function shuffleArray(arr) {
  for (let i = arr.length - 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function startTimer() {
  started = true;
  timer = 0;
  timerInterval = setInterval(() => {
    timer += 0.01;
    updateStats();
  }, 10);
}

function stopTimer() {
  clearInterval(timerInterval);
  started = false;
}

function updateStats(solved = false) {
  // Current stats
  document.getElementById('timer').textContent = `Time: ${timer.toFixed(2)}s`;
  document.getElementById('moves').textContent = `Moves: ${moves}`;

  // Last stats (only update when solved)
  if (solved) {
    lastTime = timer.toFixed(2);
    lastMoves = moves;
    document.getElementById('last-time').textContent = `Time: ${lastTime}s`;
    document.getElementById('last-moves').textContent = `Moves: ${lastMoves}`;

    // Best stats
    let updateBest = false;
    if (bestTime === "null" || timer < parseFloat(bestTime)) {
      bestTime = timer.toFixed(2);
      localStorage.setItem('bestTime', bestTime);
      updateBest = true;
    }
    if (bestMoves === "null" || moves < parseInt(bestMoves)) {
      bestMoves = moves;
      localStorage.setItem('bestMoves', bestMoves);
      updateBest = true;
    }
    if (updateBest) {
      document.getElementById('best-time').textContent = `Time: ${bestTime}s`;
      document.getElementById('best-moves').textContent = `Moves: ${bestMoves}`;
    }
  } else {
    // On puzzle start, show best stats from storage
    document.getElementById('best-time').textContent = `Time: ${bestTime ? bestTime + 's' : '--'}`;
    document.getElementById('best-moves').textContent = `Moves: ${bestMoves ? bestMoves : '--'}`;
    document.getElementById('last-time').textContent = `Time: ${lastTime ? lastTime + 's' : '--'}`;
    document.getElementById('last-moves').textContent = `Moves: ${lastMoves ? lastMoves : '--'}`;
  }
}

// Call this once on page load
setupDailyImage();
createPuzzle();

function splitImageToTiles(img, tileSize) {
  const tilesArr = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (row * 3 + col === 8) {
        tilesArr.push(null); // last tile is empty
        continue;
      }
      const canvas = document.createElement('canvas');
      canvas.width = tileSize;
      canvas.height = tileSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        col * tileSize, row * tileSize, tileSize, tileSize, // source
        0, 0, tileSize, tileSize // destination
      );
      tilesArr.push(canvas.toDataURL());
    }
  }
  return tilesArr;
}

function showResultPopup(playerMoves, scrambleMoves) {
  const resultPopup = document.getElementById('result-popup');
  const messageEl = document.getElementById('result-message');
  const summaryEl = document.getElementById('share-summary');

  const difference = playerMoves - scrambleMoves;
  let rating = '';
  let emoji = '';
  if (difference < 0) {
    rating = "🧠 Excellent! You solved it in fewer moves than the scramble.";
    emoji = '✨';
  } else if (difference === 0) {
    rating = "🎯 Great! You matched the scramble path.";
    emoji = '✅';
  } else if (difference <= 5) {
    rating = "🙂 Not bad, but could be better.";
    emoji = '➖';
  } else {
    rating = "😬 Ouch! That took some doing.";
    emoji = '💀';
  }

  const summaryText = `🧩 Daily Pixel Slide #${getDayOfYear()}\n${emoji} Solved in ${playerMoves} moves (scrambled in ${scrambleMoves})\n${rating}\n${location.href}`;

  messageEl.textContent = rating;
  resultPopup.style.display = 'flex';

  // Store for copying
  window._shareText = summaryText;
}

function copyShareText() {
  navigator.clipboard.writeText(window._shareText)
    .then(() => alert('Result copied to clipboard!'))
    .catch(() => alert('Copy failed.'));
}

function shareToTwitter() {
  const text = encodeURIComponent(window._shareText);
  const url = `https://twitter.com/intent/tweet?text=${text}`;
  window.open(url, '_blank');
}

function shareToWhatsApp() {
  const text = encodeURIComponent(window._shareText);
  const url = `https://wa.me/?text=${text}`;
  window.open(url, '_blank');
}

function closePopup() {
  document.getElementById('result-popup').style.display = 'none';
}

document.getElementById('retry-btn').addEventListener('click', () => {
  timer = 0;
  moves = 0;
  started = false;
  clearInterval(timerInterval);
  // Re-scramble using the same daily seed
  createPuzzle();
  updateStats();
});
