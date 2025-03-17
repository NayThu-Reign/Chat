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

exports.checkTokens = async (req, res) => {
    try {
            const authTokens = req.cookies['auth_tokens']; // Extract 'auth_tokens' cookie
  
      console.log("auth_tokens from cookie:", req);
  
      // If no token is found, return an error response
      if (!authTokens) {
        return res.status(401).json({ success: false, message: 'No auth tokens found in cookies.' });
      }
  
      // Parse the token (assuming it's a JSON array of tokens)
      const tokens = JSON.parse(authTokens);
  
      if (!Array.isArray(tokens) || tokens.length === 0) {
        return res.status(401).json({ success: false, message: 'Auth tokens are invalid or empty.' });
      }
  
      let user = null;
      let validToken = null;
  
      // Loop through each token to check if any are valid
      for (const token of tokens) {
        try {
          // Call your external API to verify each token
          const response = await axios('https://sso.trustlinkmm.com/api/verify_token', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
          if (response.ok) {
            const responseData = await response.json();
            console.log('Valid token found:', responseData);
            user = responseData.user;
            validToken = token; // Store the valid token
            break; // Exit the loop once a valid token is found
          } else {
            console.log(`Token is invalid: ${token}`);
          }
        } catch (error) {
          console.error(`Error verifying token: ${token}`, error);
        }
      }
  
      if (!user) {
        return res.status(401).json({ success: false, message: 'No valid token found.' });
      }
  
      // If valid token found, return user info
      res.json({ success: true, user, token: validToken });
    } catch (error) {
      console.error('Error during token verification process:', error);
      res.status(500).json({ success: false, message: 'Internal server error during token verification.' });
    }
  };