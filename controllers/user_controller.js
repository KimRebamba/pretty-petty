const { User } = require('../models/associations');
const { Op } = require('sequelize');
const { findRecord } = require('../utils/findRecord');

const index = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const options = {
            attributes: { exclude: ['password', 'token'] },
            order: [['created_at', 'DESC']],
            paranoid: !includeDeleted
        };
        const users = await User.findAll(options);
        return res.json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const store = async (req, res) => {
    try {
        const { first_name, last_name, email, password, role, status, delivery_address, image_path } = req.body;
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ message: 'First name, last name, email, and password are required' });
        }
        const bcrypt = require('bcrypt');
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            first_name, last_name, email,
            password: hashed,
            role: role || 'customer',
            status: status || 'active',
            delivery_address: delivery_address || '',
            image_path: image_path || '/uploads/default.png'
        });
        const result = await User.findByPk(user.id, { attributes: { exclude: ['password', 'token', 'deletedAt'] } });
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const show = async (req, res) => {
    try {
        const user = await findRecord(User, req.params.id, {
            attributes: { exclude: ['password', 'token'] }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status, first_name, last_name, email, password, delivery_address } = req.body;
        const adminId = req.user.id;

        const user = await findRecord(User, id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.deleted_at) {
            return res.status(400).json({ message: 'User is deleted. Restore the account before editing.' });
        }

        if (role !== undefined && role !== user.role && id == adminId) {
            return res.status(403).json({ message: 'You cannot change your own role' });
        }

        if (status === 'inactive' && user.status !== 'inactive' && id == adminId) {
            return res.status(403).json({ message: 'You cannot deactivate your own account' });
        }

        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (delivery_address !== undefined) user.delivery_address = delivery_address;
        if (email !== undefined) {
            if (email !== user.email) {
                const existing = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
                if (existing) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
            }
            user.email = email;
        }
        if (role !== undefined && id != adminId) user.role = role;
        if (status !== undefined && id != adminId) user.status = status;

        if (password && String(password).trim().length > 0) {
            const bcrypt = require('bcrypt');
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        const result = await User.findByPk(id, { attributes: { exclude: ['password', 'token', 'deletedAt'] } });
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deactivate = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        if (id == adminId) {
            return res.status(403).json({ message: 'You cannot deactivate your own account' });
        }

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

const destroy = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        if (id == adminId) {
            return res.status(403).json({ message: 'You cannot delete your own account' });
        }
        const user = await findRecord(User, id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.deleted_at) {
            return res.status(400).json({ message: 'User is already deleted' });
        }
        await user.destroy({ force: false });
        return res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, { paranoid: false });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.deleted_at) return res.status(400).json({ message: 'User is not deleted' });
        await user.restore();
        const result = await User.findByPk(id, { attributes: { exclude: ['password', 'token', 'deletedAt'] } });
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const bulkDestroy = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }
        const adminId = req.user.id;
        const filtered = ids.filter(id => id != adminId);
        if (filtered.length === 0) {
            return res.status(403).json({ message: 'You cannot delete your own account' });
        }
        const result = await User.destroy({ where: { id: filtered }, force: false });
        return res.json({ message: result + ' user(s) deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    index,
    show,
    store,
    update,
    deactivate,
    destroy,
    restore,
    bulkDestroy
};
