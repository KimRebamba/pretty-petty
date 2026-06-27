const express = require('express');
const router = express.Router();

const Order_Controller = require('../controllers/Order_Controller');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/my', authenticate, Order_Controller.myOrders);
router.put('/:id/cancel', authenticate, Order_Controller.cancel);
router.get('/', authenticate, isAdmin, Order_Controller.index);
router.get('/:id', authenticate, isAdmin, Order_Controller.show);
router.post('/', authenticate, Order_Controller.store);
router.put('/:id', authenticate, isAdmin, Order_Controller.update);

module.exports = router;
