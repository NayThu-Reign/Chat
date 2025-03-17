const express = require("express");
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});


const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Set file size limit (100MB)
});

router.get("/chats", auth, chatController.getAllChats);
router.get("/chatsOne", auth, chatController.getAllChatsOne);
router.get("/chats/:id", auth, chatController.chatDetail);
router.post("/chats", auth, chatController.createChat);
router.post("/chats/:chatId/add-users", auth, chatController.addUsersToChat);
router.post("/chats/:chatId/remove-users", auth, chatController.removeUsersFromChat);
router.post("/chats/:chatId/give-admin", auth, chatController.giveAdminToChat);
router.get("/chats/:chatId/participants", auth, chatController.getChatWithParticipants);
router.put("/chats/photo-update/:id", auth, upload.single('photo'), chatController.chatPhoto);
router.post("/chats/mute/:chatId", auth, chatController.muteChat);
router.post("/chats/unmute/:chatId", auth, chatController.unMuteChat);
router.post("/allChats/mute", auth, chatController.muteAllChats);
router.post("/allChats/unmute", auth, chatController.unMuteAllChats);
router.post("/chats/delete/:id", auth, chatController.deleteChatForUser);
router.post("/chats/leave/:id", auth, chatController.leaveChat);



module.exports = router;