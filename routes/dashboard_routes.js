const express = require('express');
const router = express.Router();

const Dashboard_Controller = require('../controllers/Dashboard_Controller');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/stats', authenticate, isAdmin, Dashboard_Controller.stats);
router.get('/charts', authenticate, isAdmin, Dashboard_Controller.chartData);

module.exports = router;
