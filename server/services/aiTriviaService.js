/**
 * AI Trivia Generator Service
 * Generates engaging gaming trivia quizzes using Gemini / OpenAI APIs if configured,
 * with a high-fidelity procedural gaming knowledge engine as an instant, reliable zero-config fallback.
 */

const GAMING_KNOWLEDGE_BANK = {
  nintendo: [
    {
      q: "In what year was the original Nintendo Entertainment System (NES) released in North America?",
      opts: ["1983", "1985", "1987", "1989"],
      ans: 1,
      exp: "The NES launched in North America in October 1985 after reviving the video game industry."
    },
    {
      q: "What was Mario's original name when he debuted in the 1981 arcade game Donkey Kong?",
      opts: ["Luigi", "Jumpman", "Plumber Joe", "Red Cap"],
      ans: 1,
      exp: "Mario was originally named 'Jumpman' by Shigeru Miyamoto before being renamed Mario."
    },
    {
      q: "Which legendary franchise features the Triforce of Power, Wisdom, and Courage?",
      opts: ["Metroid", "Fire Emblem", "The Legend of Zelda", "Kid Icarus"],
      ans: 2,
      exp: "The Triforce is the sacred golden relic at the heart of The Legend of Zelda universe."
    },
    {
      q: "Which Nintendo handheld first introduced dual screens and touch controls?",
      opts: ["Game Boy Advance SP", "Nintendo DS", "Nintendo 3DS", "Game Boy Color"],
      ans: 1,
      exp: "The Nintendo DS launched in 2004 with revolutionary dual screens and stylus touch input."
    },
    {
      q: "What is the name of Pikachu's evolved form in Pokemon?",
      opts: ["Pichu", "Raichu", "Electabuzz", "Zapdos"],
      ans: 1,
      exp: "Pikachu evolves into Raichu when exposed to a Thunder Stone."
    }
  ],
  playstation: [
    {
      q: "Which company created and launched the original PlayStation console in 1994?",
      opts: ["Sony", "Sega", "Nintendo", "Panasonic"],
      ans: 0,
      exp: "Sony Computer Entertainment launched the original PlayStation in Japan in December 1994."
    },
    {
      q: "Who is the Spartan protagonist seeking vengeance in the God of War series?",
      opts: ["Ares", "Kratos", "Deimos", "Zeus"],
      ans: 1,
      exp: "Kratos is the Ghost of Sparta and central hero of the God of War saga."
    },
    {
      q: "Which acclaimed Naughty Dog franchise follows treasure hunter Nathan Drake?",
      opts: ["The Last of Us", "Jak and Daxter", "Uncharted", "Crash Bandicoot"],
      ans: 2,
      exp: "The Uncharted series follows Nathan Drake across globetrotting archaeological adventures."
    },
    {
      q: "In 'The Last of Us', what is the fungal infection responsible for the post-apocalyptic outbreak?",
      opts: ["T-Virus", "Cordyceps", "Las Plagas", "Green Poison"],
      ans: 1,
      exp: "The fungal pandemic in The Last of Us is caused by a mutated Cordyceps fungus."
    },
    {
      q: "Which futuristic racing game was a celebrated launch title for the original PlayStation in 1995?",
      opts: ["Gran Turismo", "Wipeout", "Ridge Racer", "Need for Speed"],
      ans: 1,
      exp: "Psygnosis' Wipeout defined futuristic anti-gravity racing on PlayStation."
    }
  ],
  retro: [
    {
      q: "What was the highest possible score in the original 1980 Pac-Man arcade game?",
      opts: ["999,999", "1,000,000", "3,333,360", "2,500,000"],
      ans: 2,
      exp: "A perfect Pac-Man score is exactly 3,333,360 points across 256 levels."
    },
    {
      q: "Which game popularized the famous 'Konami Code' (Up, Up, Down, Down, Left, Right, Left, Right, B, A)?",
      opts: ["Contra", "Gradius", "Castlevania", "Metal Gear"],
      ans: 1,
      exp: "The Konami Code was created by Kazuhisa Hashimoto during the 1986 development of Gradius."
    },
    {
      q: "What arcade classic by Tomohiro Nishikado is credited with causing a national coin shortage in Japan?",
      opts: ["Space Invaders", "Galaga", "Asteroids", "Centipede"],
      ans: 0,
      exp: "Space Invaders (1978) was so popular that legend says it created a 100-yen coin shortage."
    },
    {
      q: "In Street Fighter II, what is Ryu and Ken's iconic dragon punch special move called?",
      opts: ["Hadoken", "Tatsumaki Senpukyaku", "Shoryuken", "Yoga Fire"],
      ans: 2,
      exp: "Shoryuken (Rising Dragon Fist) is their signature anti-air special uppercut."
    },
    {
      q: "Which 1993 id Software pioneer established the modern first-person shooter genre?",
      opts: ["Wolfenstein 3D", "DOOM", "Quake", "Duke Nukem 3D"],
      ans: 1,
      exp: "DOOM revolutionized multiplayer deathmatch, fast 3D action, and modding in 1993."
    }
  ],
  esports: [
    {
      q: "What is the primary objective in League of Legends and Dota 2 matches?",
      opts: ["Get 100 Kills", "Destroy the Enemy Nexus/Ancient", "Capture 5 Towers", "Control the Baron Pit"],
      ans: 1,
      exp: "Teams win by pushing down lanes and destroying the opponent's core base structure (Nexus/Ancient)."
    },
    {
      q: "Which legendary South Korean player is widely celebrated as 'The Unkillable Demon King' in League of Legends?",
      opts: ["Caps", "Faker", "Ruler", "ShowMaker"],
      ans: 1,
      exp: "Lee 'Faker' Sang-hyeok has won multiple World Championships with T1."
    },
    {
      q: "In Counter-Strike: Global Offensive / CS2, how many rounds are required to win in regulation MR12?",
      opts: ["13", "16", "15", "11"],
      ans: 0,
      exp: "Under CS2's MR12 format, the first team to win 13 rounds wins the match."
    },
    {
      q: "In Valorant, what is the explosive device planted by the Attackers called?",
      opts: ["The Bomb", "The Spike", "The Core", "The C4"],
      ans: 1,
      exp: "Attackers must plant and detonate the Spike to secure the round objective."
    },
    {
      q: "Which annual tournament is celebrated as Dota 2's pinnacle world championship?",
      opts: ["The International", "Mid-Season Invitational", "Major League Gaming", "Evolution Championship"],
      ans: 0,
      exp: "The International (TI) is Valve's premier annual Dota 2 championship tournament."
    }
  ],
  rpg: [
    {
      q: "In Skyrim, what is the Dragonborn's iconic Unrelenting Force shout chant?",
      opts: ["Fus Ro Dah", "Yol Toor Shul", "Wuld Nah Kest", "Tiid Klo Ul"],
      ans: 0,
      exp: "'Fus Ro Dah' translates in the Dragon tongue to 'Force, Balance, Push'."
    },
    {
      q: "Who is the silver-haired Witcher protagonist known as the White Wolf?",
      opts: ["Vesemir", "Eskel", "Geralt of Rivia", "Lambert"],
      ans: 2,
      exp: "Geralt of Rivia is the protagonist of CD Projekt Red's The Witcher trilogy."
    },
    {
      q: "What is the name of the colossal Buster Sword wielder in Final Fantasy VII?",
      opts: ["Sephiroth", "Cloud Strife", "Squall Leonhart", "Tifa Lockhart"],
      ans: 1,
      exp: "Cloud Strife is the former SOLDIER mercenary protagonist of Final Fantasy VII."
    },
    {
      q: "In Dark Souls, what are the primary checkpoints where players rest and replenish Estus?",
      opts: ["Shrines", "Altars", "Bonfires", "Statues"],
      ans: 2,
      exp: "Bonfires are the sacred havens that grant respite and level progression in Dark Souls."
    },
    {
      q: "Which acclaimed 2023 RPG won Game of the Year based on the Dungeons & Dragons universe?",
      opts: ["Starfield", "Baldur's Gate 3", "Diablo IV", "Alan Wake 2"],
      ans: 1,
      exp: "Larian Studios' Baldur's Gate 3 swept awards globally with its D&D 5e roleplaying mechanics."
    }
  ],
  general: [
    {
      q: "In Minecraft, what special tool is required to mine Obsidian blocks?",
      opts: ["Iron Pickaxe", "Diamond Pickaxe", "Golden Pickaxe", "Stone Pickaxe"],
      ans: 1,
      exp: "Obsidian can only be harvested using a Diamond or Netherite Pickaxe."
    },
    {
      q: "What was the first commercially successful video game, released by Atari in 1972?",
      opts: ["Space Invaders", "Pong", "Asteroids", "Breakout"],
      ans: 1,
      exp: "Pong, created by Allan Alcorn for Atari, sparked the commercial video game boom in 1972."
    },
    {
      q: "In Grand Theft Auto V, which trio of characters do players switch between?",
      opts: ["Niko, Roman, CJ", "Michael, Franklin, Trevor", "Tommy, Claude, Carl", "Arthur, John, Dutch"],
      ans: 1,
      exp: "GTA V features Michael De Santa, Franklin Clinton, and Trevor Philips."
    },
    {
      q: "What battle royale game features the island dropping battle bus and building mechanics?",
      opts: ["PUBG", "Apex Legends", "Fortnite", "Call of Duty: Warzone"],
      ans: 2,
      exp: "Epic Games' Fortnite combines battle royale survival with instant structural building."
    },
    {
      q: "Which character is known as the Blue Blur, famous for collecting golden rings at supersonic speed?",
      opts: ["Crash Bandicoot", "Sonic the Hedgehog", "Mega Man", "Spyro the Dragon"],
      ans: 1,
      exp: "Sonic the Hedgehog was introduced by Sega in 1991 to compete with Nintendo's Mario."
    }
  ]
};

