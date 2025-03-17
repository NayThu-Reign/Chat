const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Chat = require("./Chat");
const User = require('./User');

const ChatParticipant = sequelize.define('ChatParticipants', {
    chat_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Chat,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    user_id: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'user_code',
        },
        allowNull: false,
    },
    left_at: {
        type: DataTypes.DATE,
        allowNull: true, // Null if the user is still in the chat
    },
    joined_at: {
        type: DataTypes.DATE,
        allowNull: true, // Null if the user is still in the chat
    }
    
}, {
    tableName: 'chat_participants',
    timestamps: false
});

module.exports = ChatParticipant;