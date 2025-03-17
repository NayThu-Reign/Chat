const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { Op, where } = require('sequelize');
const User = require('../models/User');
const { getIO } = require('../socket');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { now } = require('sequelize/lib/utils');
const Mention = require('../models/Mention');
const ChatParticipant = require('../models/ChatParticipant');
const HiddenChat = require('../models/HiddenChat');
const axios = require('axios');
const Reaction = require('../models/Reaction');


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
        // console.log("allUsers", allUsers); // Log the structure of allUsers
        const users = allUsers.staffs || []; // Ensure it's an array
        const user = users.find(user => user.employeeId === code);
        return user || null; 
    } catch (error) {
        console.error('Error filtering user by code:', error);
        return null;
    }
}


exports.addReactionToMessage = async (req, res) => {
  const { messageId, reactionType } = req.body;
  const userId = req.user?.staff_code; // Ensure `req.user` and `staff_code` exist

  // Validate input
  if (!messageId || !reactionType) {
      return res.status(400).json({ error: 'Message ID and reaction type are required' });
  }

  if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

 const message = await Message.findByPk(messageId);

  if(!message) {
    return res.status(404).json({ error: 'Message Not Found ' });

  }

  console.log("Request received with body:", req.body);

  try {
      // Fetch the user details
      const user = await getUserByCode(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      console.log("User found:", user);

      let reaction = null;

      // Check if the user has already reacted to this message
      const existingReaction = await Reaction.findOne({
          where: {
              message_id: messageId,
              user_id: userId,
          },
      });

      if (existingReaction) {
        if (existingReaction.reaction_type !== reactionType) {
          // Update the reaction type if it's different
          await Reaction.update(
            { reaction_type: reactionType, user_name: user.fullname }, // Updated fields
            { where: { message_id: messageId, user_id: userId } } // Where condition
          );
  
          // Fetch the updated reaction
          reaction = await Reaction.findOne({
            where: { message_id: messageId, user_id: userId },
          });
  
          console.log("Reaction updated:", reaction);
  
          // Emit the updated reaction
          const message = await Message.findOne({
            where: { id: messageId },
            attributes: ['chat_id'],
          });
  
          if (!message) {
            return res.status(404).json({ error: 'Message not found' });
          }
  
          const io = getIO();
          io.to(`chat_${message.chat_id}`).emit('updatedReaction', reaction);
  
          return res.status(200).json({status: 1, message: 'Reaction updated successfully', reaction });
        } else {
          console.log('User has already reacted with the same type.');
          return res.status(200).json({ status: 0, message: 'Reaction already exists with the same type', reaction: existingReaction });
        }
      }

      // Create a new reaction if the user hasn't reacted yet
      reaction = await Reaction.create({
          message_id: messageId,
          user_id: userId,
          reaction_type: reactionType,
          user_name: user.fullname, // Assuming user object has `fullname`
      });


      console.log('Reaction added:', reaction);

      const message = await Message.findOne({
        where: {
            id: messageId,
        },
        attributes: ['chat_id'], // Only fetch the fields you need
    });
    
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    const chat = await Chat.findOne({
        where: {
            id: message.chat_id,
        },
    });
    
    if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
    }
    

      
      const io = getIO();
       
      

      console.log(`Emitting new reaction to chat_${chat.id}:`, reaction);
      
      
      io.to(`chat_${chat.id}`).emit('newReaction', reaction);

      return res.status(201).json({status: 1, message: 'Reaction added successfully', reaction });
  } catch (error) {
      console.error('Error adding reaction:', error);
      return res.status(500).json({status: 0, error: 'Database query error', details: error.message });
  }
};

exports.removeReactionToMessage = async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user?.staff_code; // Ensure `req.user` and `staff_code` exist

  console.log("Request received with body:", req.body);


  

  // Validate input
  if (!messageId) {
    return res.status(400).json({ error: 'Message ID and reaction type are required' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

 const message = await Message.findByPk(messageId);

  if(!message) {
    return res.status(404).json({ error: 'Message Not Found ' });

  }


  try {
    // Fetch the user details
    const user = await getUserByCode(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log("User found:", userId);

    // Check if the reaction exists
    const existingReaction = await Reaction.findOne({
      where: {
        message_id: messageId,
        user_id: userId,
       
      },
    });

    if (!existingReaction) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    console.log("Existing reaction found:", existingReaction);

    // Delete the reaction
    await Reaction.destroy({
      where: {
        message_id: messageId,
        user_id: userId,
        
      },
    });

    console.log('Reaction deleted successfully.');

        const message = await Message.findOne({
      where: { id: messageId },
      attributes: ['chat_id'], // Only fetch the necessary field
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const chat = await Chat.findOne({
      where: { id: message.chat_id },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    
    // Emit the removal event to the chat room
    const io = getIO();
    io.to(`chat_${chat.id}`).emit('removeReaction', {
      messageId,  
      userId,
    });

    console.log(`Emitted reaction removal to chat_${chat.id}.`);

    return res.status(200).json({status: 1, message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return res.status(500).json({status: 0, error: 'Internal server error', details: error.message });
  }
};


exports.getReactionsForMessage = async (req, res) => {
  const userId = req.user.staff_code;
  const messageId = req.params.id;

  console.log("MessageId", messageId);

  try {
    // Retrieve all reactions for the message
    const reactions = await Reaction.findAll({
      where: { message_id: messageId },
    });

    if (!reactions || reactions.length === 0) {
      return res.status(200).json({ message: 'No reactions found', reactions: [] });
    }

    // Extract user IDs from reactions
    const userIds = reactions.map((reaction) => reaction.user_id);

    // Fetch user details
    const users = await getAllUsers(userIds);

    console.log("users", users);

    

    // Create a mapping of user_id -> user_fullname
    const userMap = users.staffs?.reduce((map, user) => {
      map[user.employeeId] = user.userfullname;
      return map;
    }, {});

    // Attach user_fullname to reactions
    const enrichedReactions = reactions.map((reaction) => ({
      ...reaction.toJSON(), // Convert Sequelize instance to plain object
      user_name: userMap[reaction.user_id] || "Unknown User", // Fallback if user not found
    }));

    console.log("Enriched Reactions:", enrichedReactions);
    return res.status(200).json({status: 1, message: 'Reactions', reactions: enrichedReactions });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return res.status(500).json({status: 0, error: 'Internal server error', details: error.message });
  }
};