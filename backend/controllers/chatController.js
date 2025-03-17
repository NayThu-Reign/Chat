const express = require('express');
const axios = require('axios');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { getIO } = require('../socket');

// const { Op } = require('sequelize');
const { Sequelize, Op, where } = require('sequelize');
const HiddenChat = require('../models/HiddenChat');
const ChatParticipant = require('../models/ChatParticipant');
const { now } = require('sequelize/lib/utils');
const ChatOwner = require('../models/ChatOwner');
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
        const users = allUsers.staffs || []; // Ensure it's an array
        const user = users.find(user => user.employeeId === code);
        return user || null;
    } catch (error) {
        console.error('Error filtering user by code:', error);
        return null;
    }
}

async function getUsersByCodes(codes) {
    try {
        const allUsers = await getAllUsers();
        const users = allUsers.staffs || []; // Ensure it's an array
        
        // Filter the users whose `employeeId` is in the `codes` array
        const matchedUsers = users.filter(user => codes.includes(user.employeeId));
        
        return matchedUsers; // Return the array of matched users
    } catch (error) {
        console.error('Error filtering users by codes:', error);
        return [];
    }
}


// Controller function to fetch all chats for a logged-in user
// exports.getAllChats = async (req, res) => {
//     const userId = req.user.id;

   

//     try {
//         // Fetch all chats where the user is a participant
//         const chats = await Chat.findAll({
//             include: [
//                 {
//                     model: User,
//                     as: 'participants',
//                     // No filter on userId, we want all participants
//                     attributes: ['id', 'username', 'active', 'logoutTime', 'user_photo'],
//                     through: { attributes: [] }, // Don't include the junction table fields
//                 },
//                 {
//                     model: Message,
//                     as: 'messages',
//                     include: [
//                         {
//                             model: User,
//                             as: 'sender',
//                             attributes: ['id', 'username'],
//                         },
//                         {
//                             model: User,
//                             as: 'recipient',
//                             attributes: ['id', 'username'],
//                         }
//                     ],
//                     attributes: ['id', 'text_content', 'media_url', 'media_type', 'createdAt', 'sender_id', 'recipient_id', 'pin', 'viewedBy', 'read', 'edited'],
//                     order: [['createdAt', 'DESC']], // Order messages by date, descending
//                 },
//             ],
//             attributes: ['id', 'name', 'isGroupChat', 'createdAt', 'photo', 'hiddenBy'],
//             order: [
//                     ['updatedAt', 'DESC'] 
//             ],
            
           
//             where: Sequelize.literal(`EXISTS (SELECT 1 FROM chat_participants WHERE chat_participants.chat_id = Chat.id AND chat_participants.user_id = ${userId})`)
            
//         });

        

//         console.log("Chats", chats);

//         const visibleChats = chats.filter(chat => {
//             try {
//                 const hiddenBy = chat.hiddenBy ? JSON.parse(chat.hiddenBy) : []; // Safely parse or use an empty array
//                 return !hiddenBy.includes(userId); // Exclude if user ID is in the hiddenBy array
//             } catch (error) {
//                 console.error("Error parsing hiddenBy for chat:", chat.id, error);
//                 return true; // Include chat if hiddenBy parsing fails
//             }
//         });

        

//         // Process the chats to determine the name for one-on-one chats
//         const processedChats = visibleChats.map(chat => {
//             if (!chat.isGroupChat) {
//                 // Get the participants excluding the current user
//                 console.log("Chat", chat.participants.length);
//                 const otherParticipant = chat.participants.find(participant => participant.id !== userId);

//                 console.log("otherParticipant", otherParticipant);

//                 // If there's another participant, set the chat name to their username
//                 if (otherParticipant) {
//                     chat.dataValues.name = otherParticipant.username;
//                 } else {
//                     chat.dataValues.name = 'Unknown User'; // Fallback in case no other user is found
//                 }
//             }
//             return chat;
//         });

        

//         console.log("ProcessedChats", processedChats);
//         return res.status(200).json(status: 1, processedChats);
//     } catch (err) {
//         return res.status(500).json({ status: 0, error: 'Database query error', details: err.message });
//     }
// };



exports.getAllChats = async (req, res) => {
    const userId = req.user.staff_code;


    try {
        // Fetch all chat IDs that are hidden for the current user
        const hiddenChats = await HiddenChat.findAll({
            where: { user_id: userId, hidden: true },
            attributes: ['chat_id'],
        });

        // Extract the IDs into an array
        const hiddenChatIds = hiddenChats.map((entry) => entry.chat_id);

        const participantEntries = await ChatParticipant.findAll({
            where: { user_id: userId },
            attributes: ['chat_id', 'left_at', 'joined_at'],
        });

        const messageConditions = participantEntries.map(({ chat_id, left_at, joined_at }) => {
            if (left_at) {
                return {
                    chat_id,
                    createdAt: { [Sequelize.Op.lt]: left_at },
                };
            } else if (joined_at) {
                return {
                    chat_id,
                    createdAt: { [Sequelize.Op.gt]: joined_at },
                };
            } else {
                return { chat_id };
            }
        });

        // Combine message conditions
        const combinedMessageCondition = {
            [Sequelize.Op.or]: messageConditions,
        };

        // Fetch all chats where the user is a participant and not hidden
        const chats = await Chat.findAll({
           
            attributes: ['id', 'name', 'is_group_chat', 'createdAt', 'photo', 'muted_by'],
            order: [['updatedAt', 'DESC']],
            where: {
                [Sequelize.Op.and]: [
                    Sequelize.literal(`EXISTS (SELECT 1 FROM chat_participants WHERE chat_participants.chat_id = Chat.id AND chat_participants.user_id = '${userId}')`),
                    { id: { [Sequelize.Op.notIn]: hiddenChatIds } }, // Exclude hidden chats
                ],
            },
        });

        
        const chatsWithDetails = await Promise.all(
            chats.map(async (chat) => {
                // Fetch active participants for the current chat
                const chatParticipants = await ChatParticipant.findAll({
                    where: { chat_id: chat.id, left_at: null }, // Only include active participants
                    attributes: ['user_id'], // Fetch only the user_id field
                });

                const participantIds = chatParticipants.map((participant) => participant.user_id);

                // Fetch user details for each participant using getUserByCode
                const participants = await Promise.all(
                    participantIds.map(async (participantId) => {
                        const user = await getUserByCode(participantId);
                        return user; // Return the user details
                    })
                );

                // Fetch messages for the current chat
                const messages = await Message.findAll({
                    where: {
                        chat_id: chat.id,
                        ...(combinedMessageCondition),
                        
                    },
                    include: [
                        {
                            model: Message,
                            as: 'originalMessage',
                            attributes: ['id', 'text_content', 'createdAt'],
                        },
                    ],
                    attributes: [
                        'id',
                        'text_content',
                        'media_url',
                        'media_type',
                        'createdAt',
                        'sender_id',
                        'recipient_id',
                        'pin',
                        'read',
                        'viewed_by',
                        'edited',
                        'deleted_by',
                        'is_deleted_for_everyone',
                        'deleted_by_user_id',
                        'forwarded_from',
                    ],
                    order: [['createdAt', 'ASC']], // Order messages by date
                });

                // Collect all user IDs involved in the messages
                const userIds = new Set();
                messages.forEach((message) => {
                    if (message.sender_id) userIds.add(message.sender_id);
                    if (message.recipient_id) userIds.add(message.recipient_id);
                    if (message.deleted_by_user_id) userIds.add(message.deleted_by_user_id);
                });

                // Fetch user details for message-related users
                const users = await Promise.all(
                    [...userIds].map(async (userId) => {
                        const user = await getUserByCode(userId);
                        return { userId, user };
                    })
                );

                const userMap = users.reduce((acc, { userId, user }) => {
                    acc[userId] = user;
                    return acc;
                }, {});

                // Enrich messages with user details
                const enrichedMessages = messages.map((message) => ({
                    ...message.toJSON(),
                    sender: userMap[message.sender_id] || null,
                    recipient: userMap[message.recipient_id] || null,
                    deleted_by_user: userMap[message.deleted_by_user_id] || null,
                }));

                // Return chat with participants and messages
                return {
                    ...chat.toJSON(),
                    participants: participants.filter((user) => user !== null), // Filter out nulls
                    messages: enrichedMessages,
                };
            })
        );

        
        // Process the chats to determine the name for one-on-one chats
        const processedChats = chatsWithDetails.map((chat) => {
            if (!chat.isGroupChat) {
                // Get the participants excluding the current user
                console.log("chatlyyy", chat)
                const otherParticipant = chat.participants.find((participant) => participant.employeeId !== userId);

                // If there's another participant, set the chat name to their username
                chat.name = otherParticipant ? otherParticipant.userfullname : 'Unknown User';
            }
            return chat;
        });

        return res.status(200).json({status: 1, processedChats: processedChats});
    } catch (err) {
        console.error('Error fetching chats:', err);
        return res.status(500).json({ status: 0, error: 'Database query error', details: err.message });
    }

};

