const express = require('express');
const router = express.Router();

const Search_Controller = require('../controllers/Search_Controller');

router.get('/', Search_Controller.search);

module.exports = router;
