const crypto = require('crypto');
const {
  Game,
  Category,
  RewardItem,
  User,
  GameSession,
  PointTransaction,
  RewardRedemption,
  FraudLog,
  Quiz,
  SurfTask,
  Survey,
  SystemSetting
} = require('../models');
const { sendNotification } = require('../services/socket');

// Discovery
async function getCategories(req, res) {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC']]
    });
    return res.json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load categories', error: err.message });
  }
}

async function getGames(req, res) {
  try {
    const { category, search, featured } = req.query;
    const where = { is_active: true };

    if (category) where.category_id = category;
    if (featured === 'true' || featured === '1') where.featured = true;
    if (search) {
      where[require('sequelize').Op.or] = [
        { title: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    const games = await Game.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['name', 'slug'] }],
      order: [['featured', 'DESC'], ['play_count', 'DESC']]
    });

    return res.json({
      success: true,
      games: games.map(g => ({
        ...g.toJSON(),
        category_name: g.category?.name || 'Arcade'
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load games', error: err.message });
  }
}

async function getRewards(req, res) {
  try {
    const rewards = await RewardItem.findAll({
      where: { is_active: true },
      order: [['cost_points', 'ASC']]
    });
    return res.json({ success: true, rewards });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load rewards', error: err.message });
  }
}

// Mobile Discovery for Quizzes, Surf, Surveys
async function getQuizzes(req, res) {
  try {
    const quizzes = await Quiz.findAll({ where: { is_active: true }, order: [['reward_points', 'DESC']] });
    return res.json({ success: true, quizzes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load quizzes', error: err.message });
  }
}

async function getSurfTasks(req, res) {
  try {
    const tasks = await SurfTask.findAll({ where: { is_active: true }, order: [['reward_points', 'DESC']] });
    return res.json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load surf tasks', error: err.message });
  }
}

async function getSurveys(req, res) {
  try {
    const surveys = await Survey.findAll({ where: { is_active: true }, order: [['reward_points', 'DESC']] });
    return res.json({ success: true, surveys });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load surveys', error: err.message });
  }
}

// Claim Quiz completion reward
async function claimQuiz(req, res) {
  try {
    const { quiz_id, answers, score, total } = req.body;
    const quiz = await Quiz.findByPk(quiz_id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const user = await User.findByPk(req.user.userId);
    let finalScore = 0;
    let finalTotal = 1;

    if (score !== undefined && total !== undefined) {
      finalScore = parseInt(score, 10) || 0;
      finalTotal = Math.max(1, parseInt(total, 10) || 1);
    } else if (answers && typeof answers === 'object') {
      const questions = Array.isArray(quiz.questions_json)
        ? quiz.questions_json
        : (typeof quiz.questions_json === 'string' ? JSON.parse(quiz.questions_json) : []);
      finalTotal = Math.max(1, questions.length);
      questions.forEach((q, idx) => {
        const correctIdx = q.correct_option !== undefined ? q.correct_option : 0;
        if (answers[idx] !== undefined && parseInt(answers[idx], 10) === correctIdx) {
          finalScore++;
        }
      });
    }

    const pointsAwarded = Math.max(1, Math.round((finalScore / finalTotal) * (quiz.reward_points || 15)));

    if (pointsAwarded > 0) {
      user.points_balance += pointsAwarded;
      user.total_earned += pointsAwarded;
      await user.save();

      await PointTransaction.create({
        user_id: user.id,
        type: 'game_reward',
        amount: pointsAwarded,
        balance_after: user.points_balance,
        description: `Quiz Trivia Reward: ${quiz.title} (${finalScore}/${finalTotal} correct)`
      });

      quiz.completion_count += 1;
      await quiz.save();
    }

    return res.json({
      success: true,
      points_earned: pointsAwarded,
      reward_earned: pointsAwarded,
      score: finalScore,
      total: finalTotal,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim quiz', error: err.message });
  }
}

// Claim Surf task completion reward
async function claimSurf(req, res) {
  try {
    const taskId = req.body.surf_task_id || req.body.task_id;
    if (!taskId) return res.status(400).json({ success: false, message: 'Task ID required' });

    const task = await SurfTask.findByPk(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Surf task not found' });

    const user = await User.findByPk(req.user.userId);
    user.points_balance += task.reward_points;
    user.total_earned += task.reward_points;
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'game_reward',
      amount: task.reward_points,
      balance_after: user.points_balance,
      description: `Web Surf Reward: ${task.title}`
    });

    task.surf_count += 1;
    await task.save();

    return res.json({
      success: true,
      points_earned: task.reward_points,
      reward_earned: task.reward_points,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim surf task', error: err.message });
  }
}

// Claim Survey completion reward
async function claimSurvey(req, res) {
  try {
    const { survey_id, answers } = req.body;
    const survey = await Survey.findByPk(survey_id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });

    const user = await User.findByPk(req.user.userId);
    user.points_balance += survey.reward_points;
    user.total_earned += survey.reward_points;
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'game_reward',
      amount: survey.reward_points,
      balance_after: user.points_balance,
      description: `Survey Completion: ${survey.title}`
    });

    survey.response_count += 1;
    await survey.save();

    return res.json({
      success: true,
      points_earned: survey.reward_points,
      reward_earned: survey.reward_points,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim survey', error: err.message });
  }
}

// Session Start
async function startSession(req, res) {
  try {
    const { game_id } = req.body;
    if (!game_id) return res.status(400).json({ success: false, message: 'game_id required' });

    const game = await Game.findOne({ where: { id: game_id, is_active: true } });
    if (!game) return res.status(404).json({ success: false, message: 'Game unavailable' });

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

    const totalSeconds = session.duration_seconds + elapsedSeconds;
    const earnedPoints = Math.floor((totalSeconds / 60) * session.game.reward_rate);
    const cappedPoints = Math.min(earnedPoints, session.game.max_daily_reward);

    session.duration_seconds = totalSeconds;
    session.points_earned = cappedPoints;
    session.last_ping_time = now;
    await session.save();

    return res.json({
      success: true,
      duration_seconds: totalSeconds,
      current_points_earned: cappedPoints,
      current_reward: cappedPoints
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Ping failed', error: err.message });
  }
}

// Session Claim Reward
async function claimSession(req, res) {
  try {
    const sessionToken = req.body.session_token || req.body.session_id;
    if (!sessionToken) return res.status(400).json({ success: false, message: 'session_token required' });

    const session = await GameSession.findOne({
      where: { session_token: sessionToken, user_id: req.user.userId, status: 'active' },
      include: [{ model: Game, as: 'game' }]
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found or already claimed' });
    }

    const pointsToCredit = session.points_earned;
    session.status = 'completed';
    session.end_time = new Date();
    await session.save();

    if (pointsToCredit > 0) {
      const user = await User.findByPk(req.user.userId);
      user.points_balance += pointsToCredit;
      user.total_earned += pointsToCredit;
      await user.save();

      await PointTransaction.create({
        user_id: user.id,
        type: 'game_reward',
        amount: pointsToCredit,
        balance_after: user.points_balance,
        description: `Earned from playing ${session.game?.title || 'Game'}`,
        reference_id: `SES-${session.id}`
      });

      return res.json({
        success: true,
        message: `Claimed +${pointsToCredit} points!`,
        points_earned: pointsToCredit,
        reward_earned: pointsToCredit,
        new_balance: user.points_balance
      });
    }

    return res.json({
      success: true,
      message: 'Session closed (play time below point threshold)',
      points_earned: 0,
      reward_earned: 0
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Claim failed', error: err.message });
  }
}

// User Redeem Rewards (Cashout request)
async function redeemReward(req, res) {
  try {
    const { reward_item_id, payout_details } = req.body;
    if (!reward_item_id || !payout_details) {
      return res.status(400).json({ success: false, message: 'reward_item_id and payout_details required' });
    }

    const reward = await RewardItem.findOne({ where: { id: reward_item_id, is_active: true } });
    if (!reward) return res.status(404).json({ success: false, message: 'Reward item unavailable' });

    const user = await User.findByPk(req.user.userId);
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account suspended from cashouts' });
    }

    if (user.points_balance < reward.cost_points) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${reward.cost_points.toLocaleString()} PTS but have ${user.points_balance.toLocaleString()} PTS.`
      });
    }

    // Deduct points
    const newBalance = user.points_balance - reward.cost_points;
    user.points_balance = newBalance;
    await user.save();

    // Ledger
    await PointTransaction.create({
      user_id: user.id,
      type: 'redemption',
      amount: -reward.cost_points,
      balance_after: newBalance,
      description: `Redeemed for ${reward.title}`
    });

    // Request
    const redemption = await RewardRedemption.create({
      user_id: user.id,
      reward_item_id: reward.id,
      reward_title: reward.title,
      reward_type: reward.type,
      points_spent: reward.cost_points,
      cash_value_usd: reward.cash_value_usd,
      payout_details: payout_details.trim(),
      status: 'pending'
    });

    // Instant Notification to Admin Panel!
    sendNotification({
      title: 'New Cashout Request!',
      message: `${user.username} requested $${Number(reward.cash_value_usd).toFixed(2)} (${reward.title}) to ${payout_details.trim()}`,
      type: 'cashout',
      meta: { redemption_id: redemption.id, user_id: user.id }
    });

    return res.status(201).json({
      success: true,
      message: 'Redemption submitted! Payout processed within 24 hours.',
      redemption_id: redemption.id,
      new_balance: newBalance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Redemption failed', error: err.message });
  }
}

// App Update Checker & Forced Update Engine
async function checkAppUpdate(req, res) {
  try {
    const clientVersion = req.query.version || req.body?.version || '1.0.0';
    const clientVersionCode = parseInt(req.query.version_code || req.body?.version_code || '1', 10);
    const platform = req.query.platform || req.body?.platform || 'android';

    const settingsRows = await SystemSetting.findAll({
      where: {
        setting_key: [
          'app_latest_version',
          'app_min_version',
          'app_version_code',
          'app_force_update',
          'app_update_url',
          'app_download_apk_url',
          'app_release_notes',
          'maintenance_mode'
        ]
      }
    });

    const settings = {};
    settingsRows.forEach(s => { settings[s.setting_key] = s.setting_value; });

    const latestVersion = settings.app_latest_version || '1.1.0';
    const minVersion = settings.app_min_version || '1.0.0';
    const latestVersionCode = parseInt(settings.app_version_code || '11', 10);
    const isForceUpdateConfig = settings.app_force_update === 'true';
    const maintenanceMode = settings.maintenance_mode === 'true';

    // SemVer comparator helper
    const parseVer = (v) => (v || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
    const compareVer = (vA, vB) => {
      const a = parseVer(vA);
      const b = parseVer(vB);
      for (let i = 0; i < 3; i++) {
        if ((a[i] || 0) > (b[i] || 0)) return 1;
        if ((a[i] || 0) < (b[i] || 0)) return -1;
      }
      return 0;
    };

    const isBelowMin = compareVer(minVersion, clientVersion) > 0;
    const isNewerAvailable = compareVer(latestVersion, clientVersion) > 0 || clientVersionCode < latestVersionCode;

    const updateRequired = isBelowMin || (isForceUpdateConfig && isNewerAvailable);

    return res.json({
      success: true,
      platform,
      client_version: clientVersion,
      client_version_code: clientVersionCode,
      latest_version: latestVersion,
      min_version: minVersion,
      latest_version_code: latestVersionCode,
      has_update: isNewerAvailable,
      update_required: updateRequired,
      force_update: isForceUpdateConfig,
      title: updateRequired ? 'Critical Update Required' : (isNewerAvailable ? 'Update Available' : 'Up to Date'),
      update_url: settings.app_update_url || 'https://play.google.com/store/apps/details?id=com.gameloot.app',
      download_apk_url: settings.app_download_apk_url || 'https://gameloot.app/releases/GameLoot-v1.1.0.apk',
      release_notes: settings.app_release_notes || '• Performance updates and bug fixes.',
      maintenance_mode: maintenanceMode
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Version check failed', error: err.message });
  }
}

module.exports = {
  checkAppUpdate,
  getCategories,
  getGames,
  getRewards,
  getQuizzes,
  getSurfTasks,
  getSurveys,
  claimQuiz,
  claimSurf,
  claimSurvey,
  startSession,
  pingSession,
  claimSession,
  redeemReward
};
