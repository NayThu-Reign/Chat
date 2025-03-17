// const express = require('express');
// const router = express.Router();
// const Department = require('../models/Department');
// const User = require('../models/User');

// exports.getAllDepartments = async (req, res) => {
//     try {
//         const departments = await Department.findAll({
//           include: [
//             {
//                 model: User,
//                 as: 'staffs',
//                 // No filter on userId, we want all participants
//                 include: [
//                   {
//                       model: Department,
//                       as: 'department',
//                   },
//                 ],
//                 attributes: ['id', 'username', 'active', 'logoutTime', 'email', 'position', 'user_photo' ],
                
//             },
//           ]
//         });

//         return res.status(200).json(departments);
//     } catch (err) {
//         return res.status(500).json({ error: "Database query error", datails: err.message})
//     }
// };



