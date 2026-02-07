// Traditional Chance and Community Chest Cards + Chaos Variants

const CHANCE_CARDS = [
  {
    id: 'chance_1',
    text: "Advance to Go! Collect $200.",
    action: (player) => {
      player.position = 0;
      player.money += 200;
      return { newPosition: 0, bonus: 200 };
    }
  },
  {
    id: 'chance_2',
    text: "Advance to Illinois Avenue. If you pass Go, collect $200.",
    action: (player) => {
      const oldPos = player.position;
      player.position = 24;
      if (player.position < oldPos) player.money += 200;
      return { newPosition: 24 };
    }
  },
  {
    id: 'chance_3',
    text: "Advance to St. Charles Place. If you pass Go, collect $200.",
    action: (player) => {
      const oldPos = player.position;
      player.position = 11;
      if (player.position < oldPos) player.money += 200;
      return { newPosition: 11 };
    }
  },
  {
    id: 'chance_4',
    text: "Advance to the nearest utility. If unowned, buy it. If owned, pay owner 10x dice roll.",
    action: (player, game) => {
      const utilities = [12, 28];
      let nearest = utilities[0];
      for (const util of utilities) {
        if (util > player.position) {
          nearest = util;
          break;
        }
      }
      player.position = nearest;
      return { newPosition: nearest, action: 'utility_rent' };
    }
  },
  {
    id: 'chance_5',
    text: "Advance to the nearest railroad. Pay owner 2x rent. If unowned, buy it.",
    action: (player) => {
      const railroads = [5, 15, 25, 35];
      let nearest = railroads[0];
      for (const rail of railroads) {
        if (rail > player.position) {
          nearest = rail;
          break;
        }
      }
      player.position = nearest;
      return { newPosition: nearest, action: 'railroad_rent_2x' };
    }
  },
  {
    id: 'chance_6',
    text: "Bank pays you dividend of $50.",
    action: (player) => {
      player.money += 50;
      return { bonus: 50 };
    }
  },
  {
    id: 'chance_7',
    text: "Get Out of Jail Free!",
    action: (player) => {
      player.getOutOfJailFree = (player.getOutOfJailFree || 0) + 1;
      return { jailCard: true };
    }
  },
  {
    id: 'chance_8',
    text: "Go Back 3 Spaces.",
    action: (player) => {
      player.position = (player.position - 3 + 40) % 40;
      return { newPosition: player.position };
    }
  },
  {
    id: 'chance_9',
    text: "Go to Jail. Go directly to jail. Do not pass Go, do not collect $200.",
    action: (player) => {
      player.position = 10;
      player.inJail = true;
      player.jailTurns = 0;
      return { newPosition: 10, inJail: true };
    }
  },
  {
    id: 'chance_10',
    text: "Make general repairs on all your property. Pay $25 per house, $100 per hotel.",
    action: (player, game) => {
      const properties = player.properties || [];
      let total = 0;
      for (const prop of properties) {
        const tile = game.getTile(prop.id);
        if (tile) {
          total += prop.houses * 25;
          if (prop.hotel) total += 100;
        }
      }
      player.money -= total;
      return { cost: total };
    }
  },
  {
    id: 'chance_11',
    text: "Speeding fine $15.",
    action: (player) => {
      player.money -= 15;
      return { cost: 15 };
    }
  },
  {
    id: 'chance_12',
    text: "Take a trip to Reading Railroad. If you pass Go, collect $200.",
    action: (player) => {
      const oldPos = player.position;
      player.position = 5;
      if (player.position < oldPos) player.money += 200;
      return { newPosition: 5 };
    }
  },
  {
    id: 'chance_13',
    text: "Advance to Boardwalk.",
    action: (player) => {
      player.position = 39;
      return { newPosition: 39 };
    }
  },
  {
    id: 'chance_14',
    text: "You have been elected Chairman of the Board. Pay each player $50.",
    action: (player, game) => {
      const otherPlayers = game.players.filter(p => p.id !== player.id);
      const total = otherPlayers.length * 50;
      player.money -= total;
      for (const p of otherPlayers) {
        p.money += 50;
      }
      return { cost: total, paidTo: otherPlayers.length };
    }
  },
  {
    id: 'chance_15',
    text: "Your building loan matures. Collect $150.",
    action: (player) => {
      player.money += 150;
      return { bonus: 150 };
    }
  }
];

