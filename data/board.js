// Clawnopoly Board Configuration
// 40 tiles following classic Monopoly layout

const BOARD_TILES = [
  // Row 1 (Bottom)
  { id: 0, name: "Go", type: "go", price: 0, rent: 0, color: null, description: "Collect $200 when you pass!" },
  { id: 1, name: "Mediterranean Avenue", type: "property", price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, color: "#8B4513", group: "brown" },
  { id: 2, name: "Community Chest", type: "community", price: 0, rent: 0, color: null, description: "Draw a card!" },
  { id: 3, name: "Baltic Avenue", type: "property", price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, color: "#8B4513", group: "brown" },
  { id: 4, name: "Income Tax", type: "tax", price: 0, rent: 200, color: null, description: "Pay $200 or 10%" },
  { id: 5, name: "Reading Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], color: null, group: "railroad" },
  { id: 6, name: "Oriental Avenue", type: "property", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, color: "#87CEEB", group: "lightblue" },
  { id: 7, name: "Chance", type: "chance", price: 0, rent: 0, color: null, description: "Take a chance!" },
  { id: 8, name: "Vermont Avenue", type: "property", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, color: "#87CEEB", group: "lightblue" },
  { id: 9, name: "Connecticut Avenue", type: "property", price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, color: "#87CEEB", group: "lightblue" },
  
  // Row 2 (Left side going up)
  { id: 10, name: "Jail / Just Visiting", type: "jail", price: 0, rent: 0, color: null, description: "You're in jail or just visiting" },
  { id: 11, name: "St. Charles Place", type: "property", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, color: "#FF69B4", group: "pink" },
  { id: 12, name: "Electric Company", type: "utility", price: 150, rent: [4, 10], color: null, group: "utility", multiplier: "dice" },
  { id: 13, name: "States Avenue", type: "property", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, color: "#FF69B4", group: "pink" },
  { id: 14, name: "Virginia Avenue", type: "property", price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, color: "#FF69B4", group: "pink" },
  { id: 15, name: "Pennsylvania Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], color: null, group: "railroad" },
  { id: 16, name: "St. James Place", type: "property", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, color: "#FFA500", group: "orange" },
  { id: 17, name: "Community Chest", type: "community", price: 0, rent: 0, color: null, description: "Draw a card!" },
  { id: 18, name: "Tennessee Avenue", type: "property", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, color: "#FFA500", group: "orange" },
  { id: 19, name: "New York Avenue", type: "property", price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, color: "#FFA500", group: "orange" },
  
  // Row 3 (Top)
  { id: 20, name: "Free Parking", type: "parking", price: 0, rent: 0, color: null, description: "Free parking - collect the jackpot!" },
  { id: 21, name: "Kentucky Avenue", type: "property", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, color: "#DC143C", group: "red" },
  { id: 22, name: "Chance", type: "chance", price: 0, rent: 0, color: null, description: "Take a chance!" },
  { id: 23, name: "Indiana Avenue", type: "property", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, color: "#DC143C", group: "red" },
  { id: 24, name: "Illinois Avenue", type: "property", price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, color: "#DC143C", group: "red" },
  { id: 25, name: "B&O Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], color: null, group: "railroad" },
  { id: 26, name: "Atlantic Avenue", type: "property", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, color: "#FFD700", group: "yellow" },
  { id: 27, name: "Ventnor Avenue", type: "property", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, color: "#FFD700", group: "yellow" },
  { id: 28, name: "Water Works", type: "utility", price: 150, rent: [4, 10], color: null, group: "utility", multiplier: "dice" },
  { id: 29, name: "Marvin Gardens", type: "property", price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, color: "#FFD700", group: "yellow" },
  
  // Row 4 (Right side going down)
  { id: 30, name: "Go To Jail", type: "goToJail", price: 0, rent: 0, color: null, description: "Go directly to jail!" },
  { id: 31, name: "Pacific Avenue", type: "property", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, color: "#228B22", group: "green" },
  { id: 32, name: "North Carolina Avenue", type: "property", price: 300, rent: [26, 130, 390, 900, 1105, 1275], houseCost: 200, color: "#228B22", group: "green" },
  { id: 33, name: "Community Chest", type: "community", price: 0, rent: 0, color: null, description: "Draw a card!" },
  { id: 34, name: "Pennsylvania Avenue", type: "property", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, color: "#228B22", group: "green" },
  { id: 35, name: "Short Line Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], color: null, group: "railroad" },
  { id: 36, name: "Chance", type: "chance", price: 0, rent: 0, color: null, description: "Take a chance!" },
  { id: 37, name: "Park Place", type: "property", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, color: "#0000FF", group: "darkblue" },
  { id: 38, name: "Luxury Tax", type: "tax", price: 0, rent: 100, color: null, description: "Pay $100" },
  { id: 39, name: "Boardwalk", type: "property", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, color: "#0000FF", group: "darkblue" }
];

// Group configurations for monopoly bonuses
const GROUP_CONFIG = {
  brown: { size: 2, monopolyMultiplier: 2 },
  lightblue: { size: 3, monopolyMultiplier: 2 },
  pink: { size: 3, monopolyMultiplier: 2 },
  orange: { size: 3, monopolyMultiplier: 2 },
  red: { size: 3, monopolyMultiplier: 2 },
  yellow: { size: 3, monopolyMultiplier: 2 },
  green: { size: 3, monopolyMultiplier: 2 },
  darkblue: { size: 2, monopolyMultiplier: 2 },
  railroad: { size: 4, rentProgression: true },
  utility: { size: 2, multiplier: true }
};

module.exports = { BOARD_TILES, GROUP_CONFIG };
