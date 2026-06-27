const { Category } = require('../models/associations');
const path = require('path');
const { findRecord } = require('../utils/findRecord');

function normalizeImagePath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/^public\//, '/');
}

const index = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const where = {};
        if (req.query.status) {
            where.status = req.query.status;
        }
        const categories = await Category.findAll({
            where,
            order: [['created_at', 'DESC']],
            paranoid: !includeDeleted
        });
        return res.json(categories);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const store = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        const image_path = req.file ? normalizeImagePath(req.file.path) : null;

        if (!image_path) {
            return res.status(400).json({ message: 'Category image is required' });
        }

        const category = await Category.create({
            name,
            description,
            status: status || 'active',
            image_path
        });

        return res.status(201).json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const show = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        return res.json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const category = await findRecord(Category, req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (category.deleted_at) {
            return res.status(400).json({ message: 'Category is deleted. Restore it before editing.' });
        }

        const { name, description, status } = req.body;

        if (name !== undefined) category.name = name;
        if (description !== undefined) category.description = description;
        if (status !== undefined) category.status = status;
        if (req.file) {
            category.image_path = normalizeImagePath(req.file.path);
        }

        await category.save();

        return res.json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const destroy = async (req, res) => {
    try {
        const category = await findRecord(Category, req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (category.deleted_at) {
            return res.status(400).json({ message: 'Category is already deleted' });
        }

        await category.destroy();

        return res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const restore = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id, { paranoid: false });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        if (!category.deleted_at) return res.status(400).json({ message: 'Category is not deleted' });
        await category.restore();
        return res.json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const bulkDelete = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }
        const result = await Category.destroy({ where: { id: ids } });
        return res.json({ message: result + ' categories deleted successfully' });
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
    destroy,
    restore,
    bulkDelete
};
