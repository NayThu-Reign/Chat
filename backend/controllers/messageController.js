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


exports.messageDetail = async(req, res) => {
    const id = req.params.id;

    try {
        const message = await Message.findByPk(id);

        if (!message) {
            return res.status(404).json({ error: 'Message does not exist' });
        }

        return res.json({status: 1, message});
    } catch (err) {
        return res.status(500).json({status: 0,  error: 'Database query error', details: err });
    }
}



exports.createMessage = async(req, res ) => {
    console.log("Request Body:", req.body);
    const { chat_id, recipient_id, text_content, isGroupChat, media_type, media, file_name, media_gif, reply_to, mentions } = req.body;
    // console.log("ChatId", chat_id);
    
    
    
    const sender_id = req.user.staff_code;


    

    
    if(!sender_id) {
        return res.status(401).json({error: "sender_id required"})
    }

    

    try {    

        const recipient = await getUserByCode(recipient_id);
        // console.log("Recipient:", recipient);

        if(recipient_id) {
            if( !recipient ) {
                return res.status(404).json({ error: "recipient not found" });
            }
    
            
    
        }

        
        
        
        let chat;

        

       
        if (chat_id) {
            if (!isGroupChat) {
                // For individual chats, find the chat by recipient_id or sender_id
                chat = await Chat.findOne({
                    where: { id: chat_id },
                    include: [
                        {
                            model: ChatParticipant, // Include ChatParticipant instead of User
                            as: "chatParticipants", // Adjust alias if necessary
                            // attributes: [''], // Get recipient_id and sender_id
                        },
                    ],
                });
            } else {
                // For group chats, the logic might be similar, depending on the requirements
                chat = await Chat.findOne({
                    where: { id: chat_id },
                    include: [
                        {
                            model: ChatParticipant, // Include ChatParticipant instead of User
                            as: "chatParticipants",
                            attributes: ['user_id'],
                        },
                    ],
                });
            }
        
            if (!chat) {
                return res.status(404).json({ error: "Chat not found" });
            }
        } else {

            if (!chat_id) {
                // Step 1: Find all chats the sender participates in
                const senderChats = await ChatParticipant.findAll({
                    where: { user_id: sender_id },
                    // attributes: ['chat_id'],
                });
            
                // Extract chat_ids for the sender
                const senderChatIds = senderChats.map(chat => chat.chat_id);

                console.log("senderChatIds", senderChatIds);
            
                // Step 2: Find a common chat where recipient also participates
                const commonChat = await ChatParticipant.findOne({
                    where: {
                        chat_id: { [Op.in]: senderChatIds }, // Chats that the sender is in
                        user_id: recipient_id, 
                    },
                    include: [
                        {
                            model: Chat,
                            as: 'chat', // Alias must match the Sequelize association
                            where: { is_group_chat: false }, // Ensure it's not a group chat
                            attributes: ['id', 'name', 'is_group_chat', 'createdAt', 'photo', 'muted_by'],
                        },
                    ],
                });

                
            
                console.log('CommonChat:', commonChat);
            
                // Step 3: Use existing chat or create a new one
                if (commonChat && commonChat.chat) {
                    chat = commonChat.chat; // Use the existing chat
                } else {
                    // Create a new chat if no common chat exists
                    chat = await Chat.create({ is_group_chat: false });
                    console.log("chhhat", chat);
            
                    // Add both sender and recipient as participants
                    await ChatParticipant.create({ chat_id: chat.id, user_id: sender_id });
                    await ChatParticipant.create({ chat_id: chat.id, user_id: recipient_id });
            
                    const io = getIO();
                    io.emit('newChat', { chatId: chat.id });
                }
            
                console.log('HIIII', chat);
            }

        }

        const recipientParticipant = await ChatParticipant.findOne({
            where: {
                user_id: sender_id,
                chat_id: chat.id,
            },
        });

        console.log("rescipientParticipant", recipientParticipant);
        
        // If recipient is not a participant or has left (leftAt is not null)
        if (!recipientParticipant || recipientParticipant.left_at !== null) {
            console.log("HiiiiiNOOOO")
            return res.status(403).json({ error: "You cannot message  as you have left the chat." });
        }

        

        // Reset 'hiddenBy' array when sending a new message
       await HiddenChat.update(
            { hidden: false },
            { where: { chat_id: chat.id } }
        );


        
            
        

        let media_url = null;
        if (media) {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const file_path = path.join(process.cwd(), 'public', `uploads/messages/${year}/${month}`);
        
            // Ensure directory exists
            if (!fs.existsSync(file_path)) {
                fs.mkdirSync(file_path, { recursive: true });
                console.log(`Created directory: ${file_path}`);
            }
        
           
            const base64Content = media.split(';base64,').pop();
            const buffer = Buffer.from(base64Content, 'base64');
        
            // Use the original file name (sanitize if necessary)
            const originalFileName = `${sender_id}_${Date.now()}_${file_name}`; // Prefix with sender_id and timestamp for uniqueness
            const fullFilePath = path.join(file_path, originalFileName);
        
            await fsPromises.writeFile(fullFilePath, buffer);
            media_url = `uploads/messages/${year}/${month}/${originalFileName}`; // Use the original name for URL
        }

        let replyMessage = null;

        if (reply_to) {
            replyMessage = await Message.findByPk(reply_to);
            if (!replyMessage) {
                return res.status(404).json({ error: "Reply message not found" });
            }
        }

        const io = getIO();
  let mentionedFullNames = [];
let hasAllMention = false;


if (text_content) {
    const mentionRegex = /@([^,]+),?/g;
    const mentionMatches = text_content.matchAll(mentionRegex) ?? [];

    for (const match of mentionMatches) {
        const fullName = match[1]
            .trim()
            .replace(/\s+/g, ' '); // Normalize whitespace
        
        if (fullName) {
            mentionedFullNames.push(fullName);
        }
    }

    hasAllMention = mentionedFullNames.some(name => 
        name.toLowerCase() === 'all'
    );
}

console.log("Mentioned full names:", mentionedFullNames);

        
        let mentionedUserIds = [];
                
        if (hasAllMention) {
            if (!chat.is_group_chat) {
                return res.status(400).json({ error: "@all can only be used in group chats" });
            }
        
            const participants = await ChatParticipant.findAll({
                where: { 
                    chat_id: chat.id,
                    user_id: { [Op.ne]: sender_id } 
                }
            });
            mentionedUserIds = participants.map(p => p.user_id);
        } else {
            // Process full name mentions
            for (const fullName of mentionedFullNames) {
                const user = await getUserByUsername(fullName); // Changed to full name lookup
                if (user) {
                    const isParticipant = await ChatParticipant.findOne({
                        where: { 
                            chat_id: chat.id,
                            user_id: user.employeeId 
                        }
                    });
                    if (isParticipant) {
                        mentionedUserIds.push(user.employeeId);
                    }
                }
            }
        }
        
        // Remove duplicates and invalid users
        mentionedUserIds = [...new Set(mentionedUserIds.filter(Boolean))];
        
        // Create message with mentions
        const newMessage = await Message.create({
            chat_id: chat.id,
            sender_id,
            recipient_id,
            text_content,
            media_url: media ? media_url : media_gif,
            media_type,
            reply_to: reply_to ? reply_to : null,
            mentions: JSON.stringify(mentionedUserIds)
        });

        if (mentionedUserIds.length > 0) {
            // Send notifications to mentioned users
            mentionedUserIds.forEach(userId => {
                io.to(`user_${userId}`).emit('newMention', {
                    messageId: newMessage.id,
                    chatId: chat.id,
                    mentionedBy: sender_id
                });
            });

            // Update unread mention counts
            // await ChatParticipant.update({
            //     unread_mentions: sequelize.literal('unread_mentions + 1')
            // }, {
            //     where: {
            //         chat_id: chat.id,
            //         user_id: mentionedUserIds
            //     }
            // });
        }


        if (reply_to) {
            const originalMessage = await Message.findByPk(reply_to);
        
            if (originalMessage) {
                try {
                    // Fetch sender and recipient details from the external API
                    const [sender, recipient] = await Promise.all([
                        getUserByCode(originalMessage.sender_id), // Assuming sender_code exists in the message
                        getUserByCode(originalMessage.recipient_id), // Assuming recipient_code exists in the message
                    ]);
        
                    // Attach fetched data to originalMessage
                    originalMessage.dataValues.sender = sender
                        ? {
                            
                              username: sender.userfullname,
                           
                          }
                        : null;
        
                    originalMessage.dataValues.recipient = recipient
                        ? {
                            //   id: recipient.id,
                              username: recipient.userfullname,
                            //   active: recipient.active,
                            //   logoutTime: recipient.logoutTime,
                              position: recipient.position,
                              departmentName: recipient.departmentName,
                          }
                        : null;
        
                    // Attach the enriched originalMessage to the new message
                    newMessage.originalMessage = originalMessage;
                } catch (error) {
                    console.error('Error fetching sender or recipient:', error);
                    newMessage.dataValues.originalMessage = {
                        error: 'Unable to fetch sender or recipient details',
                    };
                }
            }
        }
        

        
        
        // Notify mentioned users

        await sequelize.query(
            `UPDATE chats SET updatedAt = NOW() WHERE id = :id`,
            { replacements: { id: chat.id } }
        );

        // console.log("Update result for chat updatedAt:", updateResult);


        const updatedChat = await Chat.findByPk(chat.id);
        console.log("Updated chat details:", updatedChat);

        

        console.log("MediaType", newMessage.media_type);

       
      

        console.log(`Emitting new message to chat_${chat.id}:`, newMessage);

        
        
        
        io.to(`chat_${chat.id}`).emit('newMessage', newMessage);
       
    //     const sender = await User.findByPk(newMessage.sender_id)
    //     const notiChat = await Chat.findByPk(newMessage.chat_id, {
    //         include: [
    //             {
    //                 model: User,
    //                 as: 'participants',
    //                 include: [
                       
    //                     {
    //                         model: Chat,
    //                         as: 'ownedChats',
    //                     },
    //                 ],
    //                 attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
    //                 through: { attributes: [] }, // Don't include the junction table fields
    //             },
    //         ]
    //     });

    //     console.log("NotiChat", notiChat);
    //     console.log("CHAT", chat);
    //     console.log("sender and recipient", sender_id, recipient_id)


        
    //     const mutedBy = JSON.parse(notiChat.mutedBy || '[]');

    //     console.log('MutedBy', mutedBy);

    //     if(mutedBy.includes(newMessage.recipient_id)) {
    //         console.log("Hey Yo");
    //     }

    //     // Check if the user ID is not in mutedBy, and if not, emit the message
    //    if(!notiChat.isGroupChat) {
    //         if (!mutedBy.includes(Number(newMessage.recipient_id))) {
    //             io.emit('notiMessage', newMessage, sender, notiChat);
    //         }
    //    } else {
    //             io.emit('notiMessage', newMessage, sender, notiChat);
    //    }

    

       const sender = await getUserByCode(newMessage.sender_id);

       // Fetch the chat details
       const notiChat = await Chat.findByPk(newMessage.chat_id);

       if (notiChat) {
           // Fetch participants from ChatParticipants
           const chatParticipants = await ChatParticipant.findAll({
               where: { chat_id: newMessage.chat_id },
           });

           // Fetch participant details using their staff codes
           const participantDetails = await Promise.all(
               chatParticipants.map(participant => getUserByCode(participant.user_id))
           );

           console.log("participantdetails", participantDetails)

           // Attach participant details to notiChat
           notiChat.dataValues.participants = participantDetails.map(participant => ({
               employeeId: participant?.employeeId,
               username: participant?.username,
               active: participant?.active,
               logoutTime: participant?.logoutTime,
               position: participant?.position,
               user_photo: participant?.user_photo,
           }));
       }

       
       console.log("NotiChat", notiChat);
       console.log("sender and recipient", newMessage.sender_id, newMessage.recipient_id);

       // Parse mutedBy
       const mutedBy = JSON.parse(notiChat?.mutedBy || '[]');
       console.log('MutedBy', mutedBy);

       // Check if the recipient is muted
       if (mutedBy.includes(newMessage.recipient_id)) {
           console.log("Hey Yo");
       }

       // Emit the message if the recipient is not muted (for private chats) or emit directly (for group chats)
       if (!notiChat?.isGroupChat) {
           if (!mutedBy.includes(newMessage.recipient_id)) {
               io.emit('notiMessage', newMessage, sender, notiChat);
           }
       } else {
           io.emit('notiMessage', newMessage, sender, notiChat);
       }


       

      
      

        const lastMessage = {
            chat_id: chat.id,
            id: newMessage.id,
            text_content: newMessage.text_content,
            createdAt: newMessage.createdAt,
            sender_id: newMessage.sender_id,
            recipient_id: Number(newMessage.recipient_id),
            media_url: newMessage.media_url,
            media_type: newMessage.media_type,
            reply_to: newMessage.reply_to
        };

        const chatId = chat.id

        io.to(`chat_${chat.id}`).emit('updateLastMessage', lastMessage);

        console.log("NewMessage", chat.id);


        
        
        return res.status(201).json({status: 1, newMessage});
    } catch (err) {
        console.error('Error creating message:', err);
        return res.status(500).json({ status: 0, error: 'Database error', details: err });
    }
}

