// Lobby JavaScript
const socket = io();

// Elements
const createGameBtn = document.getElementById('createGameBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const gameCodeInput = document.getElementById('gameCodeInput');
const playerNameInput = document.getElementById('playerNameInput');
const gameCreatedModal = document.getElementById('gameCreatedModal');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const enterGameBtn = document.getElementById('enterGameBtn');

let createdGameCode = null;

// Create game
if (createGameBtn) {
  createGameBtn.addEventListener('click', () => {
    createGameBtn.disabled = true;
    createGameBtn.textContent = 'Creating...';
    socket.emit('createGame');
  });
}

// Game created
socket.on('gameCreated', (data) => {
  createdGameCode = data.gameId;
  gameCodeDisplay.textContent = createdGameCode;
  gameCreatedModal.classList.remove('hidden');
  createGameBtn.disabled = false;
  createGameBtn.textContent = 'Create Game';
});

// Copy game code
if (gameCodeDisplay) {
  gameCodeDisplay.addEventListener('click', () => {
    navigator.clipboard.writeText(createdGameCode);
    gameCodeDisplay.style.borderColor = '#48BB78';
    setTimeout(() => {
      gameCodeDisplay.style.borderColor = '';
    }, 1000);
  });
}

// Enter game room
if (enterGameBtn) {
  enterGameBtn.addEventListener('click', () => {
    const playerName = prompt('Enter your name:');
    if (playerName && playerName.trim()) {
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('gameCode', createdGameCode);
      window.location.href = '/game.html';
    }
  });
}

// Join game
if (joinGameBtn) {
  joinGameBtn.addEventListener('click', () => {
    const gameCode = gameCodeInput.value.trim().toUpperCase();
    const playerName = playerNameInput.value.trim();

    if (!gameCode) {
      alert('Please enter a game code');
      return;
    }
    if (!playerName) {
      alert('Please enter your name');
      return;
    }

    joinGameBtn.disabled = true;
    joinGameBtn.textContent = 'Joining...';
    socket.emit('joinGame', { gameId: gameCode, playerName });
  });
}

// Successfully joined
socket.on('joinedGame', (data) => {
  sessionStorage.setItem('playerName', data.player.name);
  sessionStorage.setItem('gameCode', data.gameId);
  sessionStorage.setItem('playerId', data.player.id);
  window.location.href = '/game.html';
});

// Error handling
socket.on('error', (data) => {
  alert(data.message);
  createGameBtn.disabled = false;
  createGameBtn.textContent = 'Create Game';
  joinGameBtn.disabled = false;
  joinGameBtn.textContent = 'Join Game';
});

// Enter key support
if (gameCodeInput) {
  gameCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      playerNameInput.focus();
    }
  });
}

if (playerNameInput) {
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinGameBtn.click();
    }
  });
}