exports.getAllChatsOne = async (req, res) => {
    const userId = req.user.staff_code;


    try {
        // Fetch all chat IDs that are hidden for the current user
        const hiddenChats = await HiddenChat.findAll({
            where: { user_id: userId, hidden: true },
            attributes: ['chat_id'],
        });

        // Extract the IDs into an array
        const hiddenChatIds = hiddenChats.map((entry) => entry.chat_id);

        const participantEntries = await ChatParticipant.findAll({
            where: { user_id: userId },
            attributes: ['chat_id', 'left_at', 'joined_at'],
        });

        const messageConditions = participantEntries.map(({ chat_id, left_at, joined_at }) => {
            if (left_at) {
                return {
                    chat_id,
                    createdAt: { [Sequelize.Op.lt]: left_at },
                };
            } else if (joined_at) {
                return {
                    chat_id,
                    createdAt: { [Sequelize.Op.gt]: joined_at },
                };
            } else {
                return { chat_id };
            }
        });

        // Combine message conditions
        const combinedMessageCondition = {
            [Sequelize.Op.or]: messageConditions,
        };

        // Fetch all chats where the user is a participant and not hidden
        const chats = await Chat.findAll({
           
            attributes: ['id', 'name', 'is_group_chat', 'createdAt', 'photo', 'muted_by'],
            order: [['updatedAt', 'DESC']],
            
        });

        
        const chatsWithDetails = await Promise.all(
            chats.map(async (chat) => {
                // Fetch active participants for the current chat
                const chatParticipants = await ChatParticipant.findAll({
                    where: { chat_id: chat.id, left_at: null }, // Only include active participants
                    attributes: ['user_id'], // Fetch only the user_id field
                });

                const participantIds = chatParticipants.map((participant) => participant.user_id);

                // Fetch user details for each participant using getUserByCode
                const participants = await Promise.all(
                    participantIds.map(async (participantId) => {
                        const user = await getUserByCode(participantId);
                        return user; // Return the user details
                    })
                );

                // Fetch messages for the current chat
                const messages = await Message.findAll({
                    where: {
                        chat_id: chat.id,
                        ...(combinedMessageCondition),
                        
                    },
                    include: [
                        {
                            model: Message,
                            as: 'originalMessage',
                            attributes: ['id', 'text_content', 'createdAt'],
                        },
                    ],
                    attributes: [
                        'id',
                        'text_content',
                        'media_url',
                        'media_type',
                        'createdAt',
                        'sender_id',
                        'recipient_id',
                        'pin',
                        'read',
                        'viewed_by',
                        'edited',
                        'deleted_by',
                        'is_deleted_for_everyone',
                        'deleted_by_user_id',
                        'forwarded_from',
                    ],
                    order: [['createdAt', 'ASC']], // Order messages by date
                });

                // Collect all user IDs involved in the messages
                const userIds = new Set();
                messages.forEach((message) => {
                    if (message.sender_id) userIds.add(message.sender_id);
                    if (message.recipient_id) userIds.add(message.recipient_id);
                    if (message.deletedByUserId) userIds.add(message.deleted_by_user_id);
                });

                // Fetch user details for message-related users
                const users = await Promise.all(
                    [...userIds].map(async (userId) => {
                        const user = await getUserByCode(userId);
                        return { userId, user };
                    })
                );

                const userMap = users.reduce((acc, { userId, user }) => {
                    acc[userId] = user;
                    return acc;
                }, {});

                // Enrich messages with user details
                const enrichedMessages = messages.map((message) => ({
                    ...message.toJSON(),
                    sender: userMap[message.sender_id] || null,
                    recipient: userMap[message.recipient_id] || null,
                    deleted_by_user: userMap[message.deleted_by_user_id] || null,
                }));

                // Return chat with participants and messages
                return {
                    ...chat.toJSON(),
                    participants: participants.filter((user) => user !== null), // Filter out nulls
                    messages: enrichedMessages,
                };
            })
        );

        
        // Process the chats to determine the name for one-on-one chats
        const processedChats = chatsWithDetails.map((chat) => {
            if (!chat.isGroupChat) {
                // Get the participants excluding the current user
                console.log("chatlyyy", chat)
                const otherParticipant = chat.participants.find((participant) => participant.employeeId !== userId);

                // If there's another participant, set the chat name to their username
                chat.name = otherParticipant ? otherParticipant.userfullname : 'Unknown User';
            }
            return chat;
        });

        return res.status(200).json({status: 1, processedChats: processedChats});
    } catch (err) {
        console.error('Error fetching chats:', err);
        return res.status(500).json({status: 0, error: 'Database query error', details: err.message });
    }

};




// exports.chatDetail = async (req, res) => {
//     const chatId = req.params.id;
//     const userId = req.user.id; // Assume userId comes from authenticated user (JWT or similar)

   

//     try {
//         const chat = await Chat.findByPk(chatId, {
//             include: [
//                 {
//                     model: User,
//                     as: 'owner', // Fetch the owner details
//                     attributes: ['id', 'username', 'position','user_photo'], // Fetch only required fields
                   
//                 },
//                 {
//                     model: User,
//                     as: 'participants',
//                     include: [
                       
