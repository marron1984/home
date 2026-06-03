const gameArea = document.querySelector("#game-area");
const player = document.querySelector("#player");
const scoreDisplay = document.querySelector("#score");
const livesDisplay = document.querySelector("#lives");
const timeDisplay = document.querySelector("#time");
const startButton = document.querySelector("#start-button");
const message = document.querySelector("#message");

const GAME_SECONDS = 45;
const PLAYER_SPEED = 360;
const BULLET_SPEED = 620;
const ENEMY_SIZE = 42;
const PLAYER_WIDTH = 58;
const PLAYER_HEIGHT = 68;
const PLAYER_BOTTOM = 26;
const SHOT_COOLDOWN = 180;
const keys = new Set();

let score = 0;
let lives = 3;
let timeLeft = GAME_SECONDS;
let playerX = 0;
let animationId = null;
let countdownId = null;
let spawnId = null;
let running = false;
let lastFrame = 0;
let lastShotAt = 0;
let bullets = [];
let enemies = [];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setElementPosition(element, x, y) {
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
}

function clearSprites(collection) {
  collection.forEach((sprite) => sprite.element.remove());
}

function renderHud() {
  scoreDisplay.textContent = score;
  livesDisplay.textContent = lives;
  timeDisplay.textContent = timeLeft;
}

function renderPlayer() {
  player.style.left = `${playerX}px`;
  player.style.transform = "none";
}

function resetGame() {
  score = 0;
  lives = 3;
  timeLeft = GAME_SECONDS;
  clearSprites(bullets);
  clearSprites(enemies);
  bullets = [];
  enemies = [];
  playerX = gameArea.clientWidth / 2 - PLAYER_WIDTH / 2;
  renderHud();
  renderPlayer();
}

function createBullet() {
  const now = performance.now();
  if (now - lastShotAt < SHOT_COOLDOWN) return;

  lastShotAt = now;
  const element = document.createElement("div");
  element.className = "bullet";
  element.setAttribute("aria-hidden", "true");

  const bullet = {
    element,
    x: playerX + PLAYER_WIDTH / 2 - 3,
    y: gameArea.clientHeight - PLAYER_BOTTOM - PLAYER_HEIGHT + 4,
    width: 6,
    height: 24,
  };

  setElementPosition(element, bullet.x, bullet.y);
  gameArea.append(element);
  bullets.push(bullet);
}

function createEnemy() {
  const isShip = Math.random() < 0.34;
  const element = document.createElement("div");
  element.className = "enemy";
  element.textContent = isShip ? "👾" : "☄️";
  element.setAttribute("aria-hidden", "true");

  const elapsed = GAME_SECONDS - timeLeft;
  const enemy = {
    element,
    x: Math.random() * Math.max(0, gameArea.clientWidth - ENEMY_SIZE),
    y: -ENEMY_SIZE,
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
    speed: 115 + Math.random() * 95 + elapsed * 4,
    drift: (Math.random() - 0.5) * 85,
    points: isShip ? 30 : 10,
  };

  setElementPosition(element, enemy.x, enemy.y);
  gameArea.append(element);
  enemies.push(enemy);
}

function rectanglesOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function spriteRect(sprite) {
  return {
    left: sprite.x,
    right: sprite.x + sprite.width,
    top: sprite.y,
    bottom: sprite.y + sprite.height,
  };
}

function playerRect() {
  const y = gameArea.clientHeight - PLAYER_BOTTOM - PLAYER_HEIGHT;
  return {
    left: playerX + 8,
    right: playerX + PLAYER_WIDTH - 8,
    top: y + 8,
    bottom: y + PLAYER_HEIGHT - 4,
  };
}

function showExplosion(x, y) {
  const element = document.createElement("div");
  element.className = "explosion";
  element.textContent = "✦";
  element.setAttribute("aria-hidden", "true");
  setElementPosition(element, x - 5, y - 5);
  gameArea.append(element);
  element.addEventListener("animationend", () => element.remove(), { once: true });
}

