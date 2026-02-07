// Game JavaScript
const socket = io({
  path: '/monopoly/socket.io/'
});

// Game state
let gameState = {
  gameId: null,
  playerId: null,
  playerName: null,
  board: [],
  players: [],
  currentPlayer: null,
  myTurn: false,
  canBuy: false
};

// DOM Elements
const board = document.getElementById('board');
const playersList = document.getElementById('playersList');
const gameLog = document.getElementById('gameLog');
const rollBtn = document.getElementById('rollBtn');
const buyBtn = document.getElementById('buyBtn');
const endTurnBtn = document.getElementById('endTurnBtn');
const payJailBtn = document.getElementById('payJailBtn');
const useJailCardBtn = document.getElementById('useJailCardBtn');
const diceModal = document.getElementById('diceModal');
const chaosModal = document.getElementById('chaosModal');
const cardModal = document.getElementById('cardModal');
const gameCodeEl = document.getElementById('gameCode');
const turnInfoEl = document.getElementById('turnInfo');

// Initialize
function init() {
  gameState.gameId = sessionStorage.getItem('gameCode');
  gameState.playerName = sessionStorage.getItem('playerName');
  gameState.playerId = sessionStorage.getItem('playerId');

  if (!gameState.gameId) {
    window.location.href = '/';
    return;
  }

  gameCodeEl.textContent = `Game: ${gameState.gameId}`;
  
  // Join the game room
  socket.emit('joinGame', { 
    gameId: gameState.gameId, 
    playerName: gameState.playerName 
  });
}

// Render the board
function renderBoard() {
  if (!gameState.board.length) return;

  board.innerHTML = '';
  
  // Create board layout (11x11 grid)
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
      let tileId = null;
      
      // Calculate tile ID based on position
      if (row === 10 && col === 10) tileId = 0; // Go
      else if (row === 10 && col > 0 && col < 10) tileId = 10 - col; // Bottom row
      else if (row === 10 && col === 0) tileId = 10; // Jail
      else if (col === 0 && row > 0 && row < 10) tileId = 10 + (10 - row); // Left column (going up)
      else if (row === 0 && col === 0) tileId = 20; // Free Parking
      else if (row === 0 && col > 0 && col < 10) tileId = 20 + col; // Top row
      else if (row === 0 && col === 10) tileId = 30; // Go to Jail
      else if (col === 10 && row > 0 && row < 10) tileId = 30 + (10 - row); // Right column (going down)
      
      if (tileId !== null) {
        const tile = gameState.board.find(t => t.id === tileId);
        const tileEl = createTileElement(tile, tileId);
        
        // Position on grid
        tileEl.style.gridRow = row + 1;
        tileEl.style.gridColumn = col + 1;
        
        board.appendChild(tileEl);
      }
    }
  }
  
  // Render player tokens
  renderTokens();
}

function createTileElement(tile, tileId) {
  const div = document.createElement('div');
  div.className = 'tile';
  div.dataset.tileId = tileId;
  
  if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
    div.classList.add('property');
    if (tile.color) {
      div.style.borderTopColor = tile.color;
    }
  }
  
  if (tileId === 0 || tileId === 10 || tileId === 20 || tileId === 30) {
    div.classList.add('corner');
  }
  
  div.innerHTML = `
    <div class="tile-name">${tile.name}</div>
    ${tile.price ? `<div class="tile-price">$${tile.price}</div>` : ''}
  `;
  
  div.addEventListener('click', () => showTileInfo(tile));
  
  return div;
}

function renderTokens() {
  // Remove existing tokens
  document.querySelectorAll('.token').forEach(t => t.remove());
  
  gameState.players.forEach(player => {
    const tileEl = document.querySelector(`.tile[data-tile-id="${player.position}"]`);
    if (tileEl) {
      const token = document.createElement('div');
      token.className = 'token';
      token.style.backgroundColor = player.color;
      token.title = player.name;
      
      // Offset tokens for multiple players on same tile
      const existingTokens = tileEl.querySelectorAll('.token').length;
      token.style.left = `${10 + (existingTokens * 18)}px`;
      token.style.top = '25px';
      
      tileEl.appendChild(token);
    }
  });
}

