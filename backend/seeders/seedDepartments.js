const sequelize = require('../config/db');
const Department = require('../models/Department');

const seedDepartments = async () => {
    try {
        const departments = [
            { name: "Human Resources" },
            { name: "IT"},
            { name: "Marketing"},
            { name: "Software"}
        ];

        await sequelize.sync({ force: true });
        await Department.bulkCreate(departments);

        console.log("Sample Department Data Added")
    } catch (err) {
        console.error('Error seeding departments:', err);
    } finally {
        await sequelize.close();
    }
};

seedDepartments();