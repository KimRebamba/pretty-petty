const express = require('express');
const router = express.Router();

const Review_Controller = require('../controllers/Review_Controller');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/my', authenticate, Review_Controller.myReviews);
router.get('/', Review_Controller.index);
router.get('/:id', authenticate, Review_Controller.show);
router.post('/', authenticate, Review_Controller.store);
router.put('/:id', authenticate, Review_Controller.update);
router.delete('/:id', authenticate, Review_Controller.destroy);
router.put('/:id/verify', authenticate, isAdmin, Review_Controller.verify);

module.exports = router;
