const express = require('express');
const router = express.Router();

const Category_Controller = require('../controllers/category_controller');
const upload = require('../middlewares/upload');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/', Category_Controller.index);
router.post('/', authenticate, isAdmin, upload.single('image'), Category_Controller.store);
router.delete('/bulk', authenticate, isAdmin, Category_Controller.bulkDelete);
router.get('/:id', Category_Controller.show);
router.put('/:id', authenticate, isAdmin, upload.single('image'), Category_Controller.update);
router.put('/:id/restore', authenticate, isAdmin, Category_Controller.restore);
router.delete('/:id', authenticate, isAdmin, Category_Controller.destroy);

module.exports = router;