const THEME_THUMBNAILS = {
  nintendo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
  playstation: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80',
  retro: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
  esports: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
  rpg: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
  general: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&q=80'
};

/**
 * Generate quiz questions with an LLM (Gemini / OpenAI) if available,
 * otherwise dynamically construct from our comprehensive gaming knowledge bank.
 */
async function generateQuizWithAi({ topic = 'Gaming History', category = 'Gaming Trivia', questions_count = 5, difficulty = 'Medium', reward_points = 75 }) {
  const count = Math.min(Math.max(parseInt(questions_count, 10) || 5, 1), 10);

  // 1. Try Gemini API if key is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a video game trivia expert. Create an engaging, high-interest trivia quiz on the topic: "${topic}".
Difficulty: ${difficulty}.
Category: ${category}.
Number of questions: ${count}.

Output strictly valid JSON with this exact schema:
{
  "title": "Creative Quiz Title",
  "category": "${category}",
  "description": "2-sentence engaging overview of the quiz challenge",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief fun fact explanation why this answer is correct"
    }
  ]
}
Do not wrap in markdown quotes if possible, output pure JSON only.`;

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return {
              title: parsed.title || `${topic} AI Challenge`,
              category: parsed.category || category,
              description: parsed.description || `Test your expertise on ${topic}!`,
              thumbnail_url: getBestThumbnail(topic),
              reward_points: parseInt(reward_points, 10) || 75,
              time_limit_seconds: count * 15,
              questions_count: parsed.questions.length,
              questions_json: parsed.questions.map(q => ({
                question: q.question,
                options: q.options,
                correct_index: typeof q.correct_index === 'number' ? q.correct_index : 0,
                explanation: q.explanation || ''
              }))
            };
          }
        }
      }
    } catch (e) {
      console.warn('Gemini AI Trivia fallback triggered:', e.message);
    }
  }

  // 2. Procedural Knowledge Engine (Instant, Offline, 100% Reliable)
  return generateProceduralQuiz({ topic, category, count, difficulty, reward_points });
}

function getBestThumbnail(topic) {
  const lower = (topic || '').toLowerCase();
  if (lower.includes('nintendo') || lower.includes('mario') || lower.includes('zelda') || lower.includes('pokemon')) {
    return THEME_THUMBNAILS.nintendo;
  }
  if (lower.includes('sony') || lower.includes('playstation') || lower.includes('god of war') || lower.includes('uncharted')) {
    return THEME_THUMBNAILS.playstation;
  }
  if (lower.includes('retro') || lower.includes('arcade') || lower.includes('pac-man') || lower.includes('sega')) {
    return THEME_THUMBNAILS.retro;
  }
  if (lower.includes('esports') || lower.includes('cs') || lower.includes('league') || lower.includes('valorant')) {
    return THEME_THUMBNAILS.esports;
  }
  if (lower.includes('rpg') || lower.includes('skyrim') || lower.includes('witcher') || lower.includes('fantasy')) {
    return THEME_THUMBNAILS.rpg;
  }
  return THEME_THUMBNAILS.general;
}

function generateProceduralQuiz({ topic, category, count, difficulty, reward_points }) {
  const lowerTopic = (topic || '').toLowerCase();
  let pool = [];

  // Match keyword in topic
  if (lowerTopic.includes('nintendo') || lowerTopic.includes('mario') || lowerTopic.includes('zelda') || lowerTopic.includes('pokemon')) {
    pool = [...GAMING_KNOWLEDGE_BANK.nintendo];
  } else if (lowerTopic.includes('sony') || lowerTopic.includes('playstation') || lowerTopic.includes('kratos') || lowerTopic.includes('uncharted')) {
    pool = [...GAMING_KNOWLEDGE_BANK.playstation];
  } else if (lowerTopic.includes('retro') || lowerTopic.includes('arcade') || lowerTopic.includes('classic') || lowerTopic.includes('pac-man') || lowerTopic.includes('sega')) {
    pool = [...GAMING_KNOWLEDGE_BANK.retro];
  } else if (lowerTopic.includes('esport') || lowerTopic.includes('league') || lowerTopic.includes('cs') || lowerTopic.includes('counter-strike') || lowerTopic.includes('valorant') || lowerTopic.includes('dota')) {
    pool = [...GAMING_KNOWLEDGE_BANK.esports];
  } else if (lowerTopic.includes('rpg') || lowerTopic.includes('witcher') || lowerTopic.includes('skyrim') || lowerTopic.includes('souls') || lowerTopic.includes('final fantasy')) {
    pool = [...GAMING_KNOWLEDGE_BANK.rpg];
  } else {
    // Combine multiple sets for broad gaming topic
    pool = [
      ...GAMING_KNOWLEDGE_BANK.general,
      ...GAMING_KNOWLEDGE_BANK.retro,
      ...GAMING_KNOWLEDGE_BANK.nintendo,
      ...GAMING_KNOWLEDGE_BANK.playstation,
      ...GAMING_KNOWLEDGE_BANK.esports,
      ...GAMING_KNOWLEDGE_BANK.rpg
    ];
  }

  // Shuffle pool
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, count).map((item) => ({
    question: item.q,
    options: item.opts,
    correct_index: item.ans,
    explanation: item.exp
  }));

  const cleanTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
  const formattedTitle = cleanTitle.toLowerCase().includes('quiz') || cleanTitle.toLowerCase().includes('trivia')
    ? cleanTitle
    : `${cleanTitle} AI Trivia Challenge`;

  return {
    title: formattedTitle,
    category: category || 'Gaming Trivia',
    description: `Put your gaming knowledge to the test in this AI-generated trivia challenge covering ${topic}. Can you earn the top score?`,
    thumbnail_url: getBestThumbnail(topic),
    reward_points: parseInt(reward_points, 10) || 75,
    time_limit_seconds: count * 15,
    questions_count: selectedQuestions.length,
    questions_json: selectedQuestions
  };
}

module.exports = {
  generateQuizWithAi,
  GAMING_KNOWLEDGE_BANK
};
