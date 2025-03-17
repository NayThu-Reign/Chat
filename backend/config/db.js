const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('chat_application', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

sequelize.authenticate()
         .then(() => console.log('Connect to Mysql with Sequelize'))
         .catch(err => console.error('Unable to connect to MySQL:', err));


module.exports = sequelize;