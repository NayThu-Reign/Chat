const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const { getIO } = require('../socket');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const Chat = require("../models/Chat");
const axios = require('axios'); // Import Axios for API requests
const ChatOwner = require("../models/ChatOwner");
const ChatParticipant = require("../models/ChatParticipant");
// const bcrypt = require('bcrypt');


const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

let allUsersCache = null; // Cache to store all users
async function getAllUsers() {
    if (!allUsersCache) {
        try {
            const response = await axios.get(`https://portal.trustlinkmm.com/api/getAllEmployees`);
            allUsersCache = response.data; // Cache the user list
        } catch (error) {
            console.error('Error fetching all users:', error);
            return [];
        }
    }
    return allUsersCache;
}

async function getUserByCode(code) {
    try {
        const allUsers = await getAllUsers();
        const users = allUsers.staffs || []; // Ensure it's an array
        const user = users.find(user => user.employeeId === code);
        return user || null;
    } catch (error) {
        console.error('Error filtering user by code:', error);
        return null;
    }
}

exports.getAllUsers = async (req, res) => {
    // const userId = req.user.id;

   

    try {
        // Fetch all chats where the user is a participant
        const users = await User.findAll();

        console.log("Users", users);

        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ error: 'Database query error', details: err.message });
    }
};

exports.getUserDetail = async (req, res) => {
    // const userId = req.user.id;
    const userId = req.user.staff_code;

    try {
        // Fetch all chats where the user is a participant
        const user = await User.findOne({
            where: {
                user_code: userId
            }
        });

        return res.status(200).json({ status: 1, user: user});
    } catch (err) {
        return res.status(500).json({status: 0, error: 'Database query error', details: err.message });
    }
};

exports.getRecipientDetail = async (req, res) => {
    // const userId = req.user.id;
    const userId = req.params.id;

    try {
        // Fetch all chats where the user is a participant
        const user = await User.findOne({
            where: {
                user_code: userId
            }
        });

        return res.status(200).json({ status: 1, user: user});
    } catch (err) {
        return res.status(500).json({status: 0, error: 'Database query error', details: err.message });
    }
};

// exports.register = async(req, res) => {
    
//     const { username, email, password, department_id, position } = req.body;
//     console.log("Body", req.body);
    
