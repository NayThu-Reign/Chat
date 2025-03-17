const express = require("express");
const router = express.Router();
const messageController = require('../controllers/messageController');
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









router.get("/messages/:id", auth, messageController.messageDetail);

router.get("/messages/allReactions" , auth, messageController.getReactionsForMessage);

// router.post("/messages/upload", auth, upload.single('file'), messageController.attachFile);
// router.post("/messages", auth, upload.single('media'), messageController.createMessage);
router.post("/messages", auth, upload.single('media'), messageController.createMessage);
router.post('/uploadFileMessage', auth, upload.single('file'), messageController.createFileMessage);
router.post('/uploadFile', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log('Uploaded file info:', req.file); // Debug uploaded file info
    res.send(`File uploaded successfully: ${req.file.filename}`);
});



router.put("/messages/:chatId", auth, messageController.deleteMessage);
router.post("/messages/pin/:messageId", auth, messageController.pinMessage);
router.post("/messages/unpin/:messageId", auth, messageController.unPinMessage);
router.post("/messages/markRead", auth, messageController.markReadMessage);
router.put("/messages/:id/edit", auth, messageController.editMessage);
router.patch("/messages/:id/deleteForSelf", auth, messageController.deleteForMySelfMessage);
router.post("/messages/forward" , auth, messageController.forwardMessage);


module.exports = router;