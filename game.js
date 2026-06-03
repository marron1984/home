const gameArea = document.querySelector("#game-area");
const player = document.querySelector("#player");
const scoreDisplay = document.querySelector("#score");
const timeDisplay = document.querySelector("#time");
const startButton = document.querySelector("#start-button");
const message = document.querySelector("#message");

const GAME_SECONDS = 30;
const PLAYER_SPEED = 11;
const ITEM_SIZE = 34;
const keys = new Set();

let score = 0;
let timeLeft = GAME_SECONDS;
let playerX = 0;
let animationId = null;
let countdownId = null;
let spawnId = null;
let running = false;
let lastFrame = 0;
let items = [];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetGame() {
  score = 0;
  timeLeft = GAME_SECONDS;
  items.forEach((item) => item.element.remove());
  items = [];
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  playerX = gameArea.clientWidth / 2 - player.clientWidth / 2;
  renderPlayer();
}

function renderPlayer() {
  player.style.left = `${playerX}px`;
  player.style.transform = "none";
}

function createItem() {
  const isBomb = Math.random() < 0.22;
  const element = document.createElement("div");
  element.className = "falling-item";
  element.textContent = isBomb ? "💣" : "⭐";
  element.setAttribute("aria-hidden", "true");

  const maxX = gameArea.clientWidth - ITEM_SIZE;
  const item = {
    element,
    x: Math.random() * maxX,
    y: -ITEM_SIZE,
    speed: 140 + Math.random() * 150 + Math.max(0, GAME_SECONDS - timeLeft) * 4,
    isBomb,
  };

  element.style.left = `${item.x}px`;
  gameArea.append(element);
  items.push(item);
}

function rectanglesOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function updateItems(deltaSeconds) {
  const playerRect = player.getBoundingClientRect();
  const areaRect = gameArea.getBoundingClientRect();

  items = items.filter((item) => {
    item.y += item.speed * deltaSeconds;
    item.element.style.top = `${item.y}px`;

    const itemRect = item.element.getBoundingClientRect();
    if (rectanglesOverlap(playerRect, itemRect)) {
      score += item.isBomb ? -3 : 1;
      score = Math.max(0, score);
      scoreDisplay.textContent = score;
      item.element.remove();
      return false;
    }

    if (itemRect.top > areaRect.bottom) {
      item.element.remove();
      return false;
    }

    return true;
  });
}

function gameLoop(timestamp) {
  if (!running) return;

  const deltaSeconds = Math.min((timestamp - lastFrame) / 1000, 0.04);
  lastFrame = timestamp;

  const maxX = gameArea.clientWidth - player.clientWidth;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) {
    playerX -= PLAYER_SPEED;
  }
  if (keys.has("ArrowRight") || keys.has("KeyD")) {
    playerX += PLAYER_SPEED;
  }
  playerX = clamp(playerX, 0, maxX);
  renderPlayer();
  updateItems(deltaSeconds);

  animationId = requestAnimationFrame(gameLoop);
}

function finishGame() {
  running = false;
  clearInterval(countdownId);
  clearInterval(spawnId);
  cancelAnimationFrame(animationId);
  startButton.disabled = false;
  startButton.textContent = "もう一度";
  message.classList.remove("hidden");
  message.innerHTML = `<strong>終了!</strong><span>スコアは ${score} 点です。もう一度挑戦してみよう。</span>`;
}

function startGame() {
  resetGame();
  running = true;
  lastFrame = performance.now();
  startButton.disabled = true;
  message.classList.add("hidden");
  gameArea.focus();

  spawnId = setInterval(createItem, 650);
  countdownId = setInterval(() => {
    timeLeft -= 1;
    timeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      finishGame();
    }
  }, 1000);

  animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) {
    keys.add(event.code);
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("resize", () => {
  playerX = clamp(playerX, 0, gameArea.clientWidth - player.clientWidth);
  renderPlayer();
});

startButton.addEventListener("click", startGame);
resetGame();
