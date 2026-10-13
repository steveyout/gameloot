import { API_BASE_URL, CURRENT_APP_VERSION, CURRENT_VERSION_CODE } from './config';

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out after ' + (timeoutMs / 1000) + 's');
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
    headers['Authorization'] = 'Bearer ' + token;
  }

  const targetUrl = API_BASE_URL + endpoint;

  let res;
  try {
    res = await fetchWithTimeout(targetUrl, { ...options, headers }, 10000);
  } catch (err) {
    throw new Error(err.message || 'Network request failed to GameLoot server.');
  }

  // Safely parse response text. Protects against BunkerWeb WAF or reverse proxy HTML error pages.
  const rawText = await res.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (_jsonErr) {
    data = null;
  }

  if (!res.ok) {
    // If server provided a structured JSON error message, surface it directly
    if (data && (data.message || data.error)) {
      throw new Error(data.message || data.error);
    }

    // Otherwise translate status code into clean, human-readable error (preventing raw HTML/JSON parse crashes)
    if (res.status === 400) {
      throw new Error('Invalid input. Please check your credentials and try again.');
    } else if (res.status === 401) {
      throw new Error('Invalid username or password. Please verify your credentials.');
    } else if (res.status === 403) {
      throw new Error('Access denied. Your account is restricted or suspended.');
    } else if (res.status === 404) {
      throw new Error('GameLoot service endpoint not found (404).');
    } else if (res.status === 409) {
      throw new Error('Username or email is already registered.');
    } else if (res.status === 429) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    } else if (res.status >= 500) {
      throw new Error('Server error (' + res.status + '). Please try again in a few moments.');
    }
    throw new Error('Server returned error status ' + res.status);
  }

  // Fallback for non-JSON 200 responses
  if (data === null) {
    return { success: true, text: rawText };
  }

  return data;
}

// 1. App Version & Forced Update Checker
export async function checkAppVersion(version = CURRENT_APP_VERSION, versionCode = CURRENT_VERSION_CODE) {
  return request('/client/app-version?version=' + encodeURIComponent(version) + '&version_code=' + versionCode);
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

export async function userGoogleLogin(googleData) {
  return request('/auth/user/google', {
    method: 'POST',
    body: JSON.stringify(googleData)
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
  if (category) params.push('category=' + encodeURIComponent(category));
  if (search) params.push('search=' + encodeURIComponent(search));
  if (params.length) q = '?' + params.join('&');
  return request('/client/games' + q);
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
    body: JSON.stringify({ session_id, session_token: session_id, client_hash })
  }, token);
}

export async function claimPlaySession(token, session_id) {
  return request('/client/session/claim', {
    method: 'POST',
    body: JSON.stringify({ session_id, session_token: session_id })
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
    body: JSON.stringify({ task_id, surf_task_id: task_id })
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

// 6. Rewarded Ad Video Drops & Loot Boxes
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
