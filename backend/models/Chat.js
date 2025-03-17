const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Chat = sequelize.define('Chat', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true // Optional, for naming group chats
    },
    is_group_chat: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true // Optional, for a chat description
    },
   
    photo: {
        type: DataTypes.TEXT, 
        allowNull: true
    },
    mute_chat: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    muted_by: {
        type: DataTypes.TEXT, // Store as a serialized JSON string
        allowNull: false,
        defaultValue: '[]' // Default to an empty array as a JSON string
    },
    
    
}, {
    tableName: 'chats',
    timestamps: true
});

module.exports = Chat;