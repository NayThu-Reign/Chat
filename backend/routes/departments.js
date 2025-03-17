const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const auth = require('../middleware/auth');

router.get("/departments", departmentController.getAllDepartments);

module.exports = router;