const express = require('express');
const router = express.Router();

const Product_Controller = require('../controllers/Product_Controller');
const upload = require('../middlewares/upload');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/', Product_Controller.index);
router.get('/:id', Product_Controller.show);

router.post('/', authenticate, isAdmin, upload.array('images', 10), Product_Controller.store);
router.put('/:id', authenticate, isAdmin, upload.array('images', 10), Product_Controller.update);
router.delete('/:id', authenticate, isAdmin, Product_Controller.destroy);
router.delete('/images/:imageId', authenticate, isAdmin, Product_Controller.destroyImage);

module.exports = router;
