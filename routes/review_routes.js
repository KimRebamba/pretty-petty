const express = require('express');
const router = express.Router();

const Review_Controller = require('../controllers/review_controller');
const { authenticate, isAdmin } = require('../middlewares/Authentication');

router.get('/my', authenticate, Review_Controller.myReviews);
router.get('/', Review_Controller.index);
router.delete('/bulk', authenticate, isAdmin, Review_Controller.bulkDelete);
router.get('/:id', authenticate, Review_Controller.show);
router.post('/', authenticate, Review_Controller.store);
router.put('/:id/verify', authenticate, isAdmin, Review_Controller.verify);
router.put('/:id/restore', authenticate, isAdmin, Review_Controller.restore);
router.put('/:id', authenticate, Review_Controller.update);
router.delete('/:id', authenticate, Review_Controller.destroy);

module.exports = router;
