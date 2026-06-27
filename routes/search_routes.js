const express = require('express');
const router = express.Router();

const Search_Controller = require('../controllers/search_controller');

router.get('/', Search_Controller.search);

module.exports = router;