//                         {
//                             model: Chat,
//                             as: 'ownedChats',
//                         },
//                     ],
//                     attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
//                     through: { attributes: [] }, // Don't include the junction table fields
//                 },
//                 {
//                     model: Message,
//                     as: 'messages',
//                     include: [
//                         {
//                             model: User,
//                             as: 'sender',
//                             include: [
//                                 {
//                                     model: Chat,
//                                     as: 'ownedChats',
//                                 },
//                             ],
//                             attributes: ['id', 'username', 'active', 'logoutTime', 'user_photo'],
//                         },
//                         {
//                             model: User,
//                             as: 'recipient',
//                             include: [
//                                 {
//                                     model: Chat,
//                                     as: 'ownedChats',
//                                 },
//                             ],
//                             attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
//                         },
//                         {
//                             model: Message,
//                             as: 'originalMessage',
//                             include: [
//                                 {
//                                     model: User,
//                                     as: 'sender',
//                                     attributes: ['id', 'username', 'active', 'logoutTime','user_photo'],
//                                 },
//                                 {
//                                     model: User,
//                                     as: 'recipient',
//                                     attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
//                                 },
//                             ]
//                             // attributes: ['id', 'text_content', 'media_url', 'media_type', 'createdAt', 'sender_id'],
                            
//                         },
//                         {
//                             model: User,
//                             as: 'deletedByUser',  // Added this line
//                             attributes: ['id', 'username'], // Only fetching required attributes
//                         },
//                     ],
//                     attributes: ['id', 'text_content', 'media_url', 'media_type', 'createdAt', 'sender_id', 'recipient_id', 'pin', 'read', 'viewedBy', 'edited', 'deletedBy', 'isDeletedForEveryone', 'deletedByUserId', 'forwarded_from' ],
//                     order: [['createdAt', 'ASC']], // Order messages by date, descending
//                 },
//             ],
//             attributes: ['id', 'name', 'isGroupChat', 'createdAt', 'photo', 'mutedBy', 'ownerId'],
//             where: Sequelize.literal(`EXISTS (SELECT 1 FROM chat_participants WHERE chat_participants.chat_id = Chat.id AND chat_participants.user_id = ${userId})`)
//         });

//         // Check if the chat exists
//         if (!chat) {
//             return res.status(404).json({ error: 'Chat does not exist' });
//         }

//         // Check if the user is a participant in the chat
//         const isParticipant = chat.participants.some(participant => participant.id === userId);
//         if (!isParticipant) {
//             return res.status(403).json({ error: 'You do not have access to this chat' });
//         }

//         // If it's not a group chat, adjust the name to the other participant's username
//         if (!chat.isGroupChat) {
//             const otherParticipant = chat.participants.find(participant => participant.id !== userId);
//             chat.dataValues.name = otherParticipant ? otherParticipant.username : 'Unknown User';
//         }

        
//         return res.status(200).json(chat);

//     } catch (err) {
//         console.error('Error fetching chat details:', err);
//         return res.status(500).json({ error: 'Database query error', details: err.message });
//     }
// };



exports.chatDetail = async (req, res) => {
    const chatId = req.params.id;
    const userId = req.user.staff_code; // Assume userId comes from authenticated user (JWT or similar)
    console.log("CHatId", chatId);

    try {
        // Fetch `hidden` and `hidden_time` for the user in this chat
        const hiddenChatEntry = await HiddenChat.findOne({
            where: { chat_id: chatId, user_id: userId },
            attributes: ['hidden', 'hidden_time']
        });

        // If the chat is hidden for this user, return a 404 or an appropriate error
        // if (hiddenChatEntry && hiddenChatEntry.hidden) {
        //     return res.status(404).json({ error: 'Chat is hidden and not accessible' });
        // }

        // Determine the hidden_time if it exists
        const hiddenTime = hiddenChatEntry ? hiddenChatEntry.hidden_time : null;

        const participantEntry = await ChatParticipant.findOne({
            where: { chat_id: chatId, user_id: userId },
            attributes: ['leftAt', 'joinedAt']
        });

        const leftAt = participantEntry ? participantEntry.leftAt : null;
        const joinedAt = participantEntry ? participantEntry.joinedAt : null; // Extract joinedAt

        const messageWhereCondition = {};
        if (hiddenTime) {
            messageWhereCondition.createdAt = { [Op.gt]: hiddenTime }; // Only include messages after hidden_time
        }

        if (leftAt) {
            messageWhereCondition.createdAt = {
                ...messageWhereCondition.createdAt,
                [Op.lt]: leftAt // Messages before leftAt
            };
        }

        if (joinedAt) {
            messageWhereCondition.createdAt = {
                ...messageWhereCondition.createdAt,
                [Op.gt]: joinedAt,
            };
        }

        const chat = await Chat.findByPk(chatId, {
            
            attributes: ['id', 'name', 'isGroupChat', 'createdAt', 'photo', 'mutedBy'],
            where: Sequelize.literal(`EXISTS (SELECT 1 FROM chat_participants WHERE chat_participants.chat_id = Chat.id AND chat_participants.user_id = ${userId})`),
            
        });


        // Fetch chat details
        const chatOwners = await ChatOwner.findAll({
            where: { chat_id: chatId },
            attributes: ['user_id'], // Only fetch the user_id field
        });

        const ownerIds = chatOwners.map(owner => owner.user_id);

        // Fetch user details for each owner using getUserByCode
        const ownerAdmins = await Promise.all(
            ownerIds.map(async (userId) => {
                const user = await getUserByCode(userId);
                return user; // Return the user details
            })
        );

        // Filter out any null values (in case a user wasn't found)
        const filteredOwnerAdmins = ownerAdmins.filter(user => user !== null);

        const chatParticipants = await ChatParticipant.findAll({
            where: { chat_id: chatId, leftAt: null }, // Only include active participants
            attributes: ['user_id'], // Fetch only the user_id field
        });

        const participantIds = chatParticipants.map(participant => participant.user_id);

        // Fetch user details for each participant using getUserByCode
        const participants = await Promise.all(
            participantIds.map(async (userId) => {
                const user = await getUserByCode(userId);
                return user; // Return the user details
            })
        );

        // Filter out any null values (in case a user wasn't found)
        const filteredParticipants = participants.filter(user => user !== null);

        const messages = await Message.findAll({
            where: {
                chat_id: chatId,
                ...(Object.keys(messageWhereCondition).length > 0 ? messageWhereCondition : {}),
            },
            include: [
                {
                    model: Message,
                    as: 'originalMessage',
                    // attributes: ['id', 'text_content', 'createdAt'],
                },
                {
                    model: Reaction,
                    as: "reactions",
                    
                }
            ],
            attributes: [
                'id',
                'text_content',
                'media_url',
                'media_type',
                'createdAt',
                'sender_id',
                'recipient_id',
                'pin',
                'read',
                'viewedBy',
                'edited',
                'deletedBy',
                'isDeletedForEveryone',
                'deletedByUserId',
                'forwarded_from',
            ],
                
            order: [['createdAt', 'ASC']], // Order messages by date
        });

        // Fetch sender, recipient, and deletedBy user details
        const userIds = new Set();
        messages.forEach((message) => {
            if (message.sender_id) userIds.add(message.sender_id);
            if (message.recipient_id) userIds.add(message.recipient_id);
            if (message.deletedByUserId) userIds.add(message.deletedByUserId);
        });

        const users = await Promise.all(
            [...userIds].map(async (userId) => {
                const user = await getUserByCode(userId);
                return { userId, user };
            })
        );

        const userMap = users.reduce((acc, { userId, user }) => {
            acc[userId] = user;
            return acc;
        }, {});

        // Attach user details to messages
        const enrichedMessages = messages.map((message) => {
            const originalSender = message.originalMessage
                ? userMap[message.originalMessage.sender_id]
                : null;
        
            return {
                ...message.toJSON(),
                sender: userMap[message.sender_id] || null,
                recipient: userMap[message.recipient_id] || null,
                deletedByUser: userMap[message.deletedByUserId] || null,
                originalMessage: message.originalMessage
                    ? {
                          ...message.originalMessage.toJSON(),
                          sender: originalSender,
                      }
                    : null,
            };
        });


        // Add the ownerAdmins as part of the chat object
        
        

        // Check if the chat exists
        if (!chat) {
            return res.status(404).json({ error: 'Chat does not exist' });
        }

        // Check if the user is a participant in the chat
        const chatParticipant = await ChatParticipant.findOne({
            where: {
                chat_id: chatId,
                user_id: userId,
            },
        });
        
        if (!chatParticipant) {
            return res.status(403).json({ error: 'You do not have access to this chat' });
        }

        // If it's not a group chat, adjust the name to the other participant's username
        

        const chatDetail = {
            ...chat.toJSON(),
            ownerAdmins: filteredOwnerAdmins,
            participants: filteredParticipants,
            messages: enrichedMessages,
        };

        if (!chat.isGroupChat) {
            const otherParticipant = chatDetail.participants.find((participant) => participant.id !== userId);
            chat.dataValues.name = otherParticipant ? otherParticipant.username : 'Unknown User';
        }

        // return chatWithOwners;

        return res.status(200).json({status: 1, chatDetail});
    } catch (err) {
        console.error('Error fetching chat details:', err);
        return res.status(500).json({status: 0, error: 'Database query error', details: err.message });
    }
};