function updateBullets(deltaSeconds) {
  bullets = bullets.filter((bullet) => {
    bullet.y -= BULLET_SPEED * deltaSeconds;
    setElementPosition(bullet.element, bullet.x, bullet.y);

    if (bullet.y + bullet.height < 0) {
      bullet.element.remove();
      return false;
    }

    return true;
  });
}

function updateEnemies(deltaSeconds) {
  const maxX = gameArea.clientWidth - ENEMY_SIZE;
  const shipRect = playerRect();

  enemies = enemies.filter((enemy) => {
    enemy.y += enemy.speed * deltaSeconds;
    enemy.x = clamp(enemy.x + enemy.drift * deltaSeconds, 0, maxX);
    setElementPosition(enemy.element, enemy.x, enemy.y);

    if (rectanglesOverlap(shipRect, spriteRect(enemy))) {
      lives -= 1;
      renderHud();
      showExplosion(enemy.x, enemy.y);
      enemy.element.remove();
      if (lives <= 0) {
        finishGame("ライフがなくなりました");
      }
      return false;
    }

    if (enemy.y > gameArea.clientHeight) {
      enemy.element.remove();
      return false;
    }

    return true;
  });
}

function resolveBulletHits() {
  const hitBullets = new Set();
  const hitEnemies = new Set();

  enemies.forEach((enemy, enemyIndex) => {
    const enemyRect = spriteRect(enemy);
    bullets.forEach((bullet, bulletIndex) => {
      if (!hitBullets.has(bulletIndex) && rectanglesOverlap(spriteRect(bullet), enemyRect)) {
        hitBullets.add(bulletIndex);
        hitEnemies.add(enemyIndex);
        score += enemy.points;
        showExplosion(enemy.x, enemy.y);
      }
    });
  });

  if (hitBullets.size === 0 && hitEnemies.size === 0) return;

  bullets = bullets.filter((bullet, index) => {
    if (hitBullets.has(index)) {
      bullet.element.remove();
      return false;
    }
    return true;
  });

  enemies = enemies.filter((enemy, index) => {
    if (hitEnemies.has(index)) {
      enemy.element.remove();
      return false;
    }
    return true;
  });

  renderHud();
}

function gameLoop(timestamp) {
  if (!running) return;

  const deltaSeconds = Math.min((timestamp - lastFrame) / 1000, 0.04);
  lastFrame = timestamp;

  if (keys.has("ArrowLeft") || keys.has("KeyA")) {
    playerX -= PLAYER_SPEED * deltaSeconds;
  }
  if (keys.has("ArrowRight") || keys.has("KeyD")) {
    playerX += PLAYER_SPEED * deltaSeconds;
  }
  if (keys.has("Space")) {
    createBullet();
  }

  playerX = clamp(playerX, 0, gameArea.clientWidth - PLAYER_WIDTH);
  renderPlayer();
  updateBullets(deltaSeconds);
  updateEnemies(deltaSeconds);
  resolveBulletHits();

  animationId = requestAnimationFrame(gameLoop);
}

function finishGame(reason = "任務完了") {
  if (!running) return;

  running = false;
  clearInterval(countdownId);
  clearInterval(spawnId);
  cancelAnimationFrame(animationId);
  startButton.disabled = false;
  startButton.textContent = "もう一度";
  message.classList.remove("hidden");
  message.innerHTML = `<strong>${reason}</strong><span>スコアは ${score} 点です。スペースキーで敵を撃ち落とし、さらに上を目指そう。</span>`;
}

function startGame() {
  resetGame();
  running = true;
  lastFrame = performance.now();
  lastShotAt = 0;
  startButton.disabled = true;
  message.classList.add("hidden");
  gameArea.focus();

  spawnId = setInterval(createEnemy, 560);
  countdownId = setInterval(() => {
    timeLeft -= 1;
    renderHud();
    if (timeLeft <= 0) {
      finishGame("タイムアップ");
    }
  }, 1000);

  animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space"].includes(event.code)) {
    keys.add(event.code);
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("resize", () => {
  playerX = clamp(playerX, 0, gameArea.clientWidth - PLAYER_WIDTH);
  renderPlayer();
});

startButton.addEventListener("click", startGame);
resetGame();
