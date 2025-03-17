const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Chat = require('./Chat');
const User = require('./User');


const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Chat,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    sender_id: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'user_code',
        },
        allowNull: false,
    },
    recipient_id: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'user_code',
        },
    },
    text_content: {
        type: DataTypes.TEXT, // For storing text and emojis together
        allowNull: true
    },
    media_url: {
        type: DataTypes.TEXT, 
        allowNull: true
    },
    media_type: {
        type: DataTypes.STRING,
        allowNull: true // Null if there's no media attached
    },
    pin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,   
    },
    viewed_by: {
        type: DataTypes.TEXT, // Store as a serialized JSON string
        allowNull: false,
        defaultValue: '[]' // Default to an empty array as a JSON string
    },
    read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,   
    },
    reply_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'messages',
            key: 'id'
        },
        onDelete: "SET NULL"
    },
    edited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,   
    },
    deleted_by: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'user_code',
        },
        
    },
    is_deleted_for_everyone: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    
    deleted_by_user_id: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'user_code',
        },
        
    },
    forwarded_from: {
        type: DataTypes.INTEGER,  // Reference to the original message ID
        allowNull: true,
        references: {
            model: 'messages',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    mentions: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]'
    }
    
}, {
    tableName: 'messages', // Ensure this matches your MySQL table name
    timestamps: true
});

module.exports = Message;