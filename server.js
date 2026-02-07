const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GameEngine = require('./lib/game');
const Database = require('./db/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  path: '/monopoly/socket.io/'
});

// Base path for serving
const BASE_PATH = '/monopoly';

// Serve static files at /monopoly
app.use(BASE_PATH, express.static(path.join(__dirname, 'public')));

// Redirect root to /monopoly
app.get('/', (req, res) => {
  res.redirect(BASE_PATH);
});

// Game instances storage
const games = new Map();
const players = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Create a new game
  socket.on('createGame', async (data) => {
    try {
      const gameId = uuidv4().slice(0, 8).toUpperCase();
      const game = new GameEngine(gameId);
      games.set(gameId, game);

      // Store in database
      await Database.createGame(gameId, game.getBoardState());

      socket.emit('gameCreated', { gameId });
      console.log(`Game created: ${gameId}`);
    } catch (err) {
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  // Join an existing game
  socket.on('joinGame', async (data) => {
    const { gameId, playerName } = data;
    const game = games.get(gameId);

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.isFull()) {
      socket.emit('error', { message: 'Game is full (max 6 players)' });
      return;
    }

    if (game.isStarted()) {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    const player = game.addPlayer(socket.id, playerName);
    players.set(socket.id, { gameId, playerId: player.id });
    socket.join(gameId);

    // Store in database
    await Database.addPlayer(player.id, gameId, playerName, player.color, player.turnOrder);

    socket.emit('joinedGame', { gameId, player });
    io.to(gameId).emit('playerJoined', { players: game.getPlayers() });
    console.log(`Player ${playerName} joined game ${gameId}`);
  });

  // Start the game
  socket.on('startGame', async () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    if (game.getPlayerCount() < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    game.start();
    await Database.updateGame(playerInfo.gameId, { status: 'active' });

    io.to(playerInfo.gameId).emit('gameStarted', {
      board: game.getBoard(),
      players: game.getPlayers(),
      currentPlayer: game.getCurrentPlayer()
    });
    console.log(`Game ${playerInfo.gameId} started`);
  });

  // Roll dice
  socket.on('rollDice', async () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    const result = game.rollDice(playerInfo.playerId);
    if (result.error) {
      socket.emit('error', result);
      return;
    }

    // Check for chaos event
    const chaosEvent = game.checkChaosEvent();

    // Log to database
    await Database.logAction(playerInfo.gameId, playerInfo.playerId, 'roll', result);

    io.to(playerInfo.gameId).emit('diceRolled', {
      playerId: playerInfo.playerId,
      dice: result.dice,
      total: result.total,
      newPosition: result.newPosition,
      passedGo: result.passedGo
    });

    // Handle tile action
    const tileAction = game.handleTileAction(playerInfo.playerId);
    if (tileAction) {
      io.to(playerInfo.gameId).emit('tileAction', tileAction);
    }

    // Trigger chaos event if applicable
    if (chaosEvent) {
      setTimeout(() => {
        const chaosResult = game.executeChaosEvent(chaosEvent, playerInfo.playerId);
        io.to(playerInfo.gameId).emit('chaosEvent', chaosResult);
      }, 1500);
    }

    // Check game end conditions
    const gameEnd = game.checkGameEnd();
    if (gameEnd) {
      io.to(playerInfo.gameId).emit('gameEnded', gameEnd);
    }
  });

  // Buy property
  socket.on('buyProperty', async () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    const result = game.buyProperty(playerInfo.playerId);
    if (result.error) {
      socket.emit('error', result);
      return;
    }

    await Database.logAction(playerInfo.gameId, playerInfo.playerId, 'buyProperty', result);

    io.to(playerInfo.gameId).emit('propertyBought', result);
  });

  // End turn
  socket.on('endTurn', async () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    const result = game.endTurn(playerInfo.playerId);
    if (result.error) {
      socket.emit('error', result);
      return;
    }

    await Database.logAction(playerInfo.gameId, playerInfo.playerId, 'endTurn', result);
    await Database.updateGame(playerInfo.gameId, { current_player: result.nextPlayerIndex });

    io.to(playerInfo.gameId).emit('turnEnded', {
      nextPlayer: game.getCurrentPlayer()
    });
  });

  // Pay to get out of jail
  socket.on('payJailFine', async () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    const result = game.payJailFine(playerInfo.playerId);
    if (result.error) {
      socket.emit('error', result);
      return;
    }

    io.to(playerInfo.gameId).emit('jailFinePaid', result);
  });

  // Use get out of jail free card
  socket.on('useJailCard', async () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    const result = game.useJailCard(playerInfo.playerId);
    if (result.error) {
      socket.emit('error', result);
      return;
    }

    io.to(playerInfo.gameId).emit('jailCardUsed', result);
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('Disconnected:', socket.id);
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.gameId);
      if (game) {
        game.removePlayer(playerInfo.playerId);
        io.to(playerInfo.gameId).emit('playerLeft', { playerId: playerInfo.playerId });
      }
      players.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎲 Clawnopoly server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}/monopoly to play!`);
});