exports.createChat = async (req, res) => {
    const { name, isGroupChat, description, participantIds } = req.body;
    const userIdFromToken = req.user.staff_code;

    console.log("UserIdFromToken", userIdFromToken);

    try {
        // Create the new chat
        const newChat = await Chat.create({
            name,
            isGroupChat,
            description,
        });

        console.log("Chat created successfully");

        // Add the creator as a participant
        await ChatParticipant.create({
            chat_id: newChat.id,
            user_id: userIdFromToken
        })

        await ChatOwner.create({
            chat_id: newChat.id,
            user_id: userIdFromToken,
        })

       

        if (isGroupChat) {
            // Fetch verified participants
            const users = await getUsersByCodes(participantIds)

            if (users.length !== participantIds.length) {
                return res.status(400).json({ error: 'Some users have not verified their email' });
            }

            console.log("Verified participants:", users.map((user) => user.id));

            // Add participants to the group chat
            await Promise.all(
                users.map((user) =>
                    ChatParticipant.create({
                        chat_id: newChat.id,
                        user_id: user.employeeId
                    })
                )
            );

            console.log("Participants added to the group chat");

            // Optionally, make all participants admins/owners in a group chat
            
            console.log("Participants assigned as admins/owners");

            // Emit real-time notification for group chat creation
            const io = getIO();
            io.emit('newGroupChat', users);

            console.log("Real-time event emitted");
        }

        return res.status(201).json({status: 1, newChat});
    } catch (err) {
        console.error('Error creating chat:', err);
        return res.status(500).json({ status: 0, error: 'Database error', details: err });
    }
};


