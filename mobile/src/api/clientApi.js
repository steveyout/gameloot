import { API_BASE_URL, CURRENT_APP_VERSION, CURRENT_VERSION_CODE } from './config';

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const primaryUrl = `${API_BASE_URL}${endpoint}`;
  
  // Potential fallback endpoints if connected via emulator or LAN
  const candidateUrls = [primaryUrl];
  if (!primaryUrl.includes('10.0.2.2')) {
    candidateUrls.push(`http://10.0.2.2:5000/api${endpoint}`);
  }
  if (!primaryUrl.includes('localhost') && !primaryUrl.includes('127.0.0.1')) {
    candidateUrls.push(`http://localhost:5000/api${endpoint}`);
  }

  let lastError = null;
  for (const url of candidateUrls) {
    try {
      const res = await fetchWithTimeout(url, { ...options, headers }, 6000);
      const data = await res.json();
      return data;
    } catch (err) {
      lastError = err;
      // Try next candidate URL
    }
  }

  throw new Error(lastError ? lastError.message : 'Network request failed. Is server running on port 5000?');
}

// 1. App Version & Forced Update Checker
export async function checkAppVersion(version = CURRENT_APP_VERSION, versionCode = CURRENT_VERSION_CODE) {
  return request(`/client/app-version?version=${encodeURIComponent(version)}&version_code=${versionCode}`);
}

// 2. Authentication
export async function userLogin(username, password) {
  return request('/auth/user/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername: username, username, password })
  });
}

export async function userRegister(username, email, password) {
  return request('/auth/user/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
}

export async function getUserProfile(token) {
  return request('/auth/me', { method: 'GET' }, token);
}

// 3. Games Catalog
export async function getCategories() {
  return request('/client/categories');
}

export async function getGames(category = null, search = null) {
  let q = '';
  const params = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (params.length) q = `?${params.join('&')}`;
  return request(`/client/games${q}`);
}

// 4. Play-To-Earn Heartbeat Session (Proof of Play)
export async function startPlaySession(token, game_id) {
  return request('/client/session/start', {
    method: 'POST',
    body: JSON.stringify({ game_id })
  }, token);
}

export async function pingPlaySession(token, session_id, client_hash) {
  return request('/client/session/ping', {
    method: 'POST',
    body: JSON.stringify({ session_id, client_hash })
  }, token);
}

export async function claimPlaySession(token, session_id) {
  return request('/client/session/claim', {
    method: 'POST',
    body: JSON.stringify({ session_id })
  }, token);
}

// 5. Earning Hub: Quizzes, Surf, Surveys
export async function getQuizzes() {
  return request('/client/quizzes');
}

export async function claimQuizReward(token, quiz_id, answers) {
  return request('/client/quiz/claim', {
    method: 'POST',
    body: JSON.stringify({ quiz_id, answers })
  }, token);
}

export async function getSurfTasks() {
  return request('/client/surf-tasks');
}

export async function claimSurfReward(token, task_id) {
  return request('/client/surf/claim', {
    method: 'POST',
    body: JSON.stringify({ task_id })
  }, token);
}

export async function getSurveys() {
  return request('/client/surveys');
}

export async function claimSurveyReward(token, survey_id, answers) {
  return request('/client/survey/claim', {
    method: 'POST',
    body: JSON.stringify({ survey_id, answers })
  }, token);
}

// 6. AdMob Rewarded Ads
export async function getAdConfig() {
  return request('/client/ads/config');
}

export async function claimRewardedAd(token, placement_key = 'rewarded_daily_chest') {
  const nonce = 'ad_' + Math.random().toString(36).substring(2, 9);
  return request('/client/ads/claim', {
    method: 'POST',
    body: JSON.stringify({ placement_key, nonce })
  }, token);
}

// 7. Rewards Catalog & Payout Cashouts
export async function getRewards() {
  return request('/client/rewards');
}

export async function redeemReward(token, reward_item_id, payout_details) {
  return request('/client/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify({ reward_item_id, payout_details })
  }, token);
}

// 8. Notifications & Drops
export async function getNotifications(token) {
  return request('/client/notifications', { method: 'GET' }, token);
}

export async function markNotificationRead(token, notification_id) {
  return request('/client/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notification_id })
  }, token);
}

export async function markAllNotificationsRead(token) {
  return request('/client/notifications/mark-all-read', {
    method: 'POST'
  }, token);
}

export async function claimNotificationBonus(token, notification_id) {
  return request('/client/notifications/claim-bonus', {
    method: 'POST',
    body: JSON.stringify({ notification_id })
  }, token);
}

// 9. Retention & Gamification Hooks: Daily Streak & Lucky Wheel
export async function getStreakStatus(token) {
  return request('/client/streak', { method: 'GET' }, token);
}

export async function claimDailyStreak(token) {
  return request('/client/streak/checkin', {
    method: 'POST'
  }, token);
}

export async function getWheelStatus(token) {
  return request('/client/wheel', { method: 'GET' }, token);
}

export async function spinLuckyWheel(token) {
  return request('/client/wheel/spin', {
    method: 'POST'
  }, token);
}

export async function getVipStatus(token) {
  return request('/client/vip', { method: 'GET' }, token);
}
