const express = require("express");
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const auth = require('../middleware/auth');
const io = require('../index');
const fs = require('fs');

const multer = require('multer');
const path = require("path");


const currentDate = new Date();
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/messages', year.toString(), month);

        // Ensure the directory exists
        fs.mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) {
                console.error('Failed to create upload directory:', err);
                return cb(err);
            }
            cb(null, uploadPath);
        });
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const sanitizedFilename = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores
        cb(null, `${uniqueSuffix}_${sanitizedFilename}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Set file size limit (100MB)
});










// Make sure this route is defined correctly
router.post("/reactions", auth, reactionController.addReactionToMessage);
router.get("/reactions/:id", auth, reactionController.getReactionsForMessage);
router.delete("/reactions", auth, reactionController.removeReactionToMessage);


module.exports = router;