const pool = require('./db');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  console.log('⚡ Initializing GameLoot Database Schema...');

  try {
    // 1. Admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('superadmin', 'admin', 'moderator') DEFAULT 'admin',
        avatar VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(50) DEFAULT 'Gamepad2',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Games table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        category_id INT,
        description TEXT,
        thumbnail_url VARCHAR(500),
        banner_url VARCHAR(500),
        embed_url VARCHAR(500) NOT NULL,
        orientation ENUM('portrait', 'landscape', 'any') DEFAULT 'any',
        reward_rate INT DEFAULT 10 COMMENT 'Points awarded per minute played',
        max_daily_reward INT DEFAULT 500 COMMENT 'Max points earned per user/day from this game',
        min_play_seconds INT DEFAULT 30 COMMENT 'Min seconds before any points accrue',
        featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        play_count INT DEFAULT 0,
        rating DECIMAL(3,1) DEFAULT 4.8,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(500) DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=gameloot',
        points_balance INT DEFAULT 0,
        tickets_balance INT DEFAULT 5,
        total_earned INT DEFAULT 0,
        total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
        device_id VARCHAR(150),
        ip_address VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Game Sessions (Heartbeat & Play Proof)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_token VARCHAR(100) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        game_id INT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        duration_seconds INT DEFAULT 0,
        points_earned INT DEFAULT 0,
        last_ping_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'completed', 'abandoned', 'flagged') DEFAULT 'active',
        ip_address VARCHAR(64),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Reward items catalog (payout options)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reward_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        type ENUM('paypal', 'crypto', 'google_play', 'steam', 'amazon', 'apple') NOT NULL,
        cost_points INT NOT NULL,
        cash_value_usd DECIMAL(10,2) NOT NULL,
        icon_url VARCHAR(500),
        description VARCHAR(255),
        stock INT DEFAULT 999,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Reward Redemptions (Cashout requests)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reward_redemptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reward_item_id INT NULL,
        reward_title VARCHAR(150) NOT NULL,
        reward_type VARCHAR(50) NOT NULL,
        points_spent INT NOT NULL,
        cash_value_usd DECIMAL(10,2) NOT NULL,
        payout_details TEXT NOT NULL COMMENT 'Email or wallet address provided by user',
        status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reward_item_id) REFERENCES reward_items(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Points ledger transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('game_reward', 'daily_bonus', 'referral', 'redemption', 'admin_adjustment') NOT NULL,
        amount INT NOT NULL,
        balance_after INT NOT NULL,
        description VARCHAR(255),
        reference_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. System settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        setting_label VARCHAR(150) NOT NULL,
        setting_type VARCHAR(50) DEFAULT 'string',
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Fraud & Security logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fraud_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        game_id INT NULL,
        reason VARCHAR(255) NOT NULL,
        details TEXT,
        severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        status ENUM('unreviewed', 'dismissed', 'actioned') DEFAULT 'unreviewed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Tables created or verified.');

    // Seed default Admin if not exists
    const [adminCheck] = await pool.query('SELECT id FROM admins WHERE email = ?', ['admin@gameloot.com']);
    if (adminCheck.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO admins (username, email, password_hash, role, avatar)
        VALUES (?, ?, ?, 'superadmin', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150')
      `, ['admin', 'admin@gameloot.com', hash]);
      console.log('👑 Default Admin created: admin@gameloot.com / admin123');
    }

    // Seed Categories
    const [catCount] = await pool.query('SELECT COUNT(*) as cnt FROM categories');
    if (catCount[0].cnt === 0) {
      const categoriesData = [
        ['Arcade & Retro', 'arcade', 'Gamepad2', 'Fast-paced classic and reflex arcade challenges', 1],
        ['Puzzle & Brain', 'puzzle', 'Brain', 'Test your logic, puzzle solving, and memory skills', 2],
        ['Action & Adventure', 'action', 'Flame', 'Exciting combat, dodging, and adventure platforms', 3],
        ['Casual & Relaxing', 'casual', 'Coffee', 'Simple, addictive one-tap and relaxing sessions', 4],
        ['Sports & Racing', 'sports', 'Trophy', 'High speed drives, athletic skills, and sports fun', 5]
      ];
      for (const cat of categoriesData) {
        await pool.query('INSERT INTO categories (name, slug, icon, description, display_order) VALUES (?, ?, ?, ?, ?)', cat);
      }
      console.log('📁 Categories seeded.');
    }

    // Seed HTML5 Embedded Games
    const [gameCount] = await pool.query('SELECT COUNT(*) as cnt FROM games');
    if (gameCount[0].cnt === 0) {
      const [cats] = await pool.query('SELECT id, slug FROM categories');
      const catMap = {};
      cats.forEach(c => { catMap[c.slug] = c.id; });

      const sampleGames = [
        {
          title: '2048 Cyber Edition',
          slug: '2048-cyber',
          category_id: catMap['puzzle'] || 1,
          description: 'Swipe and merge numbers to hit the legendary 2048 tile. Highly addictive mental puzzle!',
          thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
          banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
          embed_url: 'https://play2048.co/',
          orientation: 'portrait',
          reward_rate: 15,
          max_daily_reward: 450,
          min_play_seconds: 30,
          featured: true,
          rating: 4.9,
          play_count: 1420
        },
        {
          title: 'Hextris Hexagon Mania',
          slug: 'hextris-mania',
          category_id: catMap['arcade'] || 1,
          description: 'Fast paced hexagonal puzzle game inspired by Tetris. Match 3 colors to clear lines before the hex overflows!',
          thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
          banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
          embed_url: 'https://hextris.io/',
          orientation: 'any',
          reward_rate: 18,
          max_daily_reward: 540,
          min_play_seconds: 40,
          featured: true,
          rating: 4.8,
          play_count: 980
        },
        {
          title: 'Tower Master 3D',
          slug: 'tower-master-3d',
          category_id: catMap['casual'] || 1,
          description: 'Stack blocks with precision timing to construct the highest skyscraper in the metropolis.',
          thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80',
          banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80',
          embed_url: 'https://www.google.com', // fallback or customizable embed
          orientation: 'portrait',
          reward_rate: 12,
          max_daily_reward: 360,
          min_play_seconds: 25,
          featured: false,
          rating: 4.7,
          play_count: 670
        },
        {
          title: 'Retro Space Invaders',
          slug: 'space-invaders-retro',
          category_id: catMap['action'] || 1,
          description: 'Defend planet Earth from waves of cosmic alien armadas in this arcade classic revival.',
          thumbnail_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=500&q=80',
          banner_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1200&q=80',
          embed_url: 'https://freeinvaders.org/',
          orientation: 'landscape',
          reward_rate: 20,
          max_daily_reward: 600,
          min_play_seconds: 45,
          featured: true,
          rating: 4.9,
          play_count: 1850
        },
        {
          title: 'Speed Neon Racer',
          slug: 'speed-neon-racer',
          category_id: catMap['sports'] || 1,
          description: 'Blaze through neon-lit futuristic highways, dodge supersonic traffic, and beat the clock!',
          thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80',
          banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
          embed_url: 'https://slowroads.io/',
          orientation: 'landscape',
          reward_rate: 22,
          max_daily_reward: 700,
          min_play_seconds: 60,
          featured: true,
          rating: 4.85,
          play_count: 2310
        }
      ];

      for (const g of sampleGames) {
        await pool.query(`
          INSERT INTO games (title, slug, category_id, description, thumbnail_url, banner_url, embed_url, orientation, reward_rate, max_daily_reward, min_play_seconds, featured, rating, play_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [g.title, g.slug, g.category_id, g.description, g.thumbnail_url, g.banner_url, g.embed_url, g.orientation, g.reward_rate, g.max_daily_reward, g.min_play_seconds, g.featured, g.rating, g.play_count]);
      }
      console.log('🎮 Games seeded.');
    }

    // Seed Reward Items Catalog
    const [rewardCount] = await pool.query('SELECT COUNT(*) as cnt FROM reward_items');
    if (rewardCount[0].cnt === 0) {
      const rewards = [
        ['PayPal $5 Payout', 'paypal', 5000, 5.00, 'https://cdn-icons-png.flaticon.com/512/174/174861.png', 'Instant cash to your PayPal balance', 100],
        ['PayPal $10 Payout', 'paypal', 9800, 10.00, 'https://cdn-icons-png.flaticon.com/512/174/174861.png', 'Instant cash with bonus discount', 100],
        ['Google Play $10 Gift Card', 'google_play', 10000, 10.00, 'https://cdn-icons-png.flaticon.com/512/888/888857.png', 'Digital gift code for Android apps & games', 50],
        ['Steam Wallet $10 Code', 'steam', 10000, 10.00, 'https://cdn-icons-png.flaticon.com/512/220/220223.png', 'Add funds to your Steam game library', 45],
        ['USDT Tether $10 Crypto', 'crypto', 10000, 10.00, 'https://cdn-icons-png.flaticon.com/512/7047/7047059.png', 'Sent directly to your BEP20 or TRC20 address', 80],
        ['Amazon $25 Gift Card', 'amazon', 24000, 25.00, 'https://cdn-icons-png.flaticon.com/512/5968/5968204.png', 'Shop anything on Amazon store', 30]
      ];
      for (const r of rewards) {
        await pool.query(`
          INSERT INTO reward_items (title, type, cost_points, cash_value_usd, icon_url, description, stock)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, r);
      }
      console.log('🎁 Reward items catalog seeded.');
    }

    // Seed System Settings
    const defaultSettings = [
      ['points_per_usd', '1000', 'Points per $1.00 USD', 'number', 'Base exchange rate for points to real USD value'],
      ['min_payout_points', '5000', 'Minimum Cashout Threshold', 'number', 'Minimum points a player must accumulate to request withdrawal'],
      ['daily_max_points_global', '2500', 'Global Daily Points Cap', 'number', 'Max points any user can earn per 24 hours across all games'],
      ['ping_interval_seconds', '30', 'Heartbeat Ping Interval (sec)', 'number', 'How often the game client must submit proof-of-play ping'],
      ['maintenance_mode', 'false', 'Maintenance Mode', 'boolean', 'Temporarily disable game earnings and redemptions'],
      ['app_name', 'GameLoot Play & Earn', 'Application Brand Name', 'string', 'Public brand name shown in app and emails']
    ];
    for (const [key, val, label, type, desc] of defaultSettings) {
      await pool.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_label, setting_type, description)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_label = VALUES(setting_label), description = VALUES(description)
      `, [key, val, label, type, desc]);
    }
    console.log('⚙️ System settings seeded.');

    // Seed sample Users & Sessions & Redemptions if users table is empty
    const [uCount] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    if (uCount[0].cnt === 0) {
      const testHash = await bcrypt.hash('player123', 10);
      const sampleUsers = [
        ['CyberSamurai', 'samurai@gameloot.com', 4320, 12, 12500, 10.00, 'active'],
        ['NeonValkyrie', 'valkyrie@gameloot.com', 8950, 24, 18950, 10.00, 'active'],
        ['PixelGhost', 'ghost@gameloot.com', 1250, 3, 3450, 0.00, 'active'],
        ['SpeedDemon99', 'speed@gameloot.com', 21400, 40, 45000, 25.00, 'active'],
        ['GlitchHunter', 'glitch@gameloot.com', 50, 0, 50, 0.00, 'suspended']
      ];

      for (const u of sampleUsers) {
        const [res] = await pool.query(`
          INSERT INTO users (username, email, password_hash, points_balance, tickets_balance, total_earned, total_withdrawn, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [u[0], u[1], testHash, u[2], u[3], u[4], u[5], u[6]]);

        const userId = res.insertId;

        // Add sample point transaction
        await pool.query(`
          INSERT INTO point_transactions (user_id, type, amount, balance_after, description)
          VALUES (?, 'game_reward', 250, ?, 'Earned from playing 2048 Cyber Edition')
        `, [userId, u[2]]);
      }

      // Add a couple sample redemptions
      await pool.query(`
        INSERT INTO reward_redemptions (user_id, reward_title, reward_type, points_spent, cash_value_usd, payout_details, status, admin_notes, created_at)
        VALUES 
        (1, 'PayPal $10 Payout', 'paypal', 9800, 10.00, 'samurai.gamer@gmail.com', 'pending', 'User requested PayPal cashout', NOW() - INTERVAL 2 HOUR),
        (2, 'Google Play $10 Gift Card', 'google_play', 10000, 10.00, 'valkyrie.rewards@gmail.com', 'approved', 'Validated and code dispatched', NOW() - INTERVAL 1 DAY),
        (4, 'USDT Tether $10 Crypto', 'crypto', 10000, 10.00, '0x71C...B29910dE3 (BEP20)', 'paid', 'TX Hash: 0x9320...9481', NOW() - INTERVAL 3 DAY)
      `);

      // Add sample fraud log
      await pool.query(`
        INSERT INTO fraud_logs (user_id, reason, details, severity, status)
        VALUES (5, 'Excessive unnatural ping rate', 'Sent 45 heartbeat pings in 10 seconds from automated script', 'high', 'actioned')
      `);

      console.log('👥 Sample users, transactions, redemptions, and fraud logs seeded.');
    }

    console.log('🌟 Database initialization complete.');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}

module.exports = { initDatabase };
