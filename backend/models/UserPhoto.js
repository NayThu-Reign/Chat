const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Message = require('./Message');
const User = require('./User');

// Assuming you're getting users from an external API, you won't need the User model
// Just track the user information you need directly in the Reaction table

const UserPhoto = sequelize.define("UserPhoto", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  
  user_id: {
    type: DataTypes.STRING,
    references: {
        model: User,
        key: 'user_code',
    },
    allowNull: false,
  },
  photo: {
    type: DataTypes.STRING, 
    allowNull: true
},
}, {
  tableName: 'user_photos',  // Ensure this matches your table name
  timestamps: true,  // Optional, if you want to track when reactions were added
});



module.exports = UserPhoto;