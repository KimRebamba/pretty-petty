const { Category } = require('../models/associations');
const path = require('path');

function normalizeImagePath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/^public\//, '/');
}

const index = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['created_at', 'DESC']]
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

const update = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
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
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.destroy();

        return res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    index,
    store,
    update,
    destroy
};
