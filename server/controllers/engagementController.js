const { User, UserEngagement, PointTransaction } = require('../models');

const STREAK_REWARDS = [
  { day: 1, points: 15, tickets: 1, label: 'Day 1 Starter' },
  { day: 2, points: 25, tickets: 1, label: 'Day 2 Spark' },
  { day: 3, points: 40, tickets: 2, label: 'Day 3 Flame' },
  { day: 4, points: 60, tickets: 2, label: 'Day 4 Surge' },
  { day: 5, points: 90, tickets: 3, label: 'Day 5 Power' },
  { day: 6, points: 130, tickets: 3, label: 'Day 6 Ultra' },
  { day: 7, points: 300, tickets: 5, label: 'Day 7 MEGA LOOT' }
];

const WHEEL_SEGMENTS = [
  { id: 0, label: '15 PTS', points: 15, tickets: 0, weight: 35, color: '#06b6d4' },
  { id: 1, label: '30 PTS', points: 30, tickets: 0, weight: 25, color: '#3b82f6' },
  { id: 2, label: '50 PTS', points: 50, tickets: 1, weight: 18, color: '#8b5cf6' },
  { id: 3, label: '100 PTS', points: 100, tickets: 2, weight: 12, color: '#ec4899' },
  { id: 4, label: '200 PTS', points: 200, tickets: 3, weight: 6, color: '#f59e0b' },
  { id: 5, label: '500 PTS JACKPOT', points: 500, tickets: 5, weight: 4, color: '#10b981' }
];

function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function calculateVipTier(totalEarned) {
  if (totalEarned >= 10000) return { tier: 'Diamond', boost: '25% Multiplier', min: 10000, next: null };
  if (totalEarned >= 5000) return { tier: 'Platinum', boost: '15% Multiplier', min: 5000, next: 10000 };
  if (totalEarned >= 2000) return { tier: 'Gold', boost: '10% Multiplier', min: 2000, next: 5000 };
  if (totalEarned >= 500) return { tier: 'Silver', boost: '5% Multiplier', min: 500, next: 2000 };
  return { tier: 'Bronze', boost: 'Standard Rate', min: 0, next: 500 };
}