exports.addUsersToChat = async (req, res) => {
    const { chatId } = req.params; // Extract chat ID from request params
    const { userIds } = req.body;  // Array of user IDs to add to the chat
    const userIdFromToken = req.user.staff_code;

    try {

        const hiddenChatEntry = await HiddenChat.findOne({
            where: { chat_id: chatId, user_id: userIdFromToken },
            attributes: ['hidden', 'hidden_time']
        });

        // If the chat is hidden for this user, return a 404 or an appropriate error
        if (hiddenChatEntry && hiddenChatEntry.hidden) {
            return res.status(404).json({ error: 'Chat is hidden and not accessible' });
        }

        // Determine the hidden_time if it exists
        const hiddenTime = hiddenChatEntry ? hiddenChatEntry.hidden_time : null;

        const participantEntries = await ChatParticipant.findAll({
            where: { 
                chat_id: chatId, 
                user_id: { [Op.in]: userIds } 
            },
            attributes: ['leftAt', 'joinedAt']
        });

        console.log("ParticipantEntries", participantEntries)
        

       
        const leftAt = participantEntries.length > 0 
        ? participantEntries
            .map(entry => entry.leftAt) // Extract leftAt values
            .filter(time => time !== null && time !== undefined) // Remove null/undefined values
            .reduce((min, time) => (time < min ? time : min), Infinity) // Get the minimum time
        : null;

        // If no valid leftAt times were found, set it to null
        const finalLeftAt = leftAt === Infinity ? null : leftAt;

        // Determine the latest joinedAt time, ignoring null or undefined values
        const joinedAt = participantEntries.length > 0 
        ? participantEntries
            .map(entry => entry.joinedAt) // Extract joinedAt values
            .filter(time => time !== null && time !== undefined) // Remove null/undefined values
            .reduce((max, time) => (time > max ? time : max), -Infinity) // Get the maximum time
        : null;

        // If no valid joinedAt times were found, set it to null
        const finalJoinedAt = joinedAt === -Infinity ? null : joinedAt;


        const messageWhereCondition = {};
        if (hiddenTime) {
            messageWhereCondition.createdAt = { [Op.gt]: hiddenTime }; // Only include messages after hidden_time
        }

        if (finalLeftAt) {
            messageWhereCondition.createdAt = messageWhereCondition.createdAt
                ? { ...messageWhereCondition.createdAt, [Op.lt]: finalLeftAt } // Merge with existing condition
                : { [Op.lt]: finalLeftAt }; // Set new condition if none exists
        }
        
        if (finalJoinedAt) {
            messageWhereCondition.createdAt = messageWhereCondition.createdAt
                ? { ...messageWhereCondition.createdAt, [Op.gt]: finalJoinedAt } // Merge with existing condition
                : { [Op.gt]: finalJoinedAt }; // Set new condition if none exists
        }


        // Find the chat by ID
        const chat = await Chat.findByPk(chatId, {
            
            attributes: ['id', 'name', 'isGroupChat', 'createdAt', 'photo', 'mutedBy'],
            where: Sequelize.literal(`EXISTS (SELECT 1 FROM chat_participants WHERE chat_participants.chat_id = Chat.id AND chat_participants.user_id = ${userIdFromToken})`),
            
        });

        console.log("chat1", chat)


        // Fetch chat details
        const chatOwners = await ChatOwner.findAll({
            where: { chat_id: chatId },
            attributes: ['user_id'], // Only fetch the user_id field
        });

        console.log("chatOwners")

        const ownerIds = chatOwners.map(owner => owner.user_id);

        // Fetch user details for each owner using getUserByCode
        const ownerAdmins = await Promise.all(
            ownerIds.map(async (userId) => {
                const user = await getUserByCode(userId);
                return user; // Return the user details
            })
        );

        // Filter out any null values (in case a user wasn't found)
        const filteredOwnerAdmins = ownerAdmins.filter(user => user !== null);

        console.log("test1");

        const chatParticipants = await ChatParticipant.findAll({
            where: { chat_id: chatId, leftAt: null }, // Only include active participants
            attributes: ['user_id'], // Fetch only the user_id field
        });

        const participantIds = chatParticipants.map(participant => participant.user_id);

        // Fetch user details for each participant using getUserByCode
        const participants = await Promise.all(
            participantIds.map(async (userId) => {
                const user = await getUserByCode(userId);
                return user; // Return the user details
            })
        );

        // Filter out any null values (in case a user wasn't found)
        const filteredParticipants = participants.filter(user => user !== null);

        console.log("test2");

        // const messages = await Message.findAll({
        //     where: {
        //         chat_id: chatId,
        //         ...(Object.keys(messageWhereCondition).length > 0 ? messageWhereCondition : {}),
        //     },
        //     include: [
        //         {
        //             model: Message,
        //             as: 'originalMessage',
        //             attributes: ['id', 'text_content', 'createdAt'],
        //         },
        //     ],
        //     attributes: [
        //         'id',
        //         'text_content',
        //         'media_url',
        //         'media_type',
        //         'createdAt',
        //         'sender_id',
        //         'recipient_id',
        //         'pin',
        //         'read',
        //         'viewedBy',
        //         'edited',
        //         'deletedBy',
        //         'isDeletedForEveryone',
        //         'deletedByUserId',
        //         'forwarded_from',
        //     ],
        //     order: [['createdAt', 'ASC']], // Order messages by date
        // });

        // Fetch sender, recipient, and deletedBy user details
       

       

        // Attach user details to messages
        // const enrichedMessages = messages.map((message) => ({
        //     ...message.toJSON(),
        //     sender: userMap[message.sender_id] || null,
        //     recipient: userMap[message.recipient_id] || null,
        //     deletedByUser: userMap[message.deletedByUserId] || null,
        // }));


        // Add the ownerAdmins as part of the chat object
        
        

        // Check if the chat exists
        if (!chat) {
            return res.status(404).json({ error: 'Chat does not exist' });
        }

        // Check if the user is a participant in the chat
        // const chatParticipant = await ChatParticipant.findOne({
        //     where: {
        //         chat_id: chatId,
        //         user_id: userId,
        //     },
        // });
        
        // if (!chatParticipant) {
        //     return res.status(403).json({ error: 'You do not have access to this chat' });
        // }

        // If it's not a group chat, adjust the name to the other participant's username
        

        const chatDetail = {
            ...chat.toJSON(),
            ownerAdmins: filteredOwnerAdmins,
            participants: filteredParticipants,
            // messages: enrichedMessages,
        };

        console.log("test3")


        const isAdmin = chatDetail.ownerAdmins.some((admin) => admin.employeeId === userIdFromToken);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized to add users' });
        }

        // Find users by IDs
        // const users = await User.findAll({
        //     where: { 
        //         id: userIds,
        //         emailVerified: true
        //     }
        // });

        

        const users = await getUsersByCodes(userIds)

        if (users.length !== userIds.length) {
            return res.status(400).json({ error: 'Some users have not verified their email' });
        }

        // Add users to the chat (many-to-many association)


        const now = new Date();

        // Iterate through the users and handle the ChatParticipant logic
        for (const user of users) {
            const participant = await ChatParticipant.findOne({
                where: {
                    chat_id: chatId,
                    user_id: user.employeeId,
                },
            });

            if (participant) {
                // If the participant exists, update `leftAt` to null and set `joinedAt` to now
                await participant.update({
                    leftAt: null,
                    joinedAt: now,
                });


            } else {
                // If the participant doesn't exist, create a new entry in `ChatParticipant`
                await ChatParticipant.create({
                    chat_id: chatId,
                    user_id: user.employeeId,
                    joinedAt: now,
                });

                // await chat.addParticipants(users);

            }

            const joinMessage = await Message.create({
                chat_id: chat.id,
                sender_id: user.employeeId,
                text_content: `${user.userfullname} join the chat.`,
                media_type: "join",
                reply_to: null,
            })

            const io = getIO();
       
      

            console.log(`Emitting new message to chat_${chat.id}:`, joinMessage);
            
            


            io.to(`chat_${chat.id}`).emit('newMessage', joinMessage);

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
    
        }


        const participantsWithDetails = await ChatParticipant.findAll({
            where: {
                chat_id: chatId,
                user_id: users.map((user) => user.employeeId),
            },
            attributes: ['user_id', 'joinedAt', 'leftAt'], // Ensure joinedAt and leftAt are fetched
        });
        
        // Extract unique user IDs from participants
        const uniqueUserIds = [...new Set(participantsWithDetails.map(part => part.user_id))];
        
        // Fetch user details using getUsersByCodes
        const userDetails = uniqueUserIds.length > 0 
            ? await getUsersByCodes(uniqueUserIds) 
            : [];
        
        // Merge ChatParticipant details with user details
        const groupedParticipants = participantsWithDetails.map(participant => {
            const userDetail = userDetails.find(user => user.employeeId === participant.user_id);
        
            return {
                userfullname: userDetail ? userDetail.userfullname : "Unknown User", // Default name if not found
                joinedAt: participant.joinedAt,
                leftAt: participant.leftAt,
            };
        });
        
        // Return the combined result
        return res.status(200).json({
	    status: 1,
            message: 'Users added to chat successfully',
            participants: groupedParticipants,
        });
        
    } catch (err) {
        console.error('Error adding users to chat:', err);
        return res.status(500).json({status: 0, error: 'Failed to add users', details: err.message });
    }
};