//     try {
//         const existingUser = await User.findOne({ where: { email } });
//         if (existingUser) {
//             return res.status(400).json({ error: 'Email already registered'});
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = await User.create({
//             department_id,
//             position,
//             username,
//             email,
//             password: hashedPassword,
//         });

//         const verificationToken = jwt.sign({ id: newUser.id }, JWT_SECRET, {expiresIn: '1d'});

//         const verificationLink = `http://192.168.12.54:3000/api/verify-email?token=${verificationToken}`;
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: newUser.email,
//             subject: 'Verify Your Email',
//             html: `<p>Please verify your email by clicking the following link:</p><a href="${verificationLink}">Verify Email</a>`,
//         })

//         return res.status(201).json({ message: 'User registered successfully', user: newUser})
//     } catch(error) {
//         return res.status(500).json({error: "Error registering user", details: error});
//     }
// }


exports.register = async (req, res) => {
    const { email, password } = req.body;
    console.log("Request Body:", req.body);

    const tokenApiUrl = process.env.HR_API_TOKEN_URL; 
    const userInfoApiUrl = process.env.HR_API_URL;
    
    console.log("Token API URL:", tokenApiUrl);
    console.log("User Info API URL:", userInfoApiUrl);

    try {
        
        const tokenResponse = await axios.post(tokenApiUrl, { key: 'tlChatApp' });
        const token = tokenResponse.data.token;

        if (!token) {
            return res.status(500).json({ error: 'Failed to retrieve authorization token' });
        }

       
        const hrApiResponse = await axios.post(
            userInfoApiUrl,
            { email },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const userInfo = hrApiResponse.data.data[0]; 

        if (!userInfo) {
            return res.status(400).json({ error: 'Invalid email, user not found in the HR system' });
        }

        const { emailaddress, userfullname, deptname, positionname } = userInfo;

       
        const existingUser = await User.findOne({ where: { email: emailaddress } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

       
        const hashedPassword = await bcrypt.hash(password, 10);

        
        const newUser = await User.create({
            username: userfullname,
            email: emailaddress,
            password: hashedPassword,
            departmentName: deptname, 
            position: positionname, 
        });

       
        const verificationToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const verificationLink = `http://192.168.12.54:3000/api/verify-email?token=${verificationToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: newUser.email,
            subject: 'Verify Your Email',
            html: `<p>Please verify your email by clicking the following link:</p>
            <p>Username: ${newUser.username}, Password: ${newUser.password}</p>
            <a href="${verificationLink}">Verify Email</a>`,
        });

        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Error registering user', details: error.message });
    }
};

exports.login = async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email }});

        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.emailVerified) {
            return res.status(401).json({ error: 'Please verify your email before logging in' });
        }

        const userWithPassword = await User.findOne({ where: { email } });
        const isMatch = await bcrypt.compare(password, userWithPassword.password);
        if(!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            {id: user.id, email: user.email},
            JWT_SECRET,
            { expiresIn: '1d'}
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        const accessTokenExpiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60); 
        const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); 

        user.refreshToken = refreshToken;
        user.active = true;
        await user.save();

        const io = getIO();
        io.emit('activeStatus', user);

       
        return res.status(200).json({
            message: 'Login successful',
            token,
            refreshToken,
            user,
            accessTokenExpiry,
            refreshTokenExpiry
        });

        
    } catch(error) {
        return res.status(500).json({ error: 'Error logging in', details: error });
    }
}

exports.logout = async (req, res) => {
    const userId = req.user.id;

    

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

       
        user.refreshToken = null;
        user.active = false;
        user.logoutTime = new Date();
        await user.save();

        const io = getIO();
        io.emit('activeStatus', user);

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Error logging out', details: error.message });
    }
};

exports.unActive = async (req, res) => {
    const userId = req.user.id;

    

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.active = false;
        user.logoutTime = new Date();
        await user.save();

        const io = getIO();
        io.emit('activeStatusOne', user);


        return res.status(200).json({ message: 'User become unactive' });
    } catch (error) {
        return res.status(500).json({ error: 'Error for unactive user', details: error.message });
    }
};

exports.active = async (req, res) => {
    const userId = req.user.id;

    

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.active = true;
        user.logoutTime = new Date();
        await user.save();

        const io = getIO();
        io.emit('activeStatusTwo', user);


        return res.status(200).json({ message: 'User become unactive' });
    } catch (error) {
        return res.status(500).json({ error: 'Error for unactive user', details: error.message });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    console.log("Incoming refreshToken:", refreshToken);

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }

    
    try {
        console.log("JWT_REFRESH_SECRET in use:", JWT_REFRESH_SECRET);

        // Decode without verification to inspect structure
        const cleanToken = refreshToken.replace(/^"|"$/g, "");
        const decodedWithoutVerify = jwt.decode(cleanToken);
        if (!decodedWithoutVerify) {
            return res.status(403).json({ error: 'Invalid token structure' });
        }
        console.log("Decoded payload without verification:", decodedWithoutVerify);

        // Verify the token with the secret to check validity
        // const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        // console.log("Decoded and verified payload:", decoded);

        // Check if the user exists
        const user = await User.findByPk(decodedWithoutVerify.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify if the stored refresh token matches
        console.log("UserRefreshToken", user.refreshToken);
        console.log("RefreshToken", cleanToken);
        if (user.refreshToken !== cleanToken) {
            console.error('Stored token does not match the provided token.');
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Generate a new access token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error("Error verifying refresh token:", error);
        return res.status(403).json({ error: 'Invalid or expired refresh token', details: error.message });
    }
};


exports.verifyEmail = async(req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if(user.emailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        user.emailVerified = true;
        await user.save();

        return res.status(200).sendFile(path.join(__dirname, '../views/email-verified.html'));

        // return res.status(200).json({ message: 'Email verified successfully. You can now log in' });
    } catch(error) {
        return res.status(500).json({ error: 'Invalid or expired token', details: error });
    }
}

exports.updateUser = async (req, res) => {
    console.log("Body", req.body);
    const { user_photo, username } = req.body;
    const userId = req.user.id;
    console.log("UserId", userId);
    const id = req.params.id;
    console.log("id", id);


    try {
        const user = await User.findByPk(id);
        console.log("User", user);

        if(!user) {
            return res.status(404).json({error: "User not found"});
        }

        if(user.id !== userId) {
            return res.status(403).json({error: "Unauthorize access"});
        }


        
        let photo = null;
        if (user_photo) {
            console.log("UserPhoto here");
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const file_path = path.join(process.cwd(), 'public', `uploads/profiles/${year}/${month}`);
        
            // Ensure directory exists
            if (!fs.existsSync(file_path)) {
                fs.mkdirSync(file_path, { recursive: true });
                console.log(`Created directory: ${file_path}`);
            }
        
            // Decode base64 content and save file
            const base64Content = user_photo.split(';base64,').pop();
            const buffer = Buffer.from(base64Content, 'base64');
        
            // Use the original file name (sanitize if necessary)
            const originalFileName = `${userId}_${Date.now()}_${user.username}`; // Prefix with sender_id and timestamp for uniqueness
            const fullFilePath = path.join(file_path, originalFileName);
        
            await fsPromises.writeFile(fullFilePath, buffer);
            photo = `uploads/profiles/${year}/${month}/${originalFileName}`; // Use the original name for URL
        }

        console.log("Hellop Initial")

        const updatedUser = await user.update(
            {
                username,
                user_photo: photo ? photo : user.user_photo
            }
        );

        console.log("Updated User", updatedUser);

        const io = getIO();
        io.emit('userPhoto', updatedUser);


        return res.status(201).json({status: 1, message: "Updated Successfully", updatedUser})
    } catch (error) {
        return res.status(500).json({status: 0, error: 'Something wrong', details: error });
    }

}

exports.addToGroup = async (req, res) => {
    const userId = req.params.id; // Extract user ID from request params
    const { chatIds } = req.body;  // Array of chat IDs to add the user to
    const userIdFromToken = req.user.staff_code;

    try {
        // Step 1: Find the chats by their IDs
        const chats = await Chat.findAll({
            where: { id: chatIds }
        });

        if (chats.length === 0) {
            return res.status(404).json({ error: 'Chats not found' });
        }

        // Step 2: Find all chat owners for the provided chat IDs
        const chatOwners = await ChatOwner.findAll({
            where: { chat_id: chatIds },
            attributes: ['chat_id', 'user_id'],
        });

        // Step 3: Group chat owners by chat ID
        const ownersByChat = chatOwners.reduce((acc, owner) => {
            if (!acc[owner.chat_id]) {
                acc[owner.chat_id] = [];
            }
            acc[owner.chat_id].push(owner.user_id);
            return acc;
        }, {});

        // Step 4: Check if the userIdFromToken is an owner in all chats
        const unauthorizedChats = chatIds.filter(chatId => {
            const chatOwners = ownersByChat[chatId] || [];
            return !chatOwners.includes(userIdFromToken); // If the user is not an owner of this chat
        });

        // If there's any chat where the user is not an owner, return Unauthorized
        if (unauthorizedChats.length > 0) {
            return res.status(403).json({ error: `Unauthorized access to chat(s): ${unauthorizedChats.join(', ')}` });
        }

        // Step 5: Find the user to add to the chats
        const user = await getUserByCode(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Step 6: Add the user to each chat's participants
        await Promise.all(
            chats.map(async (chat) => {
                // Create a new ChatParticipant record for each chat
                await ChatParticipant.create({ chat_id: chat.id, user_id: user.employeeId });

                const joinMessage = await Message.create({
                    chat_id: chat.id,
                    sender_id: user.employeeId,
                    text_content: `${user.userfullname} joined the chat.`,
                    media_type: "join",  // 'join' as the media_type to indicate it's a join message
                    reply_to: null,
                });

                // Step 8: Emit the join message to the respective chat room
                const io = getIO();  // Assuming you have a method to get the socket instance
                console.log(`Emitting new message to chat_${chat.id}:`, joinMessage);
                io.to(`chat_${chat.id}`).emit('newMessage', joinMessage);

                // Step 9: Prepare the lastMessage object
                const lastMessage = {
                    chat_id: chat.id,
                    id: joinMessage.id,
                    text_content: joinMessage.text_content,
                    createdAt: joinMessage.createdAt,
                    sender_id: joinMessage.sender_id,
                    recipient_id: Number(joinMessage.recipient_id),
                    media_url: joinMessage.media_url,
                    media_type: joinMessage.media_type,
                    reply_to: joinMessage.reply_to
                };

                console.log(`Emitting last message to chat_${chat.id}:`, lastMessage);

                io.to(`chat_${chat.id}`).emit('updateLastMessage', lastMessage);

                // Optionally, store the last message for this chat (depending on your schema)
                
            })

            
        );

       

       

        console.log(`Emitting last message to chat_${chat.id}:`, lastMessage);

        io.to(`chat_${chat.id}`).emit('updateLastMessage', lastMessage);



        

        

        
        return res.status(201).json({status: 1, message: 'User added to chats successfully' });
    } catch (err) {
        console.error('Error adding user to chats:', err);
        return res.status(500).json({status: 0, error: 'Failed to add user', details: err.message });
    }
};



exports.sendPasswordResetEmail = async (req, res) => {
    const { userCred } = req.body;

    try {
        // 1. Find the user by email or username
        const user = await User.findOne({
            $or: [{ email: userCred }, { username: userCred }]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Create a reset token
        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } // Token expires in 1 hour
        );

        console.log("Generated reset token:", resetToken);  // Log the token to verify

        // 3. Generate a reset link
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        // 4. Send email with the reset link
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset",
            html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`
        });

        return res.status(201).json({ message: "Password reset link sent to your email." });
    } catch (error) {
        console.error("Error sending reset email:", error);
        res.status(500).json({ message: "Error sending password reset email" });
    }

}

exports.resetPassword = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    // console.log("Body", req.body);

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    try {
        // 1. Verify the reset token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        console.log("userId", userId);

        // 2. Find the user by ID
        const user = await User.findByPk(userId);
        if (!user) {
            console.log("No User!")
            return res.status(404).json({ message: "User not found." });
        }

        // 3. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);


        // 4. Update user's password
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password has been reset successfully." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Error resetting password." });
    }
}