const { Quiz, SurfTask, Survey, User, PointTransaction } = require('../models');
const { sendNotification } = require('../services/socket');

// ========================
// QUIZZES
// ========================
async function getQuizzes(req, res) {
  try {
    const quizzes = await Quiz.findAll({ order: [['id', 'DESC']] });
    return res.json({ success: true, quizzes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch quizzes', error: err.message });
  }
}

async function createQuiz(req, res) {
  try {
    const { title, category, description, thumbnail_url, reward_points, time_limit_seconds, questions_json } = req.body;
    if (!title || !questions_json) {
      return res.status(400).json({ success: false, message: 'Title and questions are required' });
    }

    const quiz = await Quiz.create({
      title,
      category: category || 'Gaming Trivia',
      description,
      thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&q=80',
      reward_points: parseInt(reward_points, 10) || 50,
      time_limit_seconds: parseInt(time_limit_seconds, 10) || 60,
      questions_count: Array.isArray(questions_json) ? questions_json.length : 3,
      questions_json
    });

    sendNotification({
      title: 'New Quiz Published',
      message: `"${quiz.title}" (+${quiz.reward_points} PTS) is now live!`,
      type: 'info'
    });

    return res.status(201).json({ success: true, message: 'Quiz created successfully', quiz });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create quiz', error: err.message });
  }
}

async function updateQuiz(req, res) {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    await quiz.update(req.body);
    return res.json({ success: true, message: 'Quiz updated', quiz });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update quiz', error: err.message });
  }
}

async function deleteQuiz(req, res) {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    await quiz.destroy();
    return res.json({ success: true, message: 'Quiz deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete quiz', error: err.message });
  }
}

// ========================
// SURF TASKS
// ========================
async function getSurfTasks(req, res) {
  try {
    const tasks = await SurfTask.findAll({ order: [['id', 'DESC']] });
    return res.json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch surf tasks', error: err.message });
  }
}

async function createSurfTask(req, res) {
  try {
    const { title, website_url, description, thumbnail_url, reward_points, duration_seconds, daily_limit } = req.body;
    if (!title || !website_url) {
      return res.status(400).json({ success: false, message: 'Title and website URL are required' });
    }

    const task = await SurfTask.create({
      title,
      website_url,
      description,
      thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80',
      reward_points: parseInt(reward_points, 10) || 25,
      duration_seconds: parseInt(duration_seconds, 10) || 30,
      daily_limit: parseInt(daily_limit, 10) || 5
    });

    sendNotification({
      title: 'New Web Surf Task',
      message: `"${task.title}" (+${task.reward_points} PTS) added.`,
      type: 'info'
    });

    return res.status(201).json({ success: true, message: 'Surf task created', task });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create surf task', error: err.message });
  }
}

async function updateSurfTask(req, res) {
  try {
    const task = await SurfTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Surf task not found' });
    await task.update(req.body);
    return res.json({ success: true, message: 'Surf task updated', task });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update surf task', error: err.message });
  }
}

async function deleteSurfTask(req, res) {
  try {
    const task = await SurfTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Surf task not found' });
    await task.destroy();
    return res.json({ success: true, message: 'Surf task deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete surf task', error: err.message });
  }
}

// ========================
// SURVEYS
// ========================
async function getSurveys(req, res) {
  try {
    const surveys = await Survey.findAll({ order: [['id', 'DESC']] });
    return res.json({ success: true, surveys });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch surveys', error: err.message });
  }
}

async function createSurvey(req, res) {
  try {
    const { title, provider, description, thumbnail_url, reward_points, estimated_minutes, questions_json } = req.body;
    if (!title || !questions_json) {
      return res.status(400).json({ success: false, message: 'Title and questions are required' });
    }

    const survey = await Survey.create({
      title,
      provider: provider || 'GameLoot Research',
      description,
      thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80',
      reward_points: parseInt(reward_points, 10) || 120,
      estimated_minutes: parseInt(estimated_minutes, 10) || 3,
      questions_json
    });

    sendNotification({
      title: 'New High-Reward Survey',
      message: `"${survey.title}" (+${survey.reward_points} PTS) published.`,
      type: 'info'
    });

    return res.status(201).json({ success: true, message: 'Survey created', survey });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create survey', error: err.message });
  }
}

async function updateSurvey(req, res) {
  try {
    const survey = await Survey.findByPk(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });
    await survey.update(req.body);
    return res.json({ success: true, message: 'Survey updated', survey });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update survey', error: err.message });
  }
}

async function deleteSurvey(req, res) {
  try {
    const survey = await Survey.findByPk(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });
    await survey.destroy();
    return res.json({ success: true, message: 'Survey deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete survey', error: err.message });
  }
}

module.exports = {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getSurfTasks,
  createSurfTask,
  updateSurfTask,
  deleteSurfTask,
  getSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey
};