exports.giveAdminToChat = async (req, res) => {
    const { chatId } = req.params;  // Extract chat ID from request params
    const userId = req.body.userIds; // Single user ID to add as admin
    const userIdFromToken = req.user.staff_code;


    

    try {
        // Find the chat by ID and include current admins
        const chat = await Chat.findByPk(chatId, {
           
            attributes: ['id', 'name', 'isGroupChat']
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }


        const chatOwners = await ChatOwner.findAll({
            where: { chat_id: chatId },
            attributes: ['user_id'], // Only fetch the user_id field
        });

        console.log("chatOwners", chatOwners)

        const ownerIds = chatOwners.map(owner => owner.user_id);

        // Fetch user details for each owner using getUserByCode
        const ownerAdmins = await Promise.all(
            ownerIds.map(async (userId) => {
                const user = await getUserByCode(userId);
                return user; // Return the user details
            })
        );

        // Filter out any null values (in case a user wasn't found)
        const filteredOwnerAdmins = ownerAdmins.filter(user => user !== null);

        const chatDetail = {
            ...chat.toJSON(),
            ownerAdmins: filteredOwnerAdmins,
        };

        console.log("chat_detail", chatDetail)



        

        // Check if the requesting user is an admin
        const isAdmin = chatDetail.ownerAdmins.some((admin) => admin.employeeId === userIdFromToken);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized to give admins to other users' });
        }

        // Find the user by ID and ensure they are verified
      const user = await getUserByCode(userId);
      
        if (!user) {
            return res.status(400).json({ error: 'User not found or email not verified' });
        }

        // Check if the user is already an admin
        const isAlreadyAdmin = chatDetail.ownerAdmins.some((admin) => admin.employeeId === userId);
        if (isAlreadyAdmin) {
            return res.status(400).json({ error: 'User is already an admin' });
        }

        // Add new admin to the ChatOwner table
        await ChatOwner.create({
            chat_id: chatId,
            user_id: userId,
            isOwner: true
        });

        return res.status(200).json({status: 1, message: 'Admin added successfully', addedAdmin: userId });
    } catch (err) {
        console.error('Error giving admin to user in chat:', err);
        return res.status(500).json({ status: 0, error: 'Failed to give admin', details: err.message });
    }
};



// exports.removeUsersFromChat = async (req, res) => {
//     const  {chatId}  = req.params; // Extract chat ID from request params
//     console.log("ID", chatId);
//     const { userIds } = req.body;  // Array of user IDs to add to the chat
//     const userIdFromToken = req.user.id;
//     console.log("USerIds", userIds)
//     console.log("USERIDFROMTOKEN", userIdFromToken);


//     try {
//         // Find the chat by ID
//         const chat = await Chat.findByPk(chatId, {
//             include: [
//                 {
//                     model: User,
//                     as: 'ownerAdmins', // Fetch owners/admins of the chat
//                     attributes: ['id', 'username', 'position', 'user_photo'], // Only required fields
//                     through: {
//                         attributes: [], // Exclude extra fields from the join table
//                     },
//                 },
//                 {
//                     model: User,
//                     as: 'participants',
//                     include: [
//                         {
//                             model: Chat,
//                             as: 'ownedChats',
//                         },
//                     ],

//                     attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
//                     through: {
//                         attributes: ['leftAt'], // Include `leftAt` in the join table fields
//                         where: {
//                             leftAt: null, // Only include participants who have not left the chat
//                         },
//                     },
//                     // required: true,
//                     // where: {
//                     //     '$participants.ChatParticipant.leftAt$': null, // Exclude participants who have left the chat
//                     // },
//                     // required: false, // Allow chats even if there are no participants matching the condition
//                 },
//                 {
//                     model: Message,
//                     as: 'messages',
//                     include: [
//                         {
//                             model: User,
//                             as: 'sender',
//                             include: [
//                                 {
//                                     model: Chat,
//                                     as: 'ownedChats',
//                                 },
//                             ],
//                             attributes: ['id', 'username', 'active', 'logoutTime', 'user_photo'],
//                         },
//                         {
//                             model: User,
//                             as: 'recipient',
//                             include: [
//                                 {
//                                     model: Chat,
//                                     as: 'ownedChats',
//                                 },
//                             ],
//                             attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
//                         },
//                         {
//                             model: Message,
//                             as: 'originalMessage',
//                             include: [
//                                 {
//                                     model: User,
//                                     as: 'sender',
//                                     attributes: ['id', 'username', 'active', 'logoutTime', 'user_photo'],
//                                 },
//                                 {
//                                     model: User,
//                                     as: 'recipient',
//                                     attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
//                                 },
//                             ],
//                         },
//                         {
//                             model: User,
//                             as: 'deletedByUser', // Added this line
//                             attributes: ['id', 'username'], // Only fetching required attributes
//                         },
//                     ],
//                     attributes: [
//                         'id',
//                         'text_content',
//                         'media_url',
//                         'media_type',
//                         'createdAt',
//                         'sender_id',
//                         'recipient_id',
//                         'pin',
//                         'read',
//                         'viewedBy',
//                         'edited',
//                         'deletedBy',
//                         'isDeletedForEveryone',
//                         'deletedByUserId',
//                         'forwarded_from',
//                     ],
//                     // where: Object.keys(messageWhereCondition).length > 0 ? messageWhereCondition : undefined,
                    
//                     order: [['createdAt', 'ASC']], // Order messages by date, ascending
//                     required: false,
//                 },
//             ],
//             attributes: ['id', 'name', 'isGroupChat', 'createdAt', 'photo', 'mutedBy', 'ownerId'],
           
//         });
//         console.log("CHAT", chat);

//         if (!chat) {
//             return res.status(404).json({ error: 'Chat not found' });
//         }

//         const isAdmin = chat.ownerAdmins.some((admin) => admin.id === userIdFromToken);
//         if (!isAdmin) {
//             return res.status(403).json({ error: 'Unauthorized to add users' });
//         }

//         // Find users by IDs
//         const users = await User.findAll({
//             where: { 
//                 id: userIds,
//             }
//         });

//         console.log("USERS", users);

//         const userIdsArray = users.map(user => user.id);

        
//         const leftUsers = await ChatParticipant.update(
//             { 
//                 leftAt: new Date()
//             },
//             {
//                 where: {
//                     user_id: userIdsArray, // Use the userIdsArray
//                     chat_id: chat.id
//                 }
//             }
//         );

        
       
       

//         let leftUsersDetails;

//         console.log("LeftUsers", leftUsers)

//         if (leftUsers) {
//             // `leftUsers[1]` contains the updated rows, so fetch details
//             leftUsersDetails = await ChatParticipant.findAll({
//                 where: {
//                     user_id: userIdsArray,
//                     chat_id: chat.id,
//                 },
//                 include: [
//                     {
//                         model: User,
//                         as: 'user', // Use the alias defined in ChatParticipant.belongsTo(User)
//                         attributes: ['id', 'username', 'active', 'logoutTime', 'position', 'user_photo'],
//                     },
//                 ],
//             });

            
//         }

//         console.log("leftUsersDetails", leftUsersDetails);

//         const leaveMessages = leftUsersDetails.map(detail => ({
//             chat_id: chat.id,
//             sender_id: detail.user_id,
//             text_content: `${detail.user.username} left the chat.`,
//             media_type: "leave",
//             reply_to: null,
//         }));

//         // Bulk insert leave messages
//         await Message.bulkCreate(leaveMessages);

//         console.log(`Emitting new message to chat_${chat.id}:`, leaveMessages);

//         const io = getIO();

//         io.to(`chat_${chat.id}`).emit('newMessage', leaveMessages);
//         io.to(`chat_${chat.id}`).emit('leftChat');


       
//         console.log("Updated ChatParticipants");
//         return res.status(200).json({ message: 'Users removed from chat successfully', participants });
//         // console.log("UpdatedChat", chat);

