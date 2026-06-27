const { Product, Category, Product_Image, Review, User } = require('../models/associations');
const path = require('path');
const fs = require('fs');

function normalizeImagePath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/^public\//, '/');
}

const index = async (req, res) => {
    try {
        const where = {};
        if (req.query.category_id) {
            where.category_id = req.query.category_id;
        }

        const products = await Product.findAll({
            where,
            include: [
                { model: Category },
                {
                    model: Product_Image,
                    required: false
                },
                { model: Review, include: [{ model: User, attributes: ['id', 'first_name', 'last_name'] }] }
            ],
            order: [['created_at', 'DESC']]
        });

        return res.json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const show = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Category },
                { model: Product_Image },
                { model: Review, include: [{ model: User, attributes: ['id', 'first_name', 'last_name'] }] }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.json(product);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const store = async (req, res) => {
    try {
        const { name, category_id, description, price, stock, status } = req.body;

        const product = await Product.create({
            name,
            category_id,
            description,
            price,
            stock,
            status: status || 'active'
        });

        if (req.files && req.files.length > 0) {
            const imageRecords = req.files.map(file => ({
                product_id: product.id,
                image_path: normalizeImagePath(file.path)
            }));
            await Product_Image.bulkCreate(imageRecords);
        }

        const result = await Product.findByPk(product.id, {
            include: [
                { model: Category },
                { model: Product_Image }
            ]
        });

        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { name, category_id, description, price, stock, status } = req.body;

        if (name !== undefined) product.name = name;
        if (category_id !== undefined) product.category_id = category_id;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (stock !== undefined) product.stock = stock;
        if (status !== undefined) product.status = status;

        await product.save();

        if (req.files && req.files.length > 0) {
            const imageRecords = req.files.map(file => ({
                product_id: product.id,
                image_path: normalizeImagePath(file.path)
            }));
            await Product_Image.bulkCreate(imageRecords);
        }

        const result = await Product.findByPk(product.id, {
            include: [
                { model: Category },
                { model: Product_Image }
            ]
        });

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const destroy = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.destroy();

        return res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const destroyImage = async (req, res) => {
    try {
        const image = await Product_Image.findByPk(req.params.imageId);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        await image.destroy();

        return res.json({ message: 'Image deleted successfully' });
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
    destroyImage
};
