const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Chat = require('./Chat');
const User = require('./User');

const HiddenChat = sequelize.define('HiddenChat', {
    chat_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Chat,
            key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
    },
    user_id: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'user_code',
        },
        allowNull: false,
    },
    hidden_time: {
        type: DataTypes.DATE,
        allowNull: true, 
    },
    hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    }
}, {
    tableName: 'hidden_chats',
    timestamps: false 
});

module.exports = HiddenChat;