//     } catch (err) {
//         console.error('Error adding users to chat:', err);
//         return res.status(500).json({ error: 'Failed to add users', details: err.message });
//     }
// }

// Get chat details including participants


exports.removeUsersFromChat = async (req, res) => {
    const { chatId } = req.params; // Extract chat ID from request params
    const { userIds } = req.body; // Array of user IDs to remove from the chat
    const userIdFromToken = req.user.staff_code;

    try {
        // Verify if the chat exists
        const chat = await Chat.findByPk(chatId, {
            attributes: ['id', 'isGroupChat'],
            include: [
                {
                    model: ChatOwner,
                    as: 'ownerAdmins',
                    attributes: ['user_id'], // Fetch chat admins
                },
            ],
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat does not exist' });
        }

        // Check if the user is an admin
        const isAdmin = chat.ownerAdmins.some((admin) => admin.user_id === userIdFromToken);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized to remove users' });
        }

        
        // Verify the users to be removed are participants in the chat
        const participants = await ChatParticipant.findAll({
            where: {
                chat_id: chatId,
                user_id: { [Op.in]: userIds },
                leftAt: null, // Only active participants
            },
        });

        if (participants.length === 0) {
            return res.status(400).json({ error: 'None of the specified users are active participants' });
        }

        const now = new Date();

        // Mark users as removed by setting `leftAt`
        await Promise.all(
            participants.map((participant) =>
                participant.update({
                    leftAt: now,
                })
            )
        );

        // Notify all participants about the removal
        const io = getIO();
        const userDetails = await Promise.all(userIds.map((id) => getUserByCode(id)));

        userDetails.forEach((user) => {
            if (user) {
                const leaveMessage = `${user.userfullname} has left the chat.`;

                const removalMessage = Message.create({
                    chat_id: chatId,
                    sender_id: user.employeeId,
                    text_content: leaveMessage,
                    media_type: 'leave',
                    createdAt: now,
                });

                io.to(`chat_${chatId}`).emit('newMessage', removalMessage);
                io.to(`chat_${chatId}`).emit('updateLastMessage', {
                    chat_id: chatId,
                    text_content: leaveMessage,
                    createdAt: now,
                    sender_id: user.employeeId,
                });
            }
        });

        return res.status(200).json({status: 1, message: 'Users removed from chat successfully' });
    } catch (err) {
        console.error('Error removing users from chat:', err);
        return res.status(500).json({ status: 0, error: 'Failed to remove users', details: err.message });
    }
};




exports.getChatWithParticipants = async (req, res) => {
    const { chatId } = req.params; // Extract chat ID from request params

    try {
        const chat = await Chat.findByPk(chatId);

        const participants = await ChatParticipant.findAll({
            where: {
                chat_id: chatId,
            }
        });

        const chatWithParticipants = {
            ...chat.toJSON(),
            participants: participants
        }

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        return res.status(200).json({status: 1, chatWithParticipants});
    } catch (err) {
        console.error('Error fetching chat participants:', err);
        return res.status(500).json({status: 0, error: 'Failed to fetch participants', details: err.message });
    }
};

exports.chatPhoto = async (req, res) => {
    console.log("Body", req.body);

    
    const { chat_photo } = req.body;
    const userId = req.user.staff_code;
    console.log("UserId", userId);
    const id = req.params.id;
    console.log("id", id);



    

    

    try {
        const  chat  = await Chat.findByPk(id);
        console.log("Chat", chat);

        

        if(!chat) {
            return res.status(404).json({error: "Chat not found"});
        }

        const chatOwners = await ChatOwner.findAll({
            where: { chat_id: id },
            attributes: ['user_id'], // Only fetch the user_id field
        });

        
        console.log("chatOwners")

        const ownerIds = chatOwners.map(owner => owner.user_id);

        // Fetch user details for each owner using getUserByCode
        const ownerAdmins = await Promise.all(
            ownerIds.map(async (userId) => {
                const user = await getUserByCode(userId);
                return user; // Return the user details
            })
        );

        // Filter out any null values (in case a user wasn't found)
        const filteredOwnerAdmins = ownerAdmins.filter(user => user !== null);

        const chatDetail = {
            ...chat.toJSON(),
            ownerAdmins: filteredOwnerAdmins,
        };

        const isAdmin = chatDetail.ownerAdmins.some((admin) => admin.employeeId === userId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized to give admins to other users' });
        }

       

        if ( chat.isGroupChat === false) {
            return res.status(401).json({error: "Can't upload photo for private conversation"});
        }


        
        let photo = null;
        if (chat_photo) {
            console.log("ChatPhoto here");
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const file_path = path.join(process.cwd(), 'public', `uploads/groupPhotos/${year}/${month}`);
        
            // Ensure directory exists
            if (!fs.existsSync(file_path)) {
                fs.mkdirSync(file_path, { recursive: true });
                console.log(`Created directory: ${file_path}`);
            }
        
            // Decode base64 content and save file
            const base64Content = chat_photo.split(';base64,').pop();
            const buffer = Buffer.from(base64Content, 'base64');
        
            // Use the original file name (sanitize if necessary)
            const originalFileName = `${id}_${Date.now()}_${chat.name}`; // Prefix with sender_id and timestamp for uniqueness
            const fullFilePath = path.join(file_path, originalFileName);
        
            await fsPromises.writeFile(fullFilePath, buffer);
            photo = `uploads/groupPhotos/${year}/${month}/${originalFileName}`; // Use the original name for URL
        }

        console.log("Hellop Initial")

        const updatedGroup = await chat.update(
            {
                photo: photo 
            }
        );


        

        console.log("Updated Group", updatedGroup);

        const io = getIO();
        io.to(`chat_${chat.id}`).emit('groupPhoto', updatedGroup);


        return res.status(201).json({status: 1, message: "Updated Successfully", updatedGroup})
    } catch (error) {
        return res.status(500).json({ status: 0, error: 'Something wrong', details: error });
    }

}

exports.muteChat = async (req, res) => {
    const  { chatId } = req.params;
    const userId = req.user.staff_code; 

    console.log("HEYCHat", chatId);
    console.log("HEYUser", userId);

    



    try {
        const chat = await Chat.findByPk(chatId)
        let mutedBy = JSON.parse(chat.mutedBy || '[]');

        
        if (!mutedBy.includes(userId)) {
            mutedBy.push(userId); 
            chat.mutedBy = JSON.stringify(mutedBy); 
            await chat.save();
        }

        console.log("HEY MUTED")

        res.status(201).json({status: 1, message: 'Muted Chat' });

        

    } catch (error) {
        return res.status(500).json({ status: 0, message: 'Error muting chat'});
    }

}

exports.unMuteChat = async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.staff_code;

    console.log("UnMuteChat", chatId);

    try {
        const chat = await Chat.findByPk(chatId);
        let mutedBy = JSON.parse(chat.mutedBy || '[]');

        console.log("MutedBy", mutedBy);

        // Check if userId is in mutedBy and remove it
        if (mutedBy.includes(userId)) {
            mutedBy = mutedBy.filter(id => id !== userId); 
            chat.mutedBy = JSON.stringify(mutedBy); 
            console.log("MutedBy before save:", chat.mutedBy);
            await chat.save();
            console.log("MutedBy after save:", chat.mutedBy);
        } else {
            console.log("Some Error Arise")
        }

        res.status(201).json({status: 1, message: 'Unmuted Chat' });

    } catch (error) {
        return res.status(500).json({ status: 0, message: 'Error unmuting chat' });
    }
};

