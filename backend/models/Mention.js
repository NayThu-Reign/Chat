// models/Mention.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Message = require('./Message');
const User = require('./User');

const Mention = sequelize.define('Mention', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    message_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Message,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    mentioned_user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'user_code'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'mentions', // Ensure this matches your database table name
    timestamps: true
});

module.exports = Mention;
