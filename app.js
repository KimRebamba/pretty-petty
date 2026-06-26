require('dotenv').config();
require('./models/associations');

const cors = require('cors');
const express = require("express");
const sequelize = require("./config/db");
const Auth_Routes = require("./routes/Auth_Routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static("public"));

app.use("/api/auth", Auth_Routes);




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
   
    await sequelize.sync(); 
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