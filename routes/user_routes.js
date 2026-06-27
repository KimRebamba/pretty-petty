const express = require('express');
const router = express.Router();

const User_Controller = require('../controllers/user_controller');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/', authenticate, isAdmin, User_Controller.index);
router.post('/', authenticate, isAdmin, User_Controller.store);
router.delete('/bulk', authenticate, isAdmin, User_Controller.bulkDestroy);
router.get('/:id', authenticate, isAdmin, User_Controller.show);
router.put('/:id', authenticate, isAdmin, User_Controller.update);
router.delete('/:id', authenticate, isAdmin, User_Controller.destroy);
router.put('/:id/restore', authenticate, isAdmin, User_Controller.restore);

module.exports = router;
