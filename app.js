require('dotenv').config();
const express = require("express");
const sequelize = require("./config/db");
require('./models/associations');

const app = express();






async function testConnection() {
  try {
    await sequelize.authenticate();

    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

async function syncDatabase() {
  try {
   
    await sequelize.sync({ alter: true }); 
    console.log("Database synchronized successfully!");
    console.log(`>---------------------------------------------------------`);
    console.log(``);
  } catch (error) {
    console.error("Database sync failed:", error.message);
  }
}

app.listen(process.env.PORT, async () => {

    console.log(``);
    console.log(`>---------------------------------------------------------`);
    console.log(`Hi! :) this was made with ❤️  (2026). Developed by kim0.`);
    console.log(`Pretty Petty is running at: http://localhost:${process.env.PORT} `);
    console.log(``);

    testConnection();
    syncDatabase();
})