exports.createFileMessage = async (req, res) => {
    console.log("Request BodyOne:", req.body);

    const { chat_id, recipient_id, isGroupChat, file_name, reply_to } = req.body;
    const sender_id = req.user.staff_code;


    


    if (!sender_id) {
        return res.status(401).json({ error: "Sender ID is required" });
    }

    // Check if file is uploaded
    if (!req.file) {
        return res.status(400).json({ error: "File is required for media messages" });
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");

    const media_url = `uploads/messages/${year}/${month}/${req.file.filename}`;
    const media_type = req.file.mimetype.startsWith("image/") ? "image" : "file";

    try {
        // Validate recipient if `isGroupChat` is false and `recipient_id` is provided
        if (!isGroupChat && recipient_id) {
            const recipient = await User.findByPk(Number(recipient_id));
            if (!recipient) {
                return res.status(404).json({ error: "Recipient not found" });
            }
            if (!recipient.emailVerified) {
                return res.status(400).json({ error: "Recipient's email is not verified" });
            }
        }

        
        // Find or create the chat
        let chat;
        if (chat_id) {
            console.log("Chat exists, fetching it");

            const participantCondition = isGroupChat
                ? { user_id: { [Op.eq]: sender_id } } // Group chat: check sender only
                : { user_id: { [Op.in]: [sender_id, recipient_id] } }; // 1-to-1 chat: check sender and recipient

            console.log("hhiii", participantCondition)

            chat = await Chat.findOne({
                where: {
                    id: Number(chat_id),
                },
                include: [
                    {
                        model: ChatParticipant,
                        as: "chatParticipants",
                        where: participantCondition,
                    },
                ],
            });

            console.log("heeell")
            console.log("heeell1", chat)

            if (!chat) {
                return res.status(404).json({ error: "Chat not found" });
            }

            
            console.log("Chat found:", chat);
        } else {
            console.log("Creating a new chat");

            chat = await Chat.create({ isGroupChat });

            // Add participants
            // const sender = await User.findByPk(Number(sender_id));
            const sender = await getUserByCode(sender_id)
            const participants = [sender];
            if (!isGroupChat) {
                // const recipient = await User.findByPk(Number(recipient_id));
                const recipient = await getUserByCode(recipient_id);
                participants.push(recipient);
                await ChatParticipant.create({ chat_id: chat.id, user_id: sender_id });
                await ChatParticipant.create({ chat_id: chat.id, user_id: recipient_id });
            }
    
            // await chat.addParticipants(participants);

            // Emit new chat event
            const io = getIO();
            io.emit("newChat", { chatId: chat.id });
        }

        // Handle reply message if applicable
        let replyMessage = null;
        if (reply_to) {
            replyMessage = await Message.findByPk(reply_to);
            if (!replyMessage) {
                return res.status(404).json({ error: "Reply message not found" });
            }
        }

        await sequelize.query(
            `UPDATE chats SET updatedAt = NOW() WHERE id = :id`,
            { replacements: { id: chat.id } }
        );

        // Save the new file message
        const newMessage = await Message.create({
            chat_id: chat.id,
            sender_id,
            recipient_id: isGroupChat ? null : recipient_id, // Set `recipient_id` to null for group chats
            media_url,
            file_name,
            media_type,
            reply_to: reply_to || null,
        });

        // Emit socket events for the new message
        const io = getIO();
        io.to(`chat_${chat.id}`).emit("newMessage", newMessage);

        // Emit notification for the last message
        const lastMessage = {
            chat_id: chat.id,
            id: newMessage.id,
            media_url: newMessage.media_url,
            file_name: newMessage.file_name,
            media_type: newMessage.media_type,
            createdAt: newMessage.createdAt,
            sender_id: newMessage.sender_id,
            recipient_id: newMessage.recipient_id,
        };
        io.to(`chat_${chat.id}`).emit("updateLastMessage", lastMessage);

        console.log("File message created successfully:", newMessage);

        return res.status(201).json({status: 1, newMessage});
    } catch (err) {
        console.error("Error creating file message:", err);
        return res.status(500).json({status: 0, error: "Internal server error", details: err });
    }
};


exports.deleteMessage = async(req, res) => {
    const { chatId } = req.params; 
    const { messageId } = req.body;
    const userIdFromToken = req.user.staff_code;


    try {
        
        const chat = await Chat.findByPk(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'chat not found' });
        }

        const message = await Message.findByPk(messageId);

        if (!message) {
            return res.status(404).json({ error: 'chat not found' });
        }


        if(userIdFromToken !== message.sender_id) {
            return res.status(403).json({ error: 'Unauthorized to delete message' });

        }

        // Find users by IDs

        // Add users to the chat (many-to-many association)
        await message.update({ 
            isDeletedForEveryone: true, 
            deletedByUserId: userIdFromToken,
            reply_to: null,
            text_content: null, // Optionally, clear the content if no longer needed
            media_url: null,    // Clear any media URL
            media_type: null    // Clear any media type
        });


        const lastMessageData = await Message.findOne({
            where: { chat_id: chatId },
            order: [['createdAt', 'DESC']]
        });

        console.log("HelloLastMessage", lastMessageData);

        const lastMessage = lastMessageData ? {
            chat_id: Number(chatId),
            id:lastMessageData.id,
            text_content: lastMessageData.text_content,
            createdAt: lastMessageData.createdAt,
            sender_id: lastMessageData.sender_id,
            recipient_id: lastMessageData.recipient_id,
            media_url: lastMessageData.media_url,
            media_type: lastMessageData.media_type,
        } : null;

        console.log("LastMessage", lastMessage);

        const io = getIO();
        io.to(`chat_${chatId}`).emit('deleteMessage', { chatId, messageId });
        io.emit('updateLastMessage', lastMessage, messageId);

        return res.status(200).json({status: 1, message: 'Message deleted from chat successfully' });
    } catch (err) {
        console.error('Error adding users to chat:', err);
        return res.status(500).json({status: 0, error: 'Failed to add users', details: err.message });
    }
}

