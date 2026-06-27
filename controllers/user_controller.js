const { User } = require('../models/associations');

const index = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'token', 'deletedAt'] },
            order: [['created_at', 'DESC']]
        });

        return res.json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only allow updating role and status
        if (role !== undefined) user.role = role;
        if (status !== undefined) user.status = status;

        await user.save();

        const result = await User.findByPk(id, {
            attributes: { exclude: ['password', 'token', 'deletedAt'] }
        });

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deactivate = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = 'inactive';
        await user.save();

        const result = await User.findByPk(id, {
            attributes: { exclude: ['password', 'token', 'deletedAt'] }
        });

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    index,
    update,
    deactivate
};
