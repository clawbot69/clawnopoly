const { BOARD_TILES, GROUP_CONFIG } = require('../data/board');
const { checkChaosEvent } = require('../data/chaos-events');
const { drawChanceCard, drawCommunityChestCard } = require('../data/chance-cards');

const PLAYER_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
const JAIL_FINE = 50;
const STARTING_MONEY = 1500;
const MAX_PLAYERS = 6;

class GameEngine {
  constructor(gameId) {
    this.id = gameId;
    this.players = [];
    this.status = 'waiting'; // waiting, active, ended
    this.currentPlayerIndex = 0;
    this.turnCount = 0;
    this.properties = new Map(); // tileId -> ownerId, houses, hotel, mortgaged
    this.state = {
      marketCrashActive: 0,
      marketBoomActive: 0,
      freeParkingJackpot: 0
    };
    this.board = BOARD_TILES;
    this.chancePile = [];
    this.communityPile = [];
    this.shuffleCards();
  }

  shuffleCards() {
    const { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } = require('../data/chance-cards');
    this.chancePile = [...CHANCE_CARDS].sort(() => Math.random() - 0.5);
    this.communityPile = [...COMMUNITY_CHEST_CARDS].sort(() => Math.random() - 0.5);
  }

  addPlayer(socketId, name) {
    if (this.players.length >= MAX_PLAYERS) {
      return { error: 'Game is full' };
    }

    const player = {
      id: socketId,
      name: name,
      color: PLAYER_COLORS[this.players.length],
      position: 0,
      money: STARTING_MONEY,
      properties: [],
      inJail: false,
      jailTurns: 0,
      getOutOfJailFree: 0,
      turnOrder: this.players.length,
      isActive: true
    };

    this.players.push(player);
    return player;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      this.players.splice(index, 1);
      // Reassign turn orders
      this.players.forEach((p, i) => p.turnOrder = i);
    }
  }

  start() {
    this.status = 'active';
    this.currentPlayerIndex = 0;
    this.turnCount = 1;
  }

  getPlayerCount() {
    return this.players.length;
  }

  isFull() {
    return this.players.length >= MAX_PLAYERS;
  }

  isStarted() {
    return this.status === 'active';
  }

  getPlayers() {
    return this.players;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getBoard() {
    return this.board;
  }

  getTile(tileId) {
    return this.board.find(t => t.id === tileId);
  }

  getBoardState() {
    return {
      tiles: this.board,
      players: this.players.map(p => ({
        id: p.id,
        position: p.position,
        money: p.money
      }))
    };
  }

  rollDice(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { error: 'Not your turn' };
    }

    if (player.inJail) {
      return { error: 'You are in jail. Pay fine or use card first.' };
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;

    const oldPosition = player.position;
    player.position = (player.position + total) % 40;
    const passedGo = player.position < oldPosition && oldPosition !== 0;

    if (passedGo) {
      player.money += 200;
    }

    return {
      dice: [dice1, dice2],
      total,
      newPosition: player.position,
      passedGo
    };
  }

  handleTileAction(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const tile = this.board[player.position];

    switch (tile.type) {
      case 'goToJail':
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        return { type: 'goToJail', message: 'Go directly to jail!' };

      case 'tax':
        const taxAmount = tile.rent;
        player.money -= taxAmount;
        this.state.freeParkingJackpot += taxAmount;
        return { type: 'tax', amount: taxAmount };

      case 'chance':
        return this.drawChanceCard(player);

      case 'community':
        return this.drawCommunityCard(player);

      case 'parking':
        if (this.state.freeParkingJackpot > 0) {
          const jackpot = this.state.freeParkingJackpot;
          player.money += jackpot;
          this.state.freeParkingJackpot = 0;
          return { type: 'parking', amount: jackpot };
        }
        return { type: 'parking', amount: 0 };

      case 'property':
      case 'railroad':
      case 'utility':
        const propertyState = this.properties.get(tile.id);
        if (propertyState && propertyState.ownerId !== playerId) {
          const rent = this.calculateRent(tile, propertyState);
          const owner = this.players.find(p => p.id === propertyState.ownerId);
          player.money -= rent;
          if (owner) owner.money += rent;
          return { 
            type: 'rent', 
            amount: rent, 
            property: tile.name, 
            owner: owner ? owner.name : 'Unknown' 
          };
        } else if (!propertyState) {
          return { type: 'canBuy', property: tile };
        }
        return null;

      default:
        return null;
    }
  }

  calculateRent(tile, propertyState) {
    let rent = 0;

    if (tile.type === 'property') {
      if (propertyState.hotel) {
        rent = tile.rent[5];
      } else if (propertyState.houses > 0) {
        rent = tile.rent[propertyState.houses];
      } else {
        rent = tile.rent[0];
        // Check for monopoly
        if (this.hasMonopoly(propertyState.ownerId, tile.group)) {
          rent *= 2;
        }
      }
    } else if (tile.type === 'railroad') {
      const railroadCount = this.countOwnedRailroads(propertyState.ownerId);
      rent = tile.rent[railroadCount - 1];
    } else if (tile.type === 'utility') {
      const utilityCount = this.countOwnedUtilities(propertyState.ownerId);
      const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
      rent = utilityCount === 2 ? roll * 10 : roll * 4;
    }

    // Apply market effects
    if (this.state.marketCrashActive > 0) rent = Math.floor(rent / 2);
    if (this.state.marketBoomActive > 0) rent *= 2;

    return rent;
  }

  hasMonopoly(playerId, group) {
    const groupConfig = GROUP_CONFIG[group];
    if (!groupConfig) return false;

    const ownedInGroup = Array.from(this.properties.entries())
      .filter(([tileId, state]) => {
        const tile = this.getTile(tileId);
        return tile && tile.group === group && state.ownerId === playerId;
      });

    return ownedInGroup.length === groupConfig.size;
  }

  countOwnedRailroads(playerId) {
    return Array.from(this.properties.values())
      .filter(p => {
        const tile = this.getTile(p.tileId);
        return tile && tile.type === 'railroad' && p.ownerId === playerId;
      }).length;
  }

  countOwnedUtilities(playerId) {
    return Array.from(this.properties.values())
      .filter(p => {
        const tile = this.getTile(p.tileId);
        return tile && tile.type === 'utility' && p.ownerId === playerId;
      }).length;
  }

  buyProperty(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { error: 'Not your turn' };
    }

    const tile = this.board[player.position];
    if (tile.type !== 'property' && tile.type !== 'railroad' && tile.type !== 'utility') {
      return { error: 'Cannot buy this tile' };
    }

    if (this.properties.has(tile.id)) {
      return { error: 'Property already owned' };
    }

    if (player.money < tile.price) {
      return { error: 'Not enough money' };
    }

    player.money -= tile.price;
    this.properties.set(tile.id, {
      tileId: tile.id,
      ownerId: playerId,
      houses: 0,
      hotel: false,
      mortgaged: false
    });
    player.properties.push({
      id: tile.id,
      name: tile.name,
      group: tile.group
    });

    return { 
      property: tile.name, 
      price: tile.price, 
      remainingMoney: player.money 
    };
  }

  drawChanceCard(player) {
    const card = drawChanceCard();
    const result = card.action(player, this);
    return { type: 'chance', card: card.text, result };
  }

  drawCommunityCard(player) {
    const card = drawCommunityChestCard();
    const result = card.action(player, this);
    return { type: 'community', card: card.text, result };
  }

  checkChaosEvent() {
    return checkChaosEvent();
  }

  executeChaosEvent(event, playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const result = event.execute(player, this);
    return {
      eventName: event.name,
      description: event.description,
      type: event.type,
      result
    };
  }

  payJailFine(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    if (!player.inJail) {
      return { error: 'Not in jail' };
    }

    if (player.money < JAIL_FINE) {
      return { error: 'Not enough money' };
    }

    player.money -= JAIL_FINE;
    player.inJail = false;
    player.jailTurns = 0;
    this.state.freeParkingJackpot += JAIL_FINE;

    return { paid: JAIL_FINE, remainingMoney: player.money };
  }

  useJailCard(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    if (!player.inJail) {
      return { error: 'Not in jail' };
    }

    if (player.getOutOfJailFree <= 0) {
      return { error: 'No jail cards available' };
    }

    player.getOutOfJailFree--;
    player.inJail = false;
    player.jailTurns = 0;

    return { cardUsed: true, remainingCards: player.getOutOfJailFree };
  }

  endTurn(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { error: 'Not your turn' };
    }

    // Decrement market effects
    if (this.state.marketCrashActive > 0) this.state.marketCrashActive--;
    if (this.state.marketBoomActive > 0) this.state.marketBoomActive--;

    // Next player's turn
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    
    // If we wrapped around, increment turn count
    if (this.currentPlayerIndex === 0) {
      this.turnCount++;
    }

    return { nextPlayerIndex: this.currentPlayerIndex };
  }

  checkGameEnd() {
    const activePlayers = this.players.filter(p => p.money > 0);
    
    if (activePlayers.length === 1) {
      return {
        winner: activePlayers[0],
        reason: 'Last player standing'
      };
    }

    // Check for bankruptcy
    const bankruptPlayers = this.players.filter(p => p.money <= 0);
    for (const player of bankruptPlayers) {
      player.isActive = false;
      // Return properties to bank
      for (const [tileId, state] of this.properties) {
        if (state.ownerId === player.id) {
          this.properties.delete(tileId);
        }
      }
      player.properties = [];
    }

    return null;
  }
}

module.exports = GameEngine;
