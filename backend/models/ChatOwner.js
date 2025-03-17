const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Chat = require('./Chat'); // Assuming this is the Chat model
const User = require('./User');

const ChatOwner = sequelize.define('ChatOwner', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    chat_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Chat,
            key: 'id',
        },
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
    is_owner: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // Optional, to explicitly mark ownership
    },
}, {
    tableName: 'chat_owners',
    timestamps: true,
});

module.exports = ChatOwner;