exports.pinMessage = async (req, res) => {
    const { messageId } = req.params; // Assume the messageId is passed as a parameter
    
    try {
        // Find the message by ID
        const message = await Message.findByPk(messageId);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Get the chat_id from the message
        const chatId = message.chat_id;

        // Set `pin` to false for all other messages in the same chat
        await Message.update({ pin: false }, {
            where: {
                chat_id: chatId,
                id: {
                    [Op.ne]: messageId // Exclude the message being pinned
                }
            }
        });

        // Set `pin` to true for the specified message
        message.pin = true;
        await message.save();

        const io = getIO();

        // Emit the 'pinMessage' event to all clients in the same chat room
        io.to(`chat_${chatId}`).emit('pinMessage', {
            chatId,
            pinnedMessageId: messageId,
        });


        res.status(200).json({ status: 1, message: 'Message pinned successfully', pinnedMessage: message });
    } catch (error) {
        console.error('Error pinning message:', error);
        res.status(500).json({ status: 0, message: 'An error occurred while pinning the message' });
    }
}

exports.unPinMessage = async (req, res) => {
    const { messageId } = req.params; // Assume the messageId is passed as a parameter
    
    try {
        // Find the message by ID
        const message = await Message.findByPk(messageId);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Get the chat_id from the message
        const chatId = message.chat_id;

        // Set `pin` to false for all other messages in the same chat
        await Message.update({ pin: false }, {
            where: {
                chat_id: chatId,
                id: {
                    [Op.ne]: messageId // Exclude the message being pinned
                }
            }
        });

        // Set `pin` to true for the specified message
        message.pin = false;
        await message.save();

        const io = getIO();

        // Emit the 'pinMessage' event to all clients in the same chat room
        io.to(`chat_${chatId}`).emit('pinMessage', {
            chatId,
            pinnedMessageId: messageId,
        });


        res.status(200).json({ status: 1, message: 'Message unpinned successfully', pinnedMessage: message });
    } catch (error) {
        console.error('Error pinning message:', error);
        res.status(500).json({ status: 0, message: 'An error occurred while pinning the message' });
    }
}

