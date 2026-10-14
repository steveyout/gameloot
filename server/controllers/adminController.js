async function updateSettings(req, res) {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'Settings array required' });
    }

    for (const s of settings) {
      const [record] = await SystemSetting.findOrCreate({
        where: { setting_key: s.setting_key },
        defaults: {
          setting_key: s.setting_key,
          setting_value: String(s.setting_value),
          setting_label: s.setting_label || s.setting_key,
          setting_type: s.setting_type || 'string',
          description: s.description || ''
        }
      });
      await record.update({ setting_value: String(s.setting_value) });
    }

    // Always fetch all client-critical settings and broadcast immediately
    const allAppSettings = await SystemSetting.findAll({
      where: {
        setting_key: [
          'app_latest_version',
          'app_min_version',
          'app_version_code',
          'app_force_update',
          'app_update_url',
          'app_download_apk_url',
          'app_release_notes',
          'maintenance_mode',
          'payouts_enabled'
        ]
      }
    });

    const updateData = {};
    allAppSettings.forEach(s => { updateData[s.setting_key] = s.setting_value; });
    broadcastAppUpdate(updateData);

    const isMaint = updateData.maintenance_mode === 'true';
    const isPayouts = updateData.payouts_enabled !== 'false';

    sendNotification({
      title: 'Settings Saved & Broadcasted',
      message: `System configuration updated. Maintenance: ${isMaint ? 'ENABLED' : 'DISABLED'} | Payouts: ${isPayouts ? 'ENABLED' : 'PAUSED'}.`,
      type: isMaint ? 'fraud' : 'success'
    });

    return res.json({ success: true, message: 'Settings saved and broadcasted successfully', updateData });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to save settings', error: err.message });
  }
}

// 8. Reward Items (Payout Options Catalog)
async function getRewardItems(req, res) {
  try {
    const items = await RewardItem.findAll({
      order: [['cost_points', 'ASC']]
    });
    return res.json({ success: true, rewardItems: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reward items', error: err.message });
  }
}

async function createRewardItem(req, res) {
  try {
    const { title, type, cost_points, cash_value_usd, icon_url, description, stock, is_active } = req.body;
    if (!title || !cost_points || !cash_value_usd) {
      return res.status(400).json({ success: false, message: 'Title, cost points, and cash value are required' });
    }

    const item = await RewardItem.create({
      title,
      type: type || 'paypal',
      cost_points: parseInt(cost_points, 10),
      cash_value_usd: parseFloat(cash_value_usd),
      icon_url: icon_url || 'https://cdn-icons-png.flaticon.com/512/174/174861.png',
      description,
      stock: stock !== undefined ? parseInt(stock, 10) : 999,
      is_active: is_active !== undefined ? !!is_active : true
    });

    sendNotification({
      title: 'New Payout Option Added',
      message: `"${item.title}" ($${Number(item.cash_value_usd).toFixed(2)}) was added to reward catalog.`,
      type: 'info'
    });

    return res.status(201).json({ success: true, message: 'Payout option created successfully', rewardItem: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create payout option', error: err.message });
  }
}

async function updateRewardItem(req, res) {
  try {
    const { id } = req.params;
    const item = await RewardItem.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Payout option not found' });

    await item.update(req.body);
    return res.json({ success: true, message: 'Payout option updated successfully', rewardItem: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update payout option', error: err.message });
  }
}

async function deleteRewardItem(req, res) {
  try {
    const { id } = req.params;
    const item = await RewardItem.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Payout option not found' });

    const title = item.title;
    await item.destroy();

    sendNotification({
      title: 'Payout Option Removed',
      message: `"${title}" has been deleted from reward catalog.`,
      type: 'info'
    });

    return res.json({ success: true, message: 'Payout option deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete payout option', error: err.message });
  }
}

async function toggleRewardItem(req, res) {
  try {
    const { id } = req.params;
    const item = await RewardItem.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Payout option not found' });

    item.is_active = !item.is_active;
    await item.save();

    sendNotification({
      title: 'Payout Option Status Changed',
      message: `"${item.title}" is now ${item.is_active ? 'ACTIVE (visible in app)' : 'DISABLED (hidden in app)'}.`,
      type: 'info'
    });

    return res.json({
      success: true,
      message: `Payout option ${item.is_active ? 'enabled (visible in app)' : 'disabled (hidden in app)'}`,
      rewardItem: item
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle payout option', error: err.message });
  }
}

module.exports = {
  getDashboard,
  getDashboardStats: getDashboard,
  bulkGamesAction: bulkActionGames,
  bulkUsersAction: bulkActionUsers,
  bulkRedemptionsAction: bulkActionRedemptions,
  getGames,
  createGame,
  updateGame,
  deleteGame,
  uploadImage,
  bulkActionGames,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUsers,
  getUserDetails,
  updateUserStatus,
  adjustUserPoints,
  bulkActionUsers,
  getRedemptions,
  updateRedemptionStatus,
  bulkActionRedemptions,
  getFraudLogs,
  updateFraudStatus,
  getSettings,
  updateSettings,
  getRewardItems,
  createRewardItem,
  updateRewardItem,
  deleteRewardItem,
  toggleRewardItem
};
