// socket.js
const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    const activeUsers = {};


    
    io.on('connection', (socket) => {
               const authUserString = socket.handshake.query.user;
               let authUser = null;

               console.log("authUserString", authUserString);
    
        if (authUserString) {
            authUser = JSON.parse(authUserString); // Parse the string into an object
    
               
            if (authUser.staff_code) {
                activeUsers[authUser.staff_code] = { socketId: socket.id, active: true };
                io.emit('userConnected', { employeeId: authUser.staff_code });
            }
        }
    

        socket.on('joinChat', (chatId) => {
            socket.join(`chat_${chatId}`);
                   });

        socket.on('leaveChat', (chatId) => {
            socket.leave(`chat_${chatId}`);
                   });

        socket.on('joinChatRooms', (chatIds) => {
            chatIds.forEach((chatId) => {
                socket.join(`chat_${chatId}`);
                            });
        });
    
        // Leave multiple chat rooms at once (optional, if needed)
        socket.on('leaveChatRooms', (chatIds) => {
            chatIds.forEach((chatId) => {
                socket.leave(`chat_${chatId}`);
                            });
        });
    

        socket.on('joinRoom', (room) => {
                       socket.join(room);
        });
    
        socket.on('leaveRoom', (room) => {
            
            socket.leave(room);
        });

       

        socket.on('disconnect', () => {
            if (authUser && authUser.staff_code) {
                delete activeUsers[authUser.staff_code];
                io.emit('userDisconnected', {
                    employeeId: authUser.staff_code,
                    logoutTime: new Date().toISOString()
                });
                            }
        });
    });
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initSocket, getIO };
