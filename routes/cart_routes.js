const express = require('express');
const router = express.Router();

const Cart_Controller = require('../controllers/Cart_Controller');
const { authenticate } = require('../middlewares/Authentication');

router.get('/', authenticate, Cart_Controller.show);
router.post('/', authenticate, Cart_Controller.addItem);
router.put('/:itemId', authenticate, Cart_Controller.updateItem);
router.delete('/items/:itemId', authenticate, Cart_Controller.removeItem);
router.post('/clear', authenticate, Cart_Controller.clear);

module.exports = router;
