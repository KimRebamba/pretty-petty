const express = require('express');
const router = express.Router();

const User_Controller = require('../controllers/User_Controller');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/', authenticate, isAdmin, User_Controller.index);
router.put('/:id', authenticate, isAdmin, User_Controller.update);
router.put('/:id/deactivate', authenticate, isAdmin, User_Controller.deactivate);

module.exports = router;