function renderPlayers() {
  playersList.innerHTML = '';
  
  gameState.players.forEach(player => {
    const div = document.createElement('div');
    div.className = 'player-item';
    if (gameState.currentPlayer && gameState.currentPlayer.id === player.id) {
      div.classList.add('current');
    }
    
    div.innerHTML = `
      <div class="player-color" style="background-color: ${player.color}"></div>
      <div class="player-info">
        <div class="player-name">${player.name}</div>
        <div class="player-money">$${player.money}</div>
      </div>
    `;
    
    playersList.appendChild(div);
  });
}

function updateTurnInfo() {
  if (!gameState.currentPlayer) return;
  
  const isMyTurn = gameState.currentPlayer.id === gameState.playerId;
  gameState.myTurn = isMyTurn;
  
  turnInfoEl.textContent = isMyTurn ? "Your Turn!" : `${gameState.currentPlayer.name}'s Turn`;
  turnInfoEl.style.color = isMyTurn ? '#48BB78' : '#A0AEC0';
  
  // Update buttons
  updateActionButtons();
}

function updateActionButtons() {
  const myPlayer = gameState.players.find(p => p.id === gameState.playerId);
  
  rollBtn.classList.add('hidden');
  buyBtn.classList.add('hidden');
  endTurnBtn.classList.add('hidden');
  payJailBtn.classList.add('hidden');
  useJailCardBtn.classList.add('hidden');
  
  if (!gameState.myTurn) return;
  
  if (myPlayer.inJail) {
    payJailBtn.classList.remove('hidden');
    if (myPlayer.getOutOfJailFree > 0) {
      useJailCardBtn.classList.remove('hidden');
    }
  } else {
    rollBtn.classList.remove('hidden');
    
    if (gameState.canBuy) {
      buyBtn.classList.remove('hidden');
    }
    
    endTurnBtn.classList.remove('hidden');
  }
}

function addLogEntry(message, type = 'system') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  gameLog.appendChild(entry);
  gameLog.scrollTop = gameLog.scrollHeight;
}

// Socket event handlers
socket.on('gameStarted', (data) => {
  gameState.board = data.board;
  gameState.players = data.players;
  gameState.currentPlayer = data.currentPlayer;
  
  renderBoard();
  renderPlayers();
  updateTurnInfo();
  addLogEntry('Game started! Good luck!', 'system');
});

socket.on('playerJoined', (data) => {
  gameState.players = data.players;
  renderPlayers();
  addLogEntry(`A new player joined the game`, 'system');
});

socket.on('diceRolled', (data) => {
  // Show dice animation
  showDiceModal(data.dice, data.total);
  
  setTimeout(() => {
    hideDiceModal();
    addLogEntry(`${data.playerId === gameState.playerId ? 'You' : 'A player'} rolled ${data.total}`, 'player');
    
    if (data.passedGo) {
      addLogEntry('Passed Go! +$200', 'system');
    }
    
    // Update player position
    const player = gameState.players.find(p => p.id === data.playerId);
    if (player) {
      player.position = data.newPosition;
      renderTokens();
    }
  }, 1500);
});

socket.on('tileAction', (data) => {
  if (data.type === 'canBuy') {
    gameState.canBuy = true;
    addLogEntry(`Can buy ${data.property.name} for $${data.property.price}`, 'system');
  } else if (data.type === 'rent') {
    addLogEntry(`Paid $${data.amount} rent to ${data.owner}`, 'player');
  } else if (data.type === 'tax') {
    addLogEntry(`Paid $${data.amount} in taxes`, 'player');
  } else if (data.type === 'parking' && data.amount > 0) {
    addLogEntry(`Collected $${data.amount} from Free Parking!`, 'system');
  } else if (data.type === 'goToJail') {
    addLogEntry('Go directly to jail!', 'system');
  }
  
  renderPlayers();
  updateActionButtons();
});

