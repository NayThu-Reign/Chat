const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Message = require('./Message');
const User = require('./User');

// Assuming you're getting users from an external API, you won't need the User model
// Just track the user information you need directly in the Reaction table

const Reaction = sequelize.define('Reaction', {
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
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.STRING,
    references: {
        model: User,
        key: 'user_code',
    },
    allowNull: false,
  },
  reaction_type: {
    type: DataTypes.STRING,
    allowNull: false,  // E.g., 'like', 'love', 'laugh', etc.
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: true,  // Optionally store the user's name if needed
  },
}, {
  tableName: 'reactions',  // Ensure this matches your table name
  timestamps: true,  // Optional, if you want to track when reactions were added
});



module.exports = Reaction;
