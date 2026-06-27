const express = require('express');
const router = express.Router();
const Profile_Controller = require('../controllers/Profile_Controller');
const { authenticate } = require('../middlewares/Authentication');
const upload = require('../middlewares/upload');

router.get('/', authenticate, Profile_Controller.show);
router.put('/', authenticate, upload.single('image'), Profile_Controller.update);

module.exports = router;
