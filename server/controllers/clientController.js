const crypto = require('crypto');
const { Game, GameSession, User, PointTransaction, FraudLog, Setting, Quiz, SurfTask, Survey } = require('../models');
const { sendNotification } = require('../services/notificationService');

// Get all games with filtering and search
async function getGames(req, res) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const where = { status: 'active' };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      const { Op } = require('sequelize');
      where.title = { [Op.like]: `%${search}%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: games } = await Game.findAndCountAll({
      where,
      order: [
        ['featured', 'DESC'],
        ['play_count', 'DESC']
      ],
      limit: parseInt(limit),
      offset
    });

    return res.json({
      success: true,
      games,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch games', error: err.message });
  }
}

// Get featured games
async function getFeaturedGames(req, res) {
  try {
    const games = await Game.findAll({
      where: { status: 'active', featured: true },
      order: [['play_count', 'DESC']],
      limit: 6
    });

    return res.json({ success: true, games });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch featured games', error: err.message });
  }
}

// Get game details
async function getGameById(req, res) {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game || game.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    return res.json({ success: true, game });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch game details', error: err.message });
  }
}

// Start Game Session
async function startSession(req, res) {
  try {
    const { game_id } = req.body;
    if (!game_id) {
      return res.status(400).json({ success: false, message: 'game_id required' });
    }

    const game = await Game.findByPk(game_id);
    if (!game || game.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Game not available' });
    }

    const user = await User.findByPk(req.user.userId);
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Account is banned' });
    }

    const sessionToken = 'gses_' + crypto.randomBytes(24).toString('hex');
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'App';

    const session = await GameSession.create({
      session_token: sessionToken,
      user_id: user.id,
      game_id: game.id,
      ip_address: ip,
      user_agent: userAgent
    });

    game.play_count += 1;
    await game.save();

    return res.json({
      success: true,
      session_token: sessionToken,
      session_id: sessionToken,
      ping_interval_seconds: 45,
      session: {
        session_id: sessionToken,
        session_token: sessionToken,
        ping_interval_seconds: 45
      },
      game: {
        id: game.id,
        title: game.title,
        embed_url: game.embed_url,
        reward_rate: game.reward_rate,
        min_play_seconds: game.min_play_seconds,
        orientation: game.orientation
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Session start failed', error: err.message });
  }
}

// Session Heartbeat Ping
async function pingSession(req, res) {
  try {
    const sessionToken = req.body.session_token || req.body.session_id;
    if (!sessionToken) return res.status(400).json({ success: false, message: 'session_token required' });

    const session = await GameSession.findOne({
      where: { session_token: sessionToken, user_id: req.user.userId, status: 'active' },
      include: [{ model: Game, as: 'game' }]
    });

    if (!session || !session.game) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const now = new Date();
    const lastPing = new Date(session.last_ping_time);
    const elapsedSeconds = Math.floor((now - lastPing) / 1000);

    // Anti-cheat verification
    if (elapsedSeconds < 15) {
      await FraudLog.create({
        user_id: req.user.userId,
        game_id: session.game_id,
        reason: 'Heartbeat pinged too rapidly',
        details: `Heartbeat received after only ${elapsedSeconds} seconds from IP ${req.ip}`,
        severity: 'medium'
      });

      sendNotification({
        title: 'Anti-Cheat Alert',
        message: `Rapid heartbeat ping (${elapsedSeconds}s) detected from user ID #${req.user.userId}.`,
        type: 'fraud'
      });
    }

    session.duration_seconds += elapsedSeconds;
    session.last_ping_time = now;

    // Calculate accrued reward based on duration
    const ratePerMinute = session.game.reward_rate || 1;
    const earned = Math.floor((session.duration_seconds / 60) * ratePerMinute);
    session.points_earned = earned;
    await session.save();

    return res.json({
      success: true,
      current_points_earned: earned,
      current_reward: earned,
      duration_seconds: session.duration_seconds,
      ping_interval_seconds: 45
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Ping failed', error: err.message });
  }
}

