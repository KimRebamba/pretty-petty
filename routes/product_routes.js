const express = require('express');
const router = express.Router();

const Product_Controller = require('../controllers/product_controller');
const upload = require('../middlewares/upload');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/', Product_Controller.index);
router.post('/', authenticate, isAdmin, upload.array('images', 10), Product_Controller.store);
router.delete('/bulk', authenticate, isAdmin, Product_Controller.bulkDelete);
router.delete('/images/:imageId', authenticate, isAdmin, Product_Controller.destroyImage);
router.get('/:id', Product_Controller.show);
router.put('/:id', authenticate, isAdmin, upload.array('images', 10), Product_Controller.update);
router.put('/:id/restore', authenticate, isAdmin, Product_Controller.restore);
router.delete('/:id', authenticate, isAdmin, Product_Controller.destroy);

module.exports = router;
