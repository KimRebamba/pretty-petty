const User = require("../models/user");
const path = require('path');
const bcrypt = require("bcrypt");

function login(){

}

async function register (req, res){
    try {
        const first_name = req.body.first_name;
        const last_name = req.body.last_name;
        const email = req.body.email;
        const delivery_address = req.body.delivery_address;
        const password = req.body.password;
        const image_path = req.file.path; 

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
            message: "All fields are required."
        });
}

        const existing = await User.findOne({ where: { email } });

        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            first_name,
            last_name,
            email,
            password: hashed,
            image_path,
            delivery_address
        });

        return res.status(201).json({ message: 'Registered successfully'});

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

function logout(){

}

async function showLogin(req, res) {
  try {
    res.sendFile(path.join(__dirname, '../views/login.html'));
  } catch (error) {
    res.status(500).send('Error loading the login page');
  }
}

async function showRegister(req, res) {
  try {
    res.sendFile(path.join(__dirname, '../views/register.html'));
  } catch (error) {
    res.status(500).send('Error loading the register page');
  }
}

module.exports = {
    login,
    register,
    logout,
    showLogin,
    showRegister
};