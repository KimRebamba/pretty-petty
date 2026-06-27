const { User } = require('../models/associations');
const path = require('path');
const upload = require('../middlewares/upload');

const show = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'token', 'deletedAt'] }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { first_name, last_name, delivery_address } = req.body;

        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (delivery_address !== undefined) user.delivery_address = delivery_address;

        if (req.file) {
            user.image_path = req.file.path.replace(/\\/g, '/').replace(/^public\//, '/');
        }

        await user.save();

        // Update localStorage on frontend
        const result = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'token', 'deletedAt'] }
        });
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { show, update };
