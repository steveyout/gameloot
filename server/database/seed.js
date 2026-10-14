const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const {
  sequelize,
  Admin,
  Category,
  Game,
  User,
  GameSession,
  RewardItem,
  RewardRedemption,
  PointTransaction,
  SystemSetting,
  FraudLog,
  Quiz,
  SurfTask,
  Survey,
  AdPlacement,
  Notification
} = require('../models');

async function seed() {
  console.log('🌱 [ORM Seed] Running database seeders with Google Play Compliance...');

  try {
    // 1. Admin Superadmin
    const adminEmail = 'admin@gameloot.com';
    const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        email: adminEmail,
        password_hash: passwordHash,
        role: 'superadmin',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150'
      });
      console.log('👑 Superadmin seeded: admin@gameloot.com / admin123');
    }

    // 1b. Default Player
    const playerEmail = 'player@gameloot.com';
    const existingPlayer = await User.findOne({ where: { email: playerEmail } });
    if (!existingPlayer) {
      const playerPass = await bcrypt.hash('player123', 10);
      await User.create({
        username: 'player',
        email: playerEmail,
        password_hash: playerPass,
        points_balance: 1000,
        tickets_balance: 10,
        total_earned: 1000,
        status: 'active'
      });
      console.log('🎮 Player account seeded: player / player123 (1,000 PTS)');
    }

    // 2. Categories
    const categoriesData = [
      { name: 'Arcade & Retro', slug: 'arcade', icon: 'Gamepad2', description: 'Fast-paced classic reflex arcade challenges', display_order: 1 },
      { name: 'Puzzle & Brain', slug: 'puzzle', icon: 'Brain', description: 'Test logic, puzzle solving, and memory skills', display_order: 2 },
      { name: 'Action & Adventure', slug: 'action', icon: 'Flame', description: 'Exciting combat, dodging, and adventure platforms', display_order: 3 },
      { name: 'Casual & Relaxing', slug: 'casual', icon: 'Coffee', description: 'Simple, addictive one-tap and relaxing sessions', display_order: 4 },
      { name: 'Sports & Racing', slug: 'sports', icon: 'Trophy', description: 'High speed drives, athletic skills, and sports fun', display_order: 5 }
    ];

    for (const cat of categoriesData) {
      await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat
      });
    }
    console.log('📁 Categories seeded.');

    // 3. Games (Load scraped games from html5games.com dataset)
    const arcCat = await Category.findOne({ where: { slug: 'arcade' } });
    const puzCat = await Category.findOne({ where: { slug: 'puzzle' } });
    const actCat = await Category.findOne({ where: { slug: 'action' } });
    const casCat = await Category.findOne({ where: { slug: 'casual' } });
    const sptCat = await Category.findOne({ where: { slug: 'sports' } });

    const categoryMap = {
      arcade: arcCat ? arcCat.id : 1,
      puzzle: puzCat ? puzCat.id : 2,
      action: actCat ? actCat.id : 3,
      casual: casCat ? casCat.id : 4,
      sports: sptCat ? sptCat.id : 5
    };

    let gamesToSeed = [];
    const scrapedPath = path.join(__dirname, 'scrapedGames.json');
    if (fs.existsSync(scrapedPath)) {
      try {
        const rawScraped = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
        if (Array.isArray(rawScraped) && rawScraped.length > 0) {
          gamesToSeed = rawScraped.map((g, idx) => ({
            title: g.title,
            slug: g.slug,
            category_id: categoryMap[g.category_slug] || arcCat.id,
            description: g.description || `Play ${g.title} instantly with zero downloads. Enjoy rapid reflex arcade action and earn bonus points.`,
            thumbnail_url: g.thumbnail_url,
            banner_url: g.banner_url || g.thumbnail_url,
            embed_url: g.embed_url,
            orientation: g.orientation || 'portrait',
            reward_rate: 1 + (idx % 2),
            max_daily_reward: 25 + (idx % 20),
            min_play_seconds: 30,
            featured: idx < 12,
            rating: parseFloat((4.6 + ((idx * 7) % 40) / 100).toFixed(1)),
            play_count: 500 + ((idx * 43) % 4800)
          }));
        }
      } catch (err) {
        console.warn('⚠️ Error reading scrapedGames.json:', err.message);
      }
    }

    // Fallback games if scraped JSON missing
    if (gamesToSeed.length === 0) {
      gamesToSeed = [
        {
          title: '2048 Cyber Edition',
          slug: '2048-cyber',
          category_id: puzCat ? puzCat.id : 1,
          description: 'Swipe and merge numbers to hit the legendary 2048 tile.',
          thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
          banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
          embed_url: 'https://play2048.co/',
          orientation: 'portrait',
          reward_rate: 1,
          max_daily_reward: 30,
          min_play_seconds: 45,
          featured: true,
          rating: 4.9,
          play_count: 1420
        }
      ];
    }

    console.log(`🎮 Seeding ${gamesToSeed.length} instant games with CDN thumbnails...`);
    for (const g of gamesToSeed) {
      await Game.upsert(g);
    }
    console.log(`✅ Synchronized ${gamesToSeed.length} games into database.`);

    // 4. Trivia Quizzes (8 Rich, Curated Gaming Trivia Question Sets)
    const seedQuizzes = [
      {
        title: 'Nintendo Masters & Franchise Legends',
        category: 'Nintendo',
        description: 'Test your knowledge on the greatest Nintendo characters, consoles, secrets, and iconic gaming milestones.',
        thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
        reward_points: 50,
        time_limit_seconds: 60,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'What was Mario originally known as during his debut appearance in Donkey Kong (1981)?',
            options: ['Jumpman', 'Plumber Boy', 'Luigi', 'Mr. Video'],
            correct_index: 0,
            explanation: 'Mario was originally named Jumpman before Nintendo of America renamed him after their landlord Mario Segale.'
          },
          {
            question: 'In The Legend of Zelda: Ocarina of Time, what is the musical instrument Link plays to alter time?',
            options: ['Harp of Ages', 'Ocarina of Time', 'Wind Waker', 'Goddess Lyre'],
            correct_index: 1,
            explanation: 'The blue Ocarina of Time is given to Link by Princess Zelda as she flees Hyrule Castle.'
          },
          {
            question: 'What is the full canonical name of Bowser in Japanese Nintendo lore?',
            options: ['King Koopa (Daimaō Kuppa)', 'Lord Ganon', 'Wart', 'Bowser the Terrible'],
            correct_index: 0,
            explanation: 'In Japan, Bowser is known as Daimaō Kuppa (Great Demon King Koopa).'
          },
          {
            question: 'Which of the following Pokémon is the official mascot for the franchise?',
            options: ['Charizard', 'Pikachu', 'Mewtwo', 'Eevee'],
            correct_index: 1,
            explanation: 'Pikachu became the franchise mascot largely thanks to the worldwide phenomenon of the animated television series.'
          }
        ]
      },
      {
        title: 'PlayStation Platinum & Exclusive Lore',
        category: 'PlayStation',
        description: 'Prove your PlayStation expertise across God of War, Uncharted, The Last of Us, and legendary trophy hunts.',
        thumbnail_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&q=80',
        reward_points: 55,
        time_limit_seconds: 60,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'In the Norse era God of War (2018), what is the name of Kratos\'s son?',
            options: ['Deimos', 'Atreus (Loki)', 'Baldur', 'Mimir'],
            correct_index: 1,
            explanation: 'Kratos trains his son Atreus, who is revealed at Jotunheim to also be named Loki by the Giants.'
          },
          {
            question: 'In The Last of Us, what real-world mutated fungus causes the apocalyptic Cordyceps brain infection?',
            options: ['Ophiocordyceps unilateralis', 'Amanita muscaria', 'Penicillium chrysogenum', 'Claviceps purpurea'],
            correct_index: 0,
            explanation: 'Naughty Dog based the infected on Ophiocordyceps unilateralis, an insect-parasitizing fungus.'
          },
          {
            question: 'What is the name of Nathan Drake\'s beloved mentor and longtime treasure hunting partner?',
            options: ['Victor "Sully" Sullivan', 'Sam Drake', 'Rafe Adler', 'Elena Fisher'],
            correct_index: 0,
            explanation: 'Victor "Sully" Sullivan has been Nathan Drake\'s loyal father-figure and wingman since Drake was a teenager.'
          },
          {
            question: 'Which renowned FromSoftware masterpiece was released in 2015 exclusively for PlayStation 4?',
            options: ['Bloodborne', 'Demon\'s Souls', 'Dark Souls III', 'Sekiro: Shadows Die Twice'],
            correct_index: 0,
            explanation: 'Bloodborne took players into the gothic, Lovecraftian city of Yharnam as an acclaimed PS4 exclusive.'
          }
        ]
      },
      {
        title: 'Golden Age 80s & 90s Arcades',
        category: 'Arcade & Retro',
        description: 'Relive the high-score coin-op era from Pac-Man and Space Invaders to Street Fighter and Mortal Kombat.',
        thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
        reward_points: 45,
        time_limit_seconds: 50,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'In original Pac-Man (1980), what color is the ghost named "Blinky"?',
            options: ['Red', 'Pink', 'Cyan', 'Orange'],
            correct_index: 0,
            explanation: 'Blinky is the relentless red ghost that chases directly behind Pac-Man as speed increases.'
          },
          {
            question: 'Which legendary 1991 fighting game pioneered the standard six-button arcade control layout?',
            options: ['Street Fighter II', 'Mortal Kombat', 'Tekken', 'Fatal Fury'],
            correct_index: 0,
            explanation: 'Capcom\'s Street Fighter II defined competitive arcade combat with light/medium/heavy punch & kick buttons.'
          },
          {
            question: 'What is the highest possible perfect score in classic arcade Pac-Man?',
            options: ['3,333,360 points', '1,000,000 points', '999,990 points', '2,500,000 points'],
            correct_index: 0,
            explanation: 'A perfect game of Pac-Man across 256 levels yields exactly 3,333,360 points without losing a single life.'
          },
          {
            question: 'What 1978 arcade phenomenon caused a legendary national shortage of 100-yen coins across Japan?',
            options: ['Space Invaders', 'Galaxian', 'Asteroids', 'Pong'],
            correct_index: 0,
            explanation: 'Tomohiro Nishikado\'s Space Invaders was so popular that the Bank of Japan had to triple 100-yen coin minting.'
          }
        ]
      },
      {
        title: 'Esports Titans & Tactical FPS Arena',
        category: 'Esports',
        description: 'Prove your tactical mastery across Counter-Strike 2, Valorant, League of Legends, and major esports finals.',
        thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
        reward_points: 60,
        time_limit_seconds: 60,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'In Counter-Strike 2, how long does it take to defuse the C4 explosive WITH a Defuse Kit equipped?',
            options: ['5 seconds', '10 seconds', '7.5 seconds', '3 seconds'],
            correct_index: 0,
            explanation: 'A defusal takes 10 seconds without a kit, and is halved to exactly 5 seconds with a kit equipped.'
          },
          {
            question: 'In League of Legends, what prestigious championship trophy is awarded to the World Champions?',
            options: ['Summoner\'s Cup', 'Aegis of Champions', 'The Stanley Cup', 'Valorant Champions Ring'],
            correct_index: 0,
            explanation: 'The Summoner\'s Cup weighs 70 pounds and is the premier championship trophy in League of Legends esports.'
          },
          {
            question: 'In Valorant, how many total points must a team reach to win in regulation (excluding overtime)?',
            options: ['13 rounds', '16 rounds', '12 rounds', '15 rounds'],
            correct_index: 0,
            explanation: 'A standard Valorant competitive match is won by the first team to win 13 rounds.'
          },
          {
            question: 'In Dota 2, what is the annual premier world tournament featuring massive crowdfunding prize pools?',
            options: ['The International (TI)', 'Major League Gaming', 'Evolution Championship Series', 'DreamHack Masters'],
            correct_index: 0,
            explanation: 'Valve\'s The International is famous for awarding the Aegis of Champions and historic multimillion-dollar purses.'
          }
        ]
      },
      {
        title: 'Elden Ring & Soulsborne Lore',
        category: 'RPG & Open Worlds',
        description: 'Traverse the Lands Between and Lordran. Test your recollection of demigods, runes, and boss battles.',
        thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
        reward_points: 70,
        time_limit_seconds: 70,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'In Elden Ring, what is Malenia\'s infamous signature multi-slashing aerial attack named?',
            options: ['Waterfowl Dance', 'Scarlet Bloom', 'Blade of Miquella', 'Moonlight Slash'],
            correct_index: 0,
            explanation: 'Waterfowl Dance is one of the most punishing moves in gaming, featuring three rapid-slashing forward dashes.'
          },
          {
            question: 'What spectral steed does Melina gift to the Tarnished in Elden Ring?',
            options: ['Torrent', 'Shadowmere', 'Epona', 'Roach'],
            correct_index: 0,
            explanation: 'Torrent is summoned using the Spectral Steed Whistle and allows high-speed double jumping across the map.'
          },
          {
            question: 'In Dark Souls, what is the name of the majestic Great Grey Wolf who wields his master\'s greatsword?',
            options: ['Sif', 'Artorias', 'Manus', 'Alvina'],
            correct_index: 0,
            explanation: 'Great Grey Wolf Sif guards the grave of Knight Artorias in the Darkroot Garden wielding a massive greatsword.'
          },
          {
            question: 'What is the currency / experience points used to level up and purchase equipment in Souls games?',
            options: ['Souls (or Runes in Elden Ring)', 'Gold Coins', 'V-Bucks', 'Gil'],
            correct_index: 0,
            explanation: 'Souls (and Runes in Elden Ring) serve as both currency and experience, dropped on death if unrecovered.'
          }
        ]
      },
      {
        title: 'Minecraft & Sandbox Architects',
        category: 'Indie & Sandbox',
        description: 'Explore the infinite voxel world: Redstone circuitry, Nether fortresses, Creepers, and Ender Dragon triumphs.',
        thumbnail_url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=600&q=80',
        reward_points: 40,
        time_limit_seconds: 50,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'What coding accident originally led to the creation of the iconic Minecraft Creeper?',
            options: ['A flawed pig model with swapped height and length', 'A glitched skeleton texture', 'A corrupted zombie script', 'A spider hitbox error'],
            correct_index: 0,
            explanation: 'Notch accidentally swapped the height and length variables while attempting to model a pig, creating the Creeper.'
          },
          {
            question: 'What rare mineral was introduced in the 1.16 Nether Update that exceeds Diamond in durability?',
            options: ['Netherite', 'Obsidian', 'Amethyst', 'Bedrock'],
            correct_index: 0,
            explanation: 'Netherite gear is crafted by combining Diamond equipment with a Netherite Ingot at a Smithing Table.'
          },
          {
            question: 'What hostile flying mob attacks players in the Overworld if they do not sleep for three consecutive days?',
            options: ['Phantom', 'Ghast', 'Vex', 'Blaze'],
            correct_index: 0,
            explanation: 'Phantoms were chosen by community vote at MineCon Earth 2017 to punish insomnia.'
          },
          {
            question: 'What is the dimension where the final Ender Dragon battle takes place?',
            options: ['The End', 'The Nether', 'The Aether', 'The Void'],
            correct_index: 0,
            explanation: 'Players reach The End through an activated Stronghold End Portal using Eyes of Ender.'
          }
        ]
      },
      {
        title: 'Grand Theft Auto & Open World Crime',
        category: 'Action & Adventure',
        description: 'Take a trip through Los Santos, Liberty City, and Vice City across Rockstar Games history.',
        thumbnail_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80',
        reward_points: 55,
        time_limit_seconds: 60,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'Who are the three playable protagonists in Grand Theft Auto V?',
            options: ['Michael, Trevor, and Franklin', 'Niko, Roman, and Little Jacob', 'CJ, Sweet, and Big Smoke', 'Tommy Vercetti, Claude, and Toni'],
            correct_index: 0,
            explanation: 'GTA V broke new ground by allowing real-time switching between Michael De Santa, Trevor Philips, and Franklin Clinton.'
          },
          {
            question: 'In GTA San Andreas, what is CJ\'s signature home neighborhood in Los Santos?',
            options: ['Grove Street', 'Ocean Beach', 'Algonquin', 'Idlewood'],
            correct_index: 0,
            explanation: 'Carl "CJ" Johnson returns to Grove Street in the Ganton area of Los Santos after his mother\'s passing.'
          },
          {
            question: 'What iconic 1980s neon paradise was Tommy Vercetti sent to in GTA Vice City?',
            options: ['Vice City (inspired by Miami)', 'Liberty City', 'San Fierro', 'Las Venturas'],
            correct_index: 0,
            explanation: 'Vice City captures 1986 pastel aesthetics, powerboats, and synthwave radio stations inspired by Miami Vice.'
          },
          {
            question: 'What is the fictional law enforcement agency equivalent to the real-world FBI in the GTA universe?',
            options: ['FIB', 'IAA', 'NOOSE', 'LSPD'],
            correct_index: 0,
            explanation: 'The Federal Investigation Bureau (FIB) is Rockstar\'s satire of the real FBI.'
          }
        ]
      },
      {
        title: 'Gaming Records & Speedrun Lore',
        category: 'Gaming Lore',
        description: 'Celebrating impossible glitches, 120-star milestones, Games Done Quick, and world records.',
        thumbnail_url: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&q=80',
        reward_points: 65,
        time_limit_seconds: 60,
        questions_count: 4,
        is_active: true,
        questions_json: [
          {
            question: 'In Super Mario 64 speedrunning, what famous glitch allows Mario to build negative speed and warp through doors?',
            options: ['BLJ (Backwards Long Jump)', 'Wall Kick Clip', 'Triple Jump Stall', 'Shell Slide Warping'],
            correct_index: 0,
            explanation: 'By repeatedly long jumping backwards on stairs, the speed cap check is bypassed, accumulating infinite speed.'
          },
          {
            question: 'What is the world\'s largest semiannual speedrunning charity marathon event called?',
            options: ['Games Done Quick (GDQ)', 'SpeedGaming Summit', 'The Speedrun Invitational', 'Pixel Marathon'],
            correct_index: 0,
            explanation: 'Awesome Games Done Quick (AGDQ) and Summer Games Done Quick (SGDQ) raise millions for charity each year.'
          },
          {
            question: 'What category describes completing a game as quickly as possible without using any glitches or major sequence breaks?',
            options: ['Glitchless', 'Any%', '100%', 'Low%'],
            correct_index: 0,
            explanation: 'Glitchless categories require following intended developer pathways while maximizing mechanical movement execution.'
          },
          {
            question: 'In the original 1985 Super Mario Bros., what is the fastest possible theoretical speedrun barrier known as?',
            options: ['Sub-4:55', 'Sub-10:00', 'Sub-3:00', 'Sub-15:00'],
            correct_index: 0,
            explanation: 'Human speedrunners have pushed Super Mario Bros. any% under the sub-4 minute 55-second milestone with frame-perfect inputs.'
          }
        ]
      }
    ];

    console.log('🧠 Seeding rich gaming trivia quizzes...');
    for (const q of seedQuizzes) {
      await Quiz.findOrCreate({
        where: { title: q.title },
        defaults: q
      });
    }
    console.log(`✅ Synchronized ${seedQuizzes.length} trivia quizzes in database.`);

    // 5. Reward Items (Google Play Sustainable: 1,000 PTS = $1.00 USD)
    const rewardItemsData = [
      { title: 'PayPal $1.00 Micro Cashout', type: 'paypal', cost_points: 1000, cash_value_usd: 1.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png', description: 'Fast entry-level payout to PayPal balance', stock: 500, is_active: true },
      { title: 'PayPal $5.00 Payout', type: 'paypal', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png', description: 'Cash direct to verified PayPal email', stock: 200, is_active: true },
      { title: 'Google Play $5 Gift Card', type: 'google_play', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/888/888857.png', description: 'Digital redemption code for Android Play Store', stock: 100, is_active: true },
      { title: 'Steam Wallet $5 Code', type: 'steam', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/220/220223.png', description: 'Steam wallet digital code voucher', stock: 80, is_active: true },
      { title: 'USDT $5 Crypto Payout', type: 'crypto', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/7047/7047059.png', description: 'Sent to your BEP20 or Polygon address', stock: 150, is_active: true },
      { title: 'Amazon $10 Gift Card', type: 'amazon', cost_points: 10000, cash_value_usd: 10.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/5968/5968204.png', description: 'Shop anything on Amazon store', stock: 50, is_active: true }
    ];

    for (const r of rewardItemsData) {
      await RewardItem.findOrCreate({
        where: { title: r.title },
        defaults: r
      });
    }
    console.log('🎁 Reward items synchronized.');

    // 5b. Web Surf Tasks (Optional extra earning activities)
    const seedSurfTasks = [
      {
        title: 'IGN Gaming News & Reviews',
        website_url: 'https://www.ign.com',
        description: 'Read the latest gaming reviews, trailers, and industry news for 30 seconds.',
        thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80',
        reward_points: 20,
        duration_seconds: 30,
        daily_limit: 5,
        is_active: true
      },
      {
        title: 'PC Gamer Hardware & Tech Guides',
        website_url: 'https://www.pcgamer.com',
        description: 'Browse top PC build tips, benchmark tests, and GPU reviews.',
        thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80',
        reward_points: 25,
        duration_seconds: 40,
        daily_limit: 5,
        is_active: true
      }
    ];

    for (const st of seedSurfTasks) {
      await SurfTask.findOrCreate({
        where: { title: st.title },
        defaults: st
      });
    }
    console.log('🌐 Web surf tasks initialized.');

    // 6. System Settings (Google Play Compliant Anti-Deception & Sustainability)
    const defaultSettings = [
      { setting_key: 'points_per_usd', setting_value: '1000', setting_label: 'Points per $1.00 USD', setting_type: 'number', description: 'Base exchange rate (1,000 points = $1.00 USD; 1 point = $0.001)' },
      { setting_key: 'min_payout_points', setting_value: '1000', setting_label: 'Minimum Cashout Threshold', setting_type: 'number', description: 'Low $1.00 threshold so users trust the app without excessive unachievable barriers' },
      { setting_key: 'daily_max_points_global', setting_value: '120', setting_label: 'Global Daily Points Cap', setting_type: 'number', description: 'Limits max payout liability per user to $0.12/day, well covered by ad impressions' },
      { setting_key: 'ping_interval_seconds', setting_value: '45', setting_label: 'Heartbeat Ping Interval (sec)', setting_type: 'number', description: 'Time interval required for valid proof-of-play ping' },
      { setting_key: 'ad_video_reward_pts', setting_value: '3', setting_label: 'Rewarded Ad Video Reward', setting_type: 'number', description: 'Points earned per watched rewarded video ($0.003 payout vs $0.015+ ad eCPM)' },
      { setting_key: 'ad_reward_cooldown_sec', setting_value: '90', setting_label: 'Ad Cooldown Time (sec)', setting_type: 'number', description: 'Google Play ad spam policy compliance - minimum spacing between ad prompts' },
      { setting_key: 'maintenance_mode', setting_value: 'false', setting_label: 'Maintenance Mode', setting_type: 'boolean', description: 'Temporarily disable earnings and cashouts' },
      { setting_key: 'payouts_enabled', setting_value: 'true', setting_label: 'Enable Payouts & Cashouts Tab', setting_type: 'boolean', description: 'When disabled, hides payout options in the app and disables the Cashout/Rewards tab' },
      { setting_key: 'google_play_disclaimer', setting_value: 'true', setting_label: 'Google Play Policy Disclaimer', setting_type: 'boolean', description: 'Disclose that points are loyalty rewards funded by sponsors, not real money gambling' },
      { setting_key: 'app_latest_version', setting_value: '1.1.0', setting_label: 'App Latest Version', setting_type: 'string', description: 'Latest public release version string (SemVer)' },
      { setting_key: 'app_min_version', setting_value: '1.0.0', setting_label: 'App Minimum Required Version', setting_type: 'string', description: 'Minimum version required. Any version below this is blocked from continuing' },
      { setting_key: 'app_version_code', setting_value: '11', setting_label: 'App Version Code (Android)', setting_type: 'number', description: 'Latest Android versionCode integer from build gradle' },
      { setting_key: 'app_force_update', setting_value: 'true', setting_label: 'Force App Update', setting_type: 'boolean', description: 'When enabled, lock users on older versions with a non-dismissible update modal' },
      { setting_key: 'app_update_url', setting_value: 'https://play.google.com/store/apps/details?id=com.gameloot.app', setting_label: 'Google Play Store URL', setting_type: 'string', description: 'Link opened when user taps Update on Google Play' },
      { setting_key: 'app_download_apk_url', setting_value: 'https://gameloot.app/releases/GameLoot-v1.1.0.apk', setting_label: 'Direct APK Download URL', setting_type: 'string', description: 'Fallback direct APK link for sideloading or non-GMS devices' },
      { setting_key: 'app_release_notes', setting_value: '• High-speed instant game rendering optimizations\n• Daily loot chest 2x reward boost\n• Instant wallet payouts & enhanced security\n• Google Play compliance & anti-cheat engine update', setting_label: "Release Notes (What's New)", setting_type: 'textarea', description: 'Displayed in update modal explaining changes to users' }
    ];

    for (const s of defaultSettings) {
      await SystemSetting.findOrCreate({
        where: { setting_key: s.setting_key },
        defaults: s
      });
    }
    console.log('⚙️ System settings updated for ad-revenue sustainability.');

    // 7. AdMob / Ad Placements
    const adPlacements = [
      {
        placement_key: 'rewarded_session_boost',
        name: 'Game Session 2x Points Multiplier',
        ad_type: 'rewarded_video',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/5224354917',
        cooldown_seconds: 90,
        daily_cap: 15,
        reward_points: 3,
        est_ecpm_usd: 16.50
      },
      {
        placement_key: 'interstitial_game_exit',
        name: 'Game Return to Lobby Interstitial',
        ad_type: 'interstitial',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/1033173712',
        cooldown_seconds: 120,
        daily_cap: 10,
        reward_points: 0,
        est_ecpm_usd: 8.00
      },
      {
        placement_key: 'rewarded_daily_chest',
        name: 'Daily Free Loot Chest',
        ad_type: 'rewarded_video',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/5224354917',
        cooldown_seconds: 300,
        daily_cap: 5,
        reward_points: 5,
        est_ecpm_usd: 18.00
      },
      {
        placement_key: 'banner_bottom_home',
        name: 'Sticky Bottom Banner',
        ad_type: 'banner',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/6300978111',
        cooldown_seconds: 30,
        daily_cap: 200,
        reward_points: 0,
        est_ecpm_usd: 1.20
      }
    ];

    for (const ad of adPlacements) {
      await AdPlacement.findOrCreate({
        where: { placement_key: ad.placement_key },
        defaults: ad
      });
    }
    console.log('📺 Google AdMob placements synchronized.');

    // 8. Sample Initial Broadcast Notifications
    const sampleNotifications = [
      {
        title: '🎉 Welcome to GameLoot! Claim Starter Gift',
        message: 'Welcome to the ultimate play-to-earn gaming arcade! Tap below to claim your complimentary +50 PTS welcome gift.',
        type: 'bonus',
        bonus_points: 50,
        action_screen: 'wallet',
        target_audience: 'all',
        sender_admin: 'GameLoot Staff'
      },
      {
        title: '⚡ Weekend 2X Point Multiplier Active!',
        message: 'All play sessions across popular arcade hits will yield 2x points this weekend. Hop into the arcade now!',
        type: 'announcement',
        bonus_points: 0,
        action_screen: 'lobby',
        target_audience: 'all',
        sender_admin: 'GameLoot Staff'
      },
      {
        title: '💎 Daily Streak & Lucky Wheel Unlocked!',
        message: 'Check in every day to collect free points and spin the Lucky Wheel for up to 500 PTS jackpot rewards!',
        type: 'reward',
        bonus_points: 25,
        action_screen: 'earn',
        target_audience: 'all',
        sender_admin: 'GameLoot Staff'
      }
    ];

    for (const n of sampleNotifications) {
      await Notification.findOrCreate({
        where: { title: n.title },
        defaults: n
      });
    }
    console.log('🔔 Sample notifications initialized.');

    console.log('✨ [ORM Seed] Seeding completed successfully with Google Play Compliance.');
  } catch (error) {
    console.error('❌ [ORM Seed] Failed to seed database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  });
}

module.exports = seed;
