const express = require('express');
const path = require('path');
const router = express.Router();

/**
 * 页面路由配置
 */

// 隐私政策页面
router.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../view/pravicy.html'));
});

// 用户服务条款页面
router.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '../view/terms.html'));
});

module.exports = router;