exports.markReadMessage = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.user.staff_code;

    try {
        // Step 1: Fetch messages with chat_id
        const messages = await Message.findAll({
            where: { id: messageIds },
            attributes: ['id', 'chat_id', 'sender_id', 'viewedBy', 'read']
        });

        if (messages.length === 0) {
            return res.status(404).json({ message: 'No messages found' });
        }

        // Step 2: Extract unique chat IDs
        const chatIds = [...new Set(messages.map((msg) => msg.chat_id))];

        // Step 3: Fetch chats and their participants
        const chats = await Chat.findAll({
            where: { id: chatIds },
            include: [{
                model: ChatParticipant,
                as: 'chatParticipants',
                attributes: ['user_id']
            }]
        });

        console.log("chatParticipants", chats)

        // Step 4: Iterate over messages to update view status
        for (let message of messages) {
            if (message.sender_id === userId) continue; // Skip if user is sender

            // Parse viewedBy JSON string into an array
            let viewedBy = JSON.parse(message.viewedBy || '[]');

            // Check if the current user has already viewed this message
            if (!viewedBy.includes(userId)) {
                viewedBy.push(userId); // Add user ID to viewedBy
                message.viewedBy = JSON.stringify(viewedBy); // Save as JSON string
                await message.save();
            }

            // Find the chat for the current message
            const chat = chats.find((chat) => chat.id === message.chat_id);
            console.log("CHAt", chat);
            if (!chat) continue; // Skip if chat not found

            // Extract participant IDs, excluding the sender
            const participantIds = chat.chatParticipants.map((p) => p.user_id).filter((id) => id !== message.sender_id);

            // Check if all other participants have viewed the message
            const allViewed = participantIds.every((participantId) => viewedBy.includes(participantId));

            // Mark the message as read if all participants have viewed it
            if (allViewed) {
                message.read = true;
                await message.save();
            }

            // Emit 'readMessage' event to the chat room
            const io = getIO();
            const chatId = message.chat_id;
            io.to(`chat_${chatId}`).emit('readMessage', {
                messageId: message.id,
                chatId,
                userId,
            });
        }

        res.status(200).json({status: 1, message: 'Messages view status updated' });
    } catch (error) {
        console.error('Error updating message views:', error);
        res.status(500).json({ status: 0, error: 'Error updating message views' });
    }
};


