const User = require("../models/user");
const { generateToken } = require("../middlewares/Authentication");
const path = require('path');
const bcrypt = require("bcrypt");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
        }

        const token = generateToken(user);

        user.token = token;
        await user.save();

        const userData = user.toJSON();
        delete userData.password;
        delete userData.token;

        return res.json({ token, user: userData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

async function register(req, res) {
    try {
        const first_name = req.body.first_name;
        const last_name = req.body.last_name;
        const email = req.body.email;
        const delivery_address = req.body.delivery_address;
        const password = req.body.password;
        const image_path = req.file ? req.file.path.replace(/\\/g, '/').replace(/^public\//, '/') : '/uploads/default.png';

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

        return res.status(201).json({ message: 'Registered successfully' });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}

const logout = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;

        if (userId) {
            const user = await User.findByPk(userId);
            if (user) {
                user.token = null;
                await user.save();
            }
        }

        return res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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
