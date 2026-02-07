const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'clawnopoly.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    // Games table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'waiting',
        current_player INTEGER DEFAULT 0,
        turn_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        board_state TEXT,
        rng_seed INTEGER
      )
    `);

    // Players table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        game_id TEXT,
        name TEXT,
        color TEXT,
        position INTEGER DEFAULT 0,
        money INTEGER DEFAULT 1500,
        in_jail BOOLEAN DEFAULT 0,
        jail_turns INTEGER DEFAULT 0,
        properties TEXT,
        get_out_of_jail_free INTEGER DEFAULT 0,
        turn_order INTEGER,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (game_id) REFERENCES games(id)
      )
    `);

    // Properties table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY,
        game_id TEXT,
        owner_id TEXT,
        houses INTEGER DEFAULT 0,
        hotel BOOLEAN DEFAULT 0,
        mortgaged BOOLEAN DEFAULT 0,
        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (owner_id) REFERENCES players(id)
      )
    `);

    // Game history/log
    this.db.run(`
      CREATE TABLE IF NOT EXISTS game_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT,
        player_id TEXT,
        action TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id)
      )
    `);

    console.log('Database tables initialized');
  }

  // Game methods
  createGame(gameId, boardState) {
    return new Promise((resolve, reject) => {
      const rngSeed = Math.floor(Math.random() * 1000000);
      this.db.run(
        'INSERT INTO games (id, status, board_state, rng_seed) VALUES (?, ?, ?, ?)',
        [gameId, 'waiting', JSON.stringify(boardState), rngSeed],
        function(err) {
          if (err) reject(err);
          else resolve({ id: gameId, rngSeed });
        }
      );
    });
  }

  getGame(gameId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  updateGame(gameId, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), gameId];
      this.db.run(
        `UPDATE games SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // Player methods
  addPlayer(playerId, gameId, name, color, turnOrder) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO players (id, game_id, name, color, turn_order) VALUES (?, ?, ?, ?, ?)',
        [playerId, gameId, name, color, turnOrder],
        function(err) {
          if (err) reject(err);
          else resolve({ id: playerId });
        }
      );
    });
  }

  getPlayers(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM players WHERE game_id = ? ORDER BY turn_order',
        [gameId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getPlayer(playerId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM players WHERE id = ?', [playerId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  updatePlayer(playerId, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), playerId];
      this.db.run(
        `UPDATE players SET ${fields} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // Property methods
  updateProperty(gameId, propertyId, updates) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM properties WHERE game_id = ? AND id = ?',
        [gameId, propertyId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), gameId, propertyId];
            this.db.run(
              `UPDATE properties SET ${fields} WHERE game_id = ? AND id = ?`,
              values,
              function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
              }
            );
          } else {
            const fields = ['game_id', 'id', ...Object.keys(updates)];
            const placeholders = fields.map(() => '?').join(', ');
            const values = [gameId, propertyId, ...Object.values(updates)];
            this.db.run(
              `INSERT INTO properties (${fields.join(', ')}) VALUES (${placeholders})`,
              values,
              function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
              }
            );
          }
        }
      );
    });
  }

  getProperties(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM properties WHERE game_id = ?',
        [gameId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Game log
  logAction(gameId, playerId, action, details) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO game_log (game_id, player_id, action, details) VALUES (?, ?, ?, ?)',
        [gameId, playerId, action, JSON.stringify(details)],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  getGameLog(gameId, limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM game_log WHERE game_id = ? ORDER BY timestamp DESC LIMIT ?',
        [gameId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Cleanup
  deleteGame(gameId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM game_log WHERE game_id = ?', [gameId], (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.db.run('DELETE FROM properties WHERE game_id = ?', [gameId], (err) => {
          if (err) {
            reject(err);
            return;
          }
          this.db.run('DELETE FROM players WHERE game_id = ?', [gameId], (err) => {
            if (err) {
              reject(err);
              return;
            }
            this.db.run('DELETE FROM games WHERE id = ?', [gameId], function(err) {
              if (err) reject(err);
              else resolve({ changes: this.changes });
            });
          });
        });
      });
    });
  }
}

module.exports = new Database();