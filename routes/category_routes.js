const express = require('express');
const router = express.Router();

const Category_Controller = require('../controllers/Category_Controller');
const upload = require('../middlewares/upload');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/', Category_Controller.index);
router.post('/', authenticate, isAdmin, upload.single('image'), Category_Controller.store);
router.put('/:id', authenticate, isAdmin, upload.single('image'), Category_Controller.update);
router.delete('/:id', authenticate, isAdmin, Category_Controller.destroy);

module.exports = router;
