require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const package = require('./package.json');
const sequelize = require('./config/db');
const usersRoutes = require('./routes/users');
const chatsRoutes = require('./routes/chats');
const messagesRoutes = require('./routes/messages');
const reactionsRoutes = require('./routes/reactions');
const userPhotosRoutes = require('./routes/userPhotos');
require("./cron/userCronJob"); // Import to start the cron job

// const departmentsRoutes = require('./routes/departments');
const { initSocket } = require('./socket');
const multer = require('multer');
// require('./models/index');
require('./models/Index');
const path = require('path');

const port = 3001;

const apiRoot = '/api'

const app = express();

const server = require('http').createServer(app);

initSocket(server);

const corsOptions = {
    origin: "http://localhost:5173", // Allow your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Add methods as necessary
    credentials: true, // Enable cookies, tokens, etc.
    allowedHeaders: ["Content-Type", "Authorization"], // Specify which headers are allowed
};



app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));



app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/uploadFile')) {
        next(); // Skip body parsers for file upload routes
    } else {
        bodyParser.json({ limit: '200mb' })(req, res, next);
    }
}); 
app.use(bodyParser.urlencoded({ extended: true, limit: '200mb' }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(apiRoot, usersRoutes);
app.use(apiRoot, chatsRoutes);
app.use(apiRoot, messagesRoutes);
app.use(apiRoot, reactionsRoutes);
app.use(apiRoot, userPhotosRoutes);
// app.use(apiRoot, departmentsRoutes);

sequelize.sync() 
    .then(() => {
        console.log('Database synced');
        server.listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
        });
    })
    .catch((err) => {
        console.error('Error syncing database:', err);
});