socket.on('chaosEvent', (data) => {
  showChaosModal(data);
  addLogEntry(`CHAOS: ${data.result.message}`, 'chaos');
  renderPlayers();
  renderTokens();
});

socket.on('propertyBought', (data) => {
  addLogEntry(`Bought ${data.property} for $${data.price}`, 'player');
  gameState.canBuy = false;
  updateActionButtons();
  renderPlayers();
});

socket.on('turnEnded', (data) => {
  gameState.currentPlayer = data.nextPlayer;
  gameState.canBuy = false;
  updateTurnInfo();
  renderPlayers();
  addLogEntry(`Turn ended. Now it's ${data.nextPlayer.name}'s turn.`, 'system');
});

socket.on('jailFinePaid', (data) => {
  addLogEntry('Paid $50 to get out of jail', 'player');
  updateActionButtons();
  renderPlayers();
});

socket.on('jailCardUsed', (data) => {
  addLogEntry('Used Get Out of Jail Free card!', 'player');
  updateActionButtons();
  renderPlayers();
});

socket.on('gameEnded', (data) => {
  const isWinner = data.winner.id === gameState.playerId;
  alert(isWinner ? '🎉 YOU WON! 🎉' : `Game Over! ${data.winner.name} won!`);
});

socket.on('error', (data) => {
  alert(data.message);
});

// Button event listeners
if (rollBtn) {
  rollBtn.addEventListener('click', () => {
    rollBtn.disabled = true;
    socket.emit('rollDice');
  });
}

if (buyBtn) {
  buyBtn.addEventListener('click', () => {
    socket.emit('buyProperty');
  });
}

if (endTurnBtn) {
  endTurnBtn.addEventListener('click', () => {
    socket.emit('endTurn');
  });
}

if (payJailBtn) {
  payJailBtn.addEventListener('click', () => {
    socket.emit('payJailFine');
  });
}

if (useJailCardBtn) {
  useJailCardBtn.addEventListener('click', () => {
    socket.emit('useJailCard');
  });
}

// Modal functions
function showDiceModal(dice, total) {
  document.getElementById('dice1').textContent = getDiceEmoji(dice[0]);
  document.getElementById('dice2').textContent = getDiceEmoji(dice[1]);
  document.getElementById('diceTotal').textContent = `Total: ${total}`;
  diceModal.classList.remove('hidden');
}

function hideDiceModal() {
  diceModal.classList.add('hidden');
  rollBtn.disabled = false;
}

function getDiceEmoji(value) {
  const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  return dice[value - 1];
}

function showChaosModal(data) {
  document.getElementById('chaosName').textContent = data.eventName;
  document.getElementById('chaosDescription').textContent = data.description;
  document.getElementById('chaosResult').textContent = data.result.message;
  chaosModal.classList.remove('hidden');
}

if (document.getElementById('closeChaosBtn')) {
  document.getElementById('closeChaosBtn').addEventListener('click', () => {
    chaosModal.classList.add('hidden');
  });
}

function showTileInfo(tile) {
  // Simple alert for now - could be expanded to a modal
  let info = `${tile.name}\n`;
  if (tile.type === 'property') {
    info += `Type: Property\n`;
    info += `Price: $${tile.price}\n`;
    info += `Rent: $${tile.rent[0]} (base)\n`;
    info += `House Cost: $${tile.houseCost}`;
  } else if (tile.type === 'railroad') {
    info += `Type: Railroad\n`;
    info += `Price: $${tile.price}`;
  } else if (tile.type === 'utility') {
    info += `Type: Utility\n`;
    info += `Price: $${tile.price}`;
  } else {
    info += tile.description || '';
  }
  console.log(info);
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
