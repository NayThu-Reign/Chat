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
const UserPhoto = require("../models/UserPhoto");
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

        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ error: 'Database query error', details: err.message });
    }
};

exports.updateUser = async (req, res) => {
    console.log("Body", req.body);
    const { user_photo } = req.body;
    const userId = req.user.staff_code;
    console.log("UserId", userId);
    const id = req.params.id;
    console.log("id", id);

    

    

    


    try {
        console.log("hi");
        const user = await getUserByCode(userId);

        console.log("hi1");


        console.log("UseR", user);

        if(!user) {
            return res.status(404).json({error: "User not found"});
        }

        if(user.employeeId !== userId) {
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
            const originalFileName = `${userId}_${Date.now()}_${user.userfullname}`; // Prefix with sender_id and timestamp for uniqueness
            const fullFilePath = path.join(file_path, originalFileName);
        
            await fsPromises.writeFile(fullFilePath, buffer);
            photo = `uploads/profiles/${year}/${month}/${originalFileName}`; // Use the original name for URL
        }

        console.log("Hellop Initial")

        const existingUser = await UserPhoto.findOne({
            where: {
                user_id: userId
            }
        })

        console.log('existingUser', existingUser);
        

        if (existingUser) {
            console.log("existing user")
            const updatedUser = await UserPhoto.update(
                {
                    photo: photo ? photo : existingUser.photo
                },
                {
                    where: {
                        user_id: userId // Ensure the correct record is updated
                    },
                    
                }
            );

            console.log("heeloooo", updatedUser);

            

            // const updatedUserDetails = updatedUser[1][0].dataValues;

            const updatedUserDetails = await UserPhoto.findOne({
                where: {
                  user_id: userId // Retrieve the updated record using the same `user_id`
                }
              });

            console.log("Updated User1", updatedUserDetails);
    
            console.log("Updated User2", updatedUser);

            
    
            const io = getIO();
            io.emit('userPhoto', updatedUserDetails);
    
    
            return res.status(201).json({status: 1, message: "Updated Successfully", updatedUser})
        } else {
            console.log("We here");
            const updatedUser = await UserPhoto.create({
                user_id: userId,
                photo: photo || existingUser.photo, // Use the new photo or fallback to existingUser.photo
            });
            
    
            console.log("Updated User", updatedUser);
    
            const io = getIO();
            io.emit('userPhoto', updatedUser);

            
    
    
            
            return res.status(201).json({status: 1, message: "Updated Successfully", createdUser})
        }
    } catch (error) {
        return res.status(500).json({ status: 0, error: 'Something wrong', details: error });
    }

}


exports.getUserPhotos = async (req, res) => {
    const userId = req.user.staff_code;
    
   
  
    try {
      // Retrieve all reactions for the message
      const photos = await UserPhoto.findAll();

      console.log("photos", photos);

    
  
      if (!photos || photos.length === 0) {
        return res.status(200).json({ message: 'No photos found', photos: [] });
      }
  
      // Extract user IDs from reactions
   
      return res.status(200).json({status: 1, photos });
    } catch (error) {
      console.error('Error fetching photos:', error);
      return res.status(500).json({ status: 0, error: 'Internal server error', details: error.message });
    }
  };