// Claim Session Reward & Close
async function claimSession(req, res) {
  try {
    const sessionToken = req.body.session_token || req.body.session_id;
    if (!sessionToken) return res.status(400).json({ success: false, message: 'session_token required' });

    const session = await GameSession.findOne({
      where: { session_token: sessionToken, user_id: req.user.userId, status: 'active' },
      include: [{ model: Game, as: 'game' }]
    });

    if (!session || !session.game) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const now = new Date();
    const lastPing = new Date(session.last_ping_time);
    const elapsed = Math.floor((now - lastPing) / 1000);
    session.duration_seconds += elapsed;

    const ratePerMinute = session.game.reward_rate || 1;
    const earned = Math.max(1, Math.floor((session.duration_seconds / 60) * ratePerMinute));

    session.points_earned = earned;
    session.status = 'completed';
    await session.save();

    const user = await User.findByPk(req.user.userId);
    user.points_balance += earned;
    user.total_earned += earned;
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'game_reward',
      amount: earned,
      balance_after: user.points_balance,
      description: `Played ${session.game.title} for ${Math.floor(session.duration_seconds / 60)}m`
    });

    return res.json({
      success: true,
      reward_earned: earned,
      points_earned: earned,
      new_balance: user.points_balance,
      duration_seconds: session.duration_seconds
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Claim failed', error: err.message });
  }
}

// 5. Quizzes / Trivia
async function getQuizzes(req, res) {
  try {
    const quizzes = await Quiz.findAll({ where: { status: 'active' } });
    return res.json({ success: true, quizzes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch quizzes', error: err.message });
  }
}

async function claimQuiz(req, res) {
  try {
    const { quiz_id, score, total, answers } = req.body;
    const quiz = await Quiz.findByPk(quiz_id);
    if (!quiz || quiz.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const questions = Array.isArray(quiz.questions_json)
      ? quiz.questions_json
      : (typeof quiz.questions_json === 'string' ? JSON.parse(quiz.questions_json) : []);

    let actualScore = Number(score) || 0;
    const actualTotal = Number(total) || questions.length || 1;

    if (!score && answers && typeof answers === 'object') {
      let correct = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] !== undefined && q.correct !== undefined && answers[idx] === q.correct) {
          correct += 1;
        } else if (answers[idx] !== undefined && q.answer !== undefined && answers[idx] === q.answer) {
          correct += 1;
        } else {
          correct += 1; // Default credit for completed answers
        }
      });
      actualScore = correct;
    }

    const pointsEarned = quiz.reward_points || 15;
    const user = await User.findByPk(req.user.userId);
    user.points_balance += pointsEarned;
    user.total_earned += pointsEarned;
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'bonus_reward',
      amount: pointsEarned,
      balance_after: user.points_balance,
      description: `Completed Quiz: ${quiz.title}`
    });

    return res.json({
      success: true,
      reward_earned: pointsEarned,
      points_earned: pointsEarned,
      score: actualScore,
      total: actualTotal,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim quiz reward', error: err.message });
  }
}

// 6. Surf / Visit Websites
async function getSurfTasks(req, res) {
  try {
    const tasks = await SurfTask.findAll({ where: { status: 'active' } });
    return res.json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch surf tasks', error: err.message });
  }
}

async function claimSurf(req, res) {
  try {
    const taskId = req.body.task_id || req.body.surf_task_id;
    const task = await SurfTask.findByPk(taskId);
    if (!task || task.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Surf task not found' });
    }

    const pointsEarned = task.reward_points || 10;
    const user = await User.findByPk(req.user.userId);
    user.points_balance += pointsEarned;
    user.total_earned += pointsEarned;
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'bonus_reward',
      amount: pointsEarned,
      balance_after: user.points_balance,
      description: `Completed Surf Task: ${task.title}`
    });

    return res.json({
      success: true,
      reward_earned: pointsEarned,
      points_earned: pointsEarned,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim surf reward', error: err.message });
  }
}

// 7. Surveys
async function getSurveys(req, res) {
  try {
    const surveys = await Survey.findAll({ where: { status: 'active' } });
    return res.json({ success: true, surveys });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch surveys', error: err.message });
  }
}

async function claimSurvey(req, res) {
  try {
    const { survey_id, answers } = req.body;
    const survey = await Survey.findByPk(survey_id);
    if (!survey || survey.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }

    const pointsEarned = survey.reward_points || 25;
    const user = await User.findByPk(req.user.userId);
    user.points_balance += pointsEarned;
    user.total_earned += pointsEarned;
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'bonus_reward',
      amount: pointsEarned,
      balance_after: user.points_balance,
      description: `Completed Survey: ${survey.title}`
    });

    return res.json({
      success: true,
      reward_earned: pointsEarned,
      points_earned: pointsEarned,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim survey reward', error: err.message });
  }
}

module.exports = {
  getGames,
  getFeaturedGames,
  getGameById,
  startSession,
  pingSession,
  claimSession,
  getQuizzes,
  claimQuiz,
  getSurfTasks,
  claimSurf,
  getSurveys,
  claimSurvey
};
