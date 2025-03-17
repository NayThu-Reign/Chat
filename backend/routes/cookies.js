const express = require('express');
const router = express.Router();
const cookiesController = require('../controllers/cookiesController');

// Define route for checking tokens in cookies
router.get('/check-token', cookiesController.checkTokens);

module.exports = router;