const COMMUNITY_CHEST_CARDS = [
  {
    id: 'chest_1',
    text: "Advance to Go! Collect $200.",
    action: (player) => {
      player.position = 0;
      player.money += 200;
      return { newPosition: 0, bonus: 200 };
    }
  },
  {
    id: 'chest_2',
    text: "Bank error in your favor. Collect $200.",
    action: (player) => {
      player.money += 200;
      return { bonus: 200 };
    }
  },
  {
    id: 'chest_3',
    text: "Doctor's fee. Pay $50.",
    action: (player) => {
      player.money -= 50;
      return { cost: 50 };
    }
  },
  {
    id: 'chest_4',
    text: "From sale of stock you get $50.",
    action: (player) => {
      player.money += 50;
      return { bonus: 50 };
    }
  },
  {
    id: 'chest_5',
    text: "Get Out of Jail Free!",
    action: (player) => {
      player.getOutOfJailFree = (player.getOutOfJailFree || 0) + 1;
      return { jailCard: true };
    }
  },
  {
    id: 'chest_6',
    text: "Go to Jail. Go directly to jail. Do not pass Go, do not collect $200.",
    action: (player) => {
      player.position = 10;
      player.inJail = true;
      player.jailTurns = 0;
      return { newPosition: 10, inJail: true };
    }
  },
  {
    id: 'chest_7',
    text: "Grand Opera Night. Collect $50 from every player for opening night seats.",
    action: (player, game) => {
      const otherPlayers = game.players.filter(p => p.id !== player.id);
      const total = otherPlayers.length * 50;
      for (const p of otherPlayers) {
        p.money -= 50;
      }
      player.money += total;
      return { bonus: total, fromPlayers: otherPlayers.length };
    }
  },
  {
    id: 'chest_8',
    text: "Holiday Fund matures. Receive $100.",
    action: (player) => {
      player.money += 100;
      return { bonus: 100 };
    }
  },
  {
    id: 'chest_9',
    text: "Income tax refund. Collect $20.",
    action: (player) => {
      player.money += 20;
      return { bonus: 20 };
    }
  },
  {
    id: 'chest_10',
    text: "It's your birthday! Collect $10 from every player.",
    action: (player, game) => {
      const otherPlayers = game.players.filter(p => p.id !== player.id);
      const total = otherPlayers.length * 10;
      for (const p of otherPlayers) {
        p.money -= 10;
      }
      player.money += total;
      return { bonus: total, fromPlayers: otherPlayers.length };
    }
  },
  {
    id: 'chest_11',
    text: "Life insurance matures. Collect $100.",
    action: (player) => {
      player.money += 100;
      return { bonus: 100 };
    }
  },
  {
    id: 'chest_12',
    text: "Pay hospital fees of $100.",
    action: (player) => {
      player.money -= 100;
      return { cost: 100 };
    }
  },
  {
    id: 'chest_13',
    text: "Pay school fees of $150.",
    action: (player) => {
      player.money -= 150;
      return { cost: 150 };
    }
  },
  {
    id: 'chest_14',
    text: "Receive $25 consultancy fee.",
    action: (player) => {
      player.money += 25;
      return { bonus: 25 };
    }
  },
  {
    id: 'chest_15',
    text: "You are assessed for street repair. Pay $40 per house, $115 per hotel.",
    action: (player, game) => {
      const properties = player.properties || [];
      let total = 0;
      for (const prop of properties) {
        const tile = game.getTile(prop.id);
        if (tile) {
          total += prop.houses * 40;
          if (prop.hotel) total += 115;
        }
      }
      player.money -= total;
      return { cost: total };
    }
  },
  {
    id: 'chest_16',
    text: "You have won second prize in a beauty contest. Collect $10.",
    action: (player) => {
      player.money += 10;
      return { bonus: 10 };
    }
  },
  {
    id: 'chest_17',
    text: "You inherit $100.",
    action: (player) => {
      player.money += 100;
      return { bonus: 100 };
    }
  }
];

// Draw a random card
function drawChanceCard() {
  return CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
}

function drawCommunityChestCard() {
  return COMMUNITY_CHEST_CARDS[Math.floor(Math.random() * COMMUNITY_CHEST_CARDS.length)];
}

module.exports = {
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  drawChanceCard,
  drawCommunityChestCard
};
