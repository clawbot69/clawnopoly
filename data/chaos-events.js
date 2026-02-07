// RNG Chaos Events for Clawnopoly
// These events add unpredictable chaos to the game!

const CHAOS_EVENTS = [
  {
    id: 'tax_audit',
    name: 'Tax Audit!',
    description: 'The IRS is after you! Pay 10% of your total net worth.',
    probability: 0.08,
    type: 'negative',
    execute: (player, game) => {
      const netWorth = player.money + (player.properties || []).reduce((sum, prop) => {
        const tile = game.getTile(prop.id);
        return sum + (tile ? tile.price : 0);
      }, 0);
      const tax = Math.floor(netWorth * 0.1);
      player.money = Math.max(0, player.money - tax);
      return { amount: tax, message: `Tax audit! You paid $${tax} to the IRS.` };
    }
  },
  {
    id: 'lottery_win',
    name: 'Lottery Win!',
    description: 'You won the lottery! Collect $500!',
    probability: 0.06,
    type: 'positive',
    execute: (player) => {
      player.money += 500;
      return { amount: 500, message: 'Jackpot! You won $500 in the lottery!' };
    }
  },
  {
    id: 'market_crash',
    name: 'Market Crash!',
    description: 'Property values plummet! All rent is halved for 3 turns.',
    probability: 0.05,
    type: 'negative',
    execute: (player, game) => {
      game.state.marketCrashActive = 3;
      return { message: 'Market crash! All rent is halved for 3 turns.' };
    }
  },
  {
    id: 'market_boom',
    name: 'Market Boom!',
    description: 'Property values soar! All rent is doubled for 2 turns.',
    probability: 0.05,
    type: 'positive',
    execute: (player, game) => {
      game.state.marketBoomActive = 2;
      return { message: 'Market boom! All rent is doubled for 2 turns!' };
    }
  },
  {
    id: 'teleport',
    name: 'Teleport!',
    description: 'You\'ve been teleported to a random location!',
    probability: 0.07,
    type: 'chaos',
    execute: (player) => {
      const oldPos = player.position;
      player.position = Math.floor(Math.random() * 40);
      const passedGo = player.position < oldPos && player.position !== 0;
      if (passedGo) player.money += 200;
      return { 
        oldPosition: oldPos, 
        newPosition: player.position, 
        passedGo,
        message: `Teleported from ${oldPos} to ${player.position}!${passedGo ? ' Passed Go! (+$200)' : ''}`
      };
    }
  },
  {
    id: 'double_trouble_bonus',
    name: 'Double Trouble Bonus!',
    description: 'Roll again and move double the amount!',
    probability: 0.06,
    type: 'positive',
    execute: (player, game) => {
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      const oldPos = player.position;
      player.position = (player.position + total * 2) % 40;
      const passedGo = player.position < oldPos;
      if (passedGo) player.money += 200;
      return {
        dice: [dice1, dice2],
        total: total * 2,
        newPosition: player.position,
        passedGo,
        message: `Double trouble! Rolled ${total} × 2 = ${total * 2} spaces!`
      };
    }
  },
  {
    id: 'double_trouble_disaster',
    name: 'Double Trouble Disaster!',
    description: 'You trip and go backwards! Move back double your roll.',
    probability: 0.05,
    type: 'negative',
    execute: (player) => {
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      player.position = (player.position - total * 2 + 40) % 40;
      return {
        dice: [dice1, dice2],
        total: total * 2,
        newPosition: player.position,
        message: `Disaster! You tripped and moved back ${total * 2} spaces!`
      };
    }
  },
  {
    id: 'forced_trade',
    name: 'Forced Trade!',
    description: 'You must trade one random property with another player!',
    probability: 0.04,
    type: 'chaos',
    execute: (player, game) => {
      const otherPlayers = game.players.filter(p => p.id !== player.id && p.properties && p.properties.length > 0);
      if (player.properties.length === 0 || otherPlayers.length === 0) {
        return { message: 'No trade possible - someone has no properties!' };
      }
      const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
      const myPropIndex = Math.floor(Math.random() * player.properties.length);
      const theirPropIndex = Math.floor(Math.random() * randomPlayer.properties.length);
      
      const myProp = player.properties[myPropIndex];
      const theirProp = randomPlayer.properties[theirPropIndex];
      
      // Swap properties
      player.properties[myPropIndex] = theirProp;
      randomPlayer.properties[theirPropIndex] = myProp;
      
      return {
        tradedWith: randomPlayer.name,
        gave: myProp,
        received: theirProp,
        message: `Forced trade! You traded ${myProp.name} for ${theirProp.name} with ${randomPlayer.name}!`
      };
    }
  },
  {
    id: 'jail_escape',
    name: 'Jailbreak!',
    description: 'Get out of jail free card automatically used if in jail!',
    probability: 0.03,
    type: 'positive',
    execute: (player) => {
      if (player.inJail) {
        player.inJail = false;
        player.jailTurns = 0;
        return { message: 'Jailbreak! You escaped from jail for free!' };
      }
      player.getOutOfJailFree = (player.getOutOfJailFree || 0) + 1;
      return { message: 'You found a Get Out of Jail Free card!' };
    }
  },
  {
    id: 'sudden_death',
    name: 'Sudden Death!',
    description: 'Everyone loses 10% of their cash!',
    probability: 0.03,
    type: 'negative',
    execute: (player, game) => {
      const losses = [];
      game.players.forEach(p => {
        const loss = Math.floor(p.money * 0.1);
        p.money -= loss;
        losses.push({ name: p.name, amount: loss });
      });
      return { losses, message: 'Sudden death! Everyone loses 10% of their cash!' };
    }
  },
  {
    id: 'rainbow_bonus',
    name: 'Rainbow Bonus!',
    description: 'If you own properties in 3+ different color groups, collect $300!',
    probability: 0.05,
    type: 'positive',
    execute: (player) => {
      const groups = new Set((player.properties || []).map(p => p.group));
      if (groups.size >= 3) {
        player.money += 300;
        return { amount: 300, message: `Rainbow bonus! You collected $300 for owning ${groups.size} color groups!` };
      }
      return { message: 'Rainbow bonus failed - you need properties in 3+ color groups.' };
    }
  },
  {
    id: 'chaos_card_doom',
    name: 'Chaos Card: DOOM',
    description: 'The chaos gods frown upon you. Go directly to jail!',
    probability: 0.04,
    type: 'negative',
    execute: (player) => {
      player.position = 10;
      player.inJail = true;
      player.jailTurns = 0;
      return { message: 'DOOM! The chaos gods have sent you to jail!' };
    }
  },
  {
    id: 'chaos_card_blessing',
    name: 'Chaos Card: Blessing',
    description: 'The chaos gods smile upon you. Collect $1000!',
    probability: 0.02,
    type: 'positive',
    execute: (player) => {
      player.money += 1000;
      return { amount: 1000, message: 'Blessing! The chaos gods gifted you $1000!' };
    }
  },
  {
    id: 'property_tax',
    name: 'Property Tax Assessment',
    description: 'Pay $25 per property you own.',
    probability: 0.06,
    type: 'negative',
    execute: (player) => {
      const propCount = (player.properties || []).length;
      const tax = propCount * 25;
      player.money = Math.max(0, player.money - tax);
      return { amount: tax, count: propCount, message: `Property tax! Paid $${tax} for ${propCount} properties.` };
    }
  },
  {
    id: 'inheritance',
    name: 'Unexpected Inheritance',
    description: 'A distant relative left you $200!',
    probability: 0.06,
    type: 'positive',
    execute: (player) => {
      player.money += 200;
      return { amount: 200, message: 'Your uncle Clawbert left you $200!' };
    }
  }
];

// Function to check if a chaos event should trigger
function checkChaosEvent() {
  const roll = Math.random();
  let cumulativeProbability = 0;
  
  for (const event of CHAOS_EVENTS) {
    cumulativeProbability += event.probability;
    if (roll < cumulativeProbability) {
      return event;
    }
  }
  
  return null;
}

// Function to get a random chaos event (for cards, etc.)
function getRandomChaosEvent() {
  return CHAOS_EVENTS[Math.floor(Math.random() * CHAOS_EVENTS.length)];
}

module.exports = { CHAOS_EVENTS, checkChaosEvent, getRandomChaosEvent };