exports.editMessage = async (req, res) => {
    const messageId = req.params.id;

    const userId = req.user.staff_code;
    const { text_content } = req.body;

    console.log("Request Body", req.body);
    console.log("messageId", messageId);

    try {
        const message = await Message.findByPk(messageId); // Await the find operation
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        if (message.sender_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to edit' });
        }

        // Update the message content
        await message.update({ text_content, edited: true });

        const io = getIO();
        io.to(`chat_${message.chat_id}`).emit('editedMessage', message);

        return res.status(200).json({ status: 1, message: 'Message updated successfully', data: message });
    } catch (error) {
        return res.status(500).json({ status: 0, error: 'Error editing message' });
    }
};

exports.deleteForMySelfMessage = async ( req, res) => {
    const messageId = req.params.id;
    const userId = req.user.staff_code;

    try {
        const message = await Message.findByPk(messageId);

        // console.log("DeletedBy", message.deletedBy);

        if(!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        

        const deletedBy = JSON.parse(message.deletedBy || '[]');

        if(!deletedBy.includes(userId)) {
            deletedBy.push(userId);
            await message.update({ deletedBy: JSON.stringify(deletedBy) });
            console.log("MESSAGE", message);
        }

        res.status(200).json({ status: 1, message: "Message deleted for myself" });
    } catch (error) {
        console.error('Error in deleting message for self:', error);
        return res.status(500).json({ status: 0, error: 'Error deleting message for myself' });
        
    }

}

exports.forwardMessage = async ( req, res) => {
    const { originalMessageId, chatIds, senderId } = req.body;
    const userId = req.user.staff_code;


    try {
        const originalMessage = await Message.findByPk(originalMessageId);
        if(!originalMessage) {
            return res.status(404).json({ error: "Message not found"})
        }

        const io = getIO();

        for (const chatId of chatIds) {
            // Fetch chat details to determine if it's a group or direct chat
            const chat = await Chat.findByPk(chatId, { include: [{model: ChatParticipant,
                as: 'chatParticipants',}] });
            if (!chat) continue; // Skip if chat doesn't exist

            let recipientId = null;
            if (!chat.isGroupChat) {
                // If not a group chat, find the recipient other than the sender
                const recipient = chat.chatParticipants.find(participant => participant.id !== userId);
                recipientId = recipient ? recipient.id : null;
            }

            // Create the forwarded message for each chat
            const forwardedMessage = await Message.create({
                chat_id: chatId,
                sender_id: userId,
                recipient_id: recipientId,
                text_content: originalMessage.text_content,
                media_url: originalMessage.media_url,
                media_type: originalMessage.media_type,
                forwarded_from: originalMessageId
            });

            // Emit the new message event to each chat room
            console.log(`Emitting new message to chat_${chatId}:`, forwardedMessage);

            io.to(`chat_${chat.id}`).emit('newMessage', forwardedMessage);

            console.log("LastMessageInitial")

            // Prepare and emit the last message update
            const lastMessage = {
                chat_id: chat.id,
                id: forwardedMessage.id,
                text_content: forwardedMessage.text_content,
                createdAt: forwardedMessage.createdAt,
                sender_id: forwardedMessage.sender_id,
                recipient_id: forwardedMessage.recipient_id,
                media_url: forwardedMessage.media_url,
                media_type: forwardedMessage.media_type,
            };

            console.log("lastMessage", lastMessage)
            console.log(`Emitting last message to chat_${chat.id}:`, lastMessage);
            io.emit('updateForwardLastMessage', lastMessage );

        }

        return res.status(200).json({ status: 1, message: 'Message forwarded successfully' });


    } catch (error) {
        return res.status(500).json({ status: 0, error: 'Error forwarding message'})
    }
}


exports.addReactionToMessage = async (req, res) => {
    const { messageId, reactionType } = req.body;
    console.log("Body", req.body);
    const userId = req.user.staff_code;

    try {
        // First, check if the user has already reacted to this message
        const existingReaction = await Reaction.findOne({
          where: {
            message_id: messageId,
            user_id: userId,
          },
        });

        
        

        const user = getUserByCode(userId);
    
        if (existingReaction) {
          console.log('User has already reacted to this message');
          return; // Optionally, update the reaction if needed
        }
    
        // Create a new reaction if the user hasn't reacted yet
        const reaction = await Reaction.create({
          message_id: messageId,
          user_id: userId,  // Store the user identifier (e.g., employeeId)
          reaction_type: reactionType,
          user_name: user.fullname,  // Optionally store the user's name if needed
        });
    
        console.log('Reaction added:', reaction);
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
}

exports.getReactionsForMessage = async (req, res) => {
    const userId = req.user.staff_code;
    const messageId = req.body

    
    

    console.log("MessageId", messageId);

    try {
        // Retrieve all reactions for the message
        const reactions = await Reaction.findAll({
          where: { message_id: messageId },
        });
    
        console.log('Reactions for message:', reactions);
        return reactions;
      } catch (error) {
        console.error('Error fetching reactions:', error);
      }
}