// 1. Daily Streak
async function getStreakStatus(req, res) {
  try {
    const userId = req.user.userId;
    let [engagement] = await UserEngagement.findOrCreate({
      where: { user_id: userId },
      defaults: { current_streak: 0, longest_streak: 0, last_checkin_date: null }
    });

    const todayStr = getTodayString();
    const yestStr = getYesterdayString();

    let streak = engagement.current_streak || 0;
    // Check if streak is broken (last checkin was before yesterday)
    if (engagement.last_checkin_date && engagement.last_checkin_date !== todayStr && engagement.last_checkin_date !== yestStr) {
      streak = 0;
      engagement.current_streak = 0;
      await engagement.save();
    }

    const canCheckIn = engagement.last_checkin_date !== todayStr;
    const currentDay = canCheckIn ? (streak % 7) + 1 : ((streak - 1) % 7) + 1;

    return res.json({
      success: true,
      current_streak: streak,
      longest_streak: engagement.longest_streak || streak,
      can_checkin: canCheckIn,
      current_day: currentDay,
      last_checkin_date: engagement.last_checkin_date,
      schedule: STREAK_REWARDS
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get streak status', error: err.message });
  }
}

async function claimDailyStreak(req, res) {
  try {
    const userId = req.user.userId;
    const todayStr = getTodayString();
    const yestStr = getYesterdayString();

    let [engagement] = await UserEngagement.findOrCreate({
      where: { user_id: userId },
      defaults: { current_streak: 0, longest_streak: 0, last_checkin_date: null }
    });

    if (engagement.last_checkin_date === todayStr) {
      return res.status(400).json({ success: false, message: 'You already claimed your streak reward for today!' });
    }

    let streak = engagement.current_streak || 0;
    if (!engagement.last_checkin_date || engagement.last_checkin_date === yestStr) {
      streak += 1;
    } else {
      streak = 1; // reset streak
    }

    const rewardIdx = (streak - 1) % 7;
    const reward = STREAK_REWARDS[rewardIdx];

    const user = await User.findByPk(userId);
    user.points_balance += reward.points;
    user.total_earned += reward.points;
    user.tickets_balance = (user.tickets_balance || 0) + reward.tickets;
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'streak_bonus',
      amount: reward.points,
      balance_after: user.points_balance,
      description: `Daily Check-in Day ${reward.day}: ${reward.label} (+${reward.tickets} Tickets)`
    });

    engagement.current_streak = streak;
    if (streak > (engagement.longest_streak || 0)) {
      engagement.longest_streak = streak;
    }
    engagement.last_checkin_date = todayStr;
    await engagement.save();

    return res.json({
      success: true,
      message: `Claimed Day ${reward.day} bonus! +${reward.points} PTS & +${reward.tickets} Tickets.`,
      reward,
      current_streak: streak,
      new_balance: user.points_balance,
      new_tickets: user.tickets_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to claim streak', error: err.message });
  }
}

// 2. Lucky Wheel of Fortune
async function getWheelStatus(req, res) {
  try {
    const userId = req.user.userId;
    let [engagement] = await UserEngagement.findOrCreate({
      where: { user_id: userId },
      defaults: { total_spins: 0, last_wheel_spin: null }
    });

    const now = new Date();
    const COOLDOWN_HOURS = 8;
    let canSpin = true;
    let secondsRemaining = 0;

    if (engagement.last_wheel_spin) {
      const lastSpin = new Date(engagement.last_wheel_spin);
      const elapsedSeconds = Math.floor((now - lastSpin) / 1000);
      const cooldownSec = COOLDOWN_HOURS * 3600;

      if (elapsedSeconds < cooldownSec) {
        canSpin = false;
        secondsRemaining = cooldownSec - elapsedSeconds;
      }
    }

    return res.json({
      success: true,
      can_spin: canSpin,
      seconds_remaining: secondsRemaining,
      cooldown_hours: COOLDOWN_HOURS,
      total_spins: engagement.total_spins || 0,
      segments: WHEEL_SEGMENTS
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get wheel status', error: err.message });
  }
}

async function spinLuckyWheel(req, res) {
  try {
    const userId = req.user.userId;
    let [engagement] = await UserEngagement.findOrCreate({
      where: { user_id: userId },
      defaults: { total_spins: 0, last_wheel_spin: null }
    });

    const now = new Date();
    const COOLDOWN_HOURS = 8;
    if (engagement.last_wheel_spin) {
      const lastSpin = new Date(engagement.last_wheel_spin);
      const elapsedSeconds = Math.floor((now - lastSpin) / 1000);
      const cooldownSec = COOLDOWN_HOURS * 3600;

      if (elapsedSeconds < cooldownSec) {
        const minsLeft = Math.ceil((cooldownSec - elapsedSeconds) / 60);
        return res.status(400).json({
          success: false,
          message: `Wheel is on cooldown. Next spin in ${minsLeft} minutes!`
        });
      }
    }

    // Weighted random selection
    const totalWeight = WHEEL_SEGMENTS.reduce((acc, s) => acc + s.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedSegment = WHEEL_SEGMENTS[0];

    for (const segment of WHEEL_SEGMENTS) {
      if (randomNum < segment.weight) {
        selectedSegment = segment;
        break;
      }
      randomNum -= segment.weight;
    }

    const user = await User.findByPk(userId);
    user.points_balance += selectedSegment.points;
    user.total_earned += selectedSegment.points;
    if (selectedSegment.tickets > 0) {
      user.tickets_balance = (user.tickets_balance || 0) + selectedSegment.tickets;
    }
    await user.save();

    await PointTransaction.create({
      user_id: user.id,
      type: 'wheel_bonus',
      amount: selectedSegment.points,
      balance_after: user.points_balance,
      description: `Lucky Wheel Spin: ${selectedSegment.label}`
    });

    engagement.last_wheel_spin = now;
    engagement.total_spins = (engagement.total_spins || 0) + 1;
    await engagement.save();

    return res.json({
      success: true,
      message: `You won ${selectedSegment.label}!`,
      won_segment: selectedSegment,
      new_balance: user.points_balance,
      new_tickets: user.tickets_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to spin wheel', error: err.message });
  }
}

// 3. VIP Loyalty Tiers
async function getVipStatus(req, res) {
  try {
    const user = await User.findByPk(req.user.userId);
    const tierInfo = calculateVipTier(user.total_earned || 0);

    return res.json({
      success: true,
      user_id: user.id,
      total_earned: user.total_earned || 0,
      vip: tierInfo
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get VIP status', error: err.message });
  }
}

module.exports = {
  getStreakStatus,
  claimDailyStreak,
  getWheelStatus,
  spinLuckyWheel,
  getVipStatus
};