exports.muteAllChats = async (req, res) => {
    const userId = req.user.staff_code;


    

    try {
        // Find all chat IDs where the user is a participant
        const chatParticipants = await ChatParticipant.findAll({
            where: { user_id: userId },
            attributes: ['chat_id']  // Only select chat_id
        });


        

        

        console.log("chat_participants", chatParticipants)

        if (chatParticipants.length === 0) {
            return res.status(404).json({ message: 'No chats found for this user' });
        }

        // Extract chat IDs from the result
        const chatIds = chatParticipants.map(cp => cp.chat_id);

        // Find all chats by chat IDs
        const chats = await Chat.findAll({
            where: { id: chatIds }
        });

        console.log("chats", chats)

        for (const chat of chats) {
            let mutedBy = JSON.parse(chat.mutedBy || '[]');

            // Add userId to mutedBy if not already present
            if (!mutedBy.includes(userId)) {
                mutedBy.push(userId);
                chat.mutedBy = JSON.stringify(mutedBy);
                await chat.save();
            }
        }

        res.status(201).json({status: 1, message: 'Muted all chats for the user' });

    } catch (error) {
        console.error("Error muting all chats:", error);
        return res.status(500).json({ status: 0, message: 'Error muting all chats' });
    }
};

exports.unMuteAllChats = async (req, res) => {
    const userId = req.user.staff_code;

    try {
        // Find all chats where user is a participant
        const chatParticipants = await ChatParticipant.findAll({
            where: { user_id: userId },
            attributes: ['chat_id']  // Only select chat_id
        });

        console.log("chat_participants", chatParticipants)

        if (chatParticipants.length === 0) {
            return res.status(404).json({ message: 'No chats found for this user' });
        }

        // Extract chat IDs from the result
        const chatIds = chatParticipants.map(cp => cp.chat_id);

        // Find all chats by chat IDs
        const chats = await Chat.findAll({
            where: { id: chatIds }
        });


        for (const chat of chats) {
            let mutedBy = JSON.parse(chat.mutedBy || '[]');

            // Remove userId from mutedBy if present
            if (mutedBy.includes(userId)) {
                mutedBy = mutedBy.filter(id => id !== userId);
                chat.mutedBy = JSON.stringify(mutedBy);
                await chat.save();
            }
        }

        res.status(201).json({status: 1, message: 'Unmuted all chats' });

    } catch (error) {
        console.error("Error unmuting all chats:", error);
        return res.status(500).json({status: 0, message: 'Error unmuting all chats' });
    }
};

// exports.deleteChatForUser = async (req, res) => {
//     const chatId = req.params.id; 
//     const userId = req.user.id; 

//     try {
//         // Find the chat
//         const chat = await Chat.findByPk(chatId);

//         if (!chat) {
//             return res.status(404).json({ message: 'Chat not found' });
//         }

//         // Parse the existing `hiddenBy` list
//         const hiddenBy = JSON.parse(chat.hiddenBy);

//         // Add the user ID if it's not already in the list
//         if (!hiddenBy.includes(userId)) {
//             hiddenBy.push(userId);
//             chat.hiddenBy = JSON.stringify(hiddenBy); // Serialize back to JSON
//             await chat.save();
//         }

//         return res.status(200).json({ message: 'Chat deleted for user' });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// };


exports.deleteChatForUser = async (req, res) => {
    const chatId = req.params.id;
    const userId = req.user.staff_code;

    try {
        const chat = await Chat.findByPk(chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Check if an entry already exists for this user and chat
        let hiddenChat = await HiddenChat.findOne({ where: { chat_id: chatId, user_id: userId } });

        if (hiddenChat) {
            // Update the existing record
            hiddenChat.hidden = true;
            hiddenChat.hidden_time = new Date();
            await hiddenChat.save();
        } else {
            // Create a new record in `hidden_chats`
            await HiddenChat.create({
                chat_id: chatId,
                user_id: userId,
                hidden: true,
                hidden_time: new Date(),
            });
        }

        return res.status(200).json({status: 1, message: 'Chat hidden for user' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({status: 0, message: 'Internal server error' });
    }
};

exports.leaveChat = async (req, res) => {
    const chatId = req.params.id;
    const userId = req.user.staff_code;

    try {
        const chat = await Chat.findByPk(chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Check if an entry already exists for this user and chat
        // await ChatParticipant.update(
        //     { leftAt: new Date() },
        //     { where: { user_id: userId, chat_id: chatId } }
        // );

        const leftUsers = await ChatParticipant.update(
            { 
                leftAt: new Date()
            },
            {
                where: {
                    user_id: userId, // Use the userIdsArray
                    chat_id: chat.id
                }
            }
        );

        
       
       

        let leftUsersDetails;

        console.log("LeftUsers", leftUsers)

        if (leftUsers) {
            // `leftUsers[1]` contains the updated rows, so fetch details
            leftUsersDetails = await ChatParticipant.findAll({
                where: {
                    user_id: userId,
                    chat_id: chat.id,
                },
                
            });

            
        }

        

        

        console.log("leftUsersDetails", leftUsersDetails);


        const leftUser = await getUserByCode(userId);

        // if (leftUsersDetails?.[0]) {
        //     const leaveMessages = {
        //         chat_id: chat.id,
        //         sender_id: leftUsersDetails[0].user_id,
        //         text_content: `${leftUsersDetails[0].user.username} left the chat.`,
        //         media_type: "leave",
        //         reply_to: null,
        //     };
        
        //     // Insert leave message into the database
        //     await Message.create(leaveMessages);
        // } else {
        //     console.error("No user details found for leaving message.");
        // }


        const leaveMessages = await Message.create({
            chat_id: chat.id,
            sender_id: leftUsersDetails[0].user_id,
            text_content: `${leftUser.userfullname} left the chat.`,
            media_type: "leave",
            reply_to: null,
        });

       

        // const chatId = chat.id



        // await Message.create(leaveMessages);

        const lastMessage = {
            chat_id: chat.id,
            id: leaveMessages.id,
            text_content: leaveMessages.text_content,
            createdAt: leaveMessages.createdAt,
            sender_id: leaveMessages.sender_id,
            media_type: leaveMessages.media_type,
            reply_to: leaveMessages.reply_to
        };

        

        const io = getIO();

        io.to(`chat_${chat.id}`).emit('newMessage', leaveMessages);
        io.to(`chat_${chat.id}`).emit('leftChat', leftUsersDetails[0]);
        io.to(`chat_${chat.id}`).emit('updateLastMessage', lastMessage);

        console.log(`Emitting new message to chat_${chat.id}:`, leaveMessages);


        return res.status(201).json({status: 1, message: 'User leave chat' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 0, message: 'Internal server error' });
    }
};

