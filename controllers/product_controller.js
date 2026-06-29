const { Product, Category, Product_Image, Review, User, Order, Order_Item } = require('../models/associations');
const path = require('path');
const fs = require('fs');
const { fn, col, literal, Op } = require('sequelize');
const { findRecord } = require('../utils/findRecord');

function normalizeImagePath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/^public\//, '/');
}

const index = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const where = {};
        if (req.query.category_id) {
            where.category_id = req.query.category_id;
        }
        if (req.query.status) {
            where.status = req.query.status;
        }

        const products = await Product.findAll({
            where,
            include: [
                { model: Category, paranoid: false },
                {
                    model: Product_Image,
                    required: false
                },
                { model: Review, include: [{ model: User, attributes: ['id', 'first_name', 'last_name'] }] }
            ],
            order: [['created_at', 'DESC']],
            paranoid: !includeDeleted
        });

        return res.json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const topSelling = async (req, res) => {
    try {
        // Get product IDs with most completed order quantities
        const topRows = await Order_Item.findAll({
            attributes: [
                'product_id',
                [fn('SUM', col('quantity')), 'total_sold']
            ],
            include: [
                {
                    model: Order,
                    attributes: [],
                    where: { status: 'Completed' },
                    required: true
                }
            ],
            group: ['product_id'],
            order: [[fn('SUM', col('quantity')), 'DESC']],
            limit: 3,
            raw: true
        });

        const topIds = topRows.map(r => r.product_id);
        let products = [];

        if (topIds.length > 0) {
            const topProducts = await Product.findAll({
                where: { id: topIds },
                include: [
                    { model: Category, paranoid: false },
                    { model: Product_Image },
                    { model: Review, include: [{ model: User, attributes: ['id', 'first_name', 'last_name'] }] }
                ]
            });
            // Preserve order by total_sold
            const byId = {};
            topProducts.forEach(p => { byId[p.id] = p; });
            products = topIds.map(id => byId[id]).filter(Boolean);
        }

        // Fill to 3 with newest if needed
        if (products.length < 3) {
            const existingIds = products.map(p => p.id);
            const fillers = await Product.findAll({
                where: existingIds.length > 0 ? { id: { [Op.notIn]: existingIds } } : {},
                include: [
                    { model: Category, paranoid: false },
                    { model: Product_Image },
                    { model: Review, include: [{ model: User, attributes: ['id', 'first_name', 'last_name'] }] }
                ],
                order: [['created_at', 'DESC']],
                limit: 3 - products.length
            });
            products = products.concat(fillers.map(f => f.get({ plain: true })));
        } else {
            products = products.map(p => p.get({ plain: true }));
        }

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
                { model: Category, paranoid: false },
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
        const product = await findRecord(Product, req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.deleted_at) {
            return res.status(400).json({ message: 'Product is deleted. Restore it before editing.' });
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
        const product = await findRecord(Product, req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.deleted_at) {
            return res.status(400).json({ message: 'Product is already deleted' });
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

const restore = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, { paranoid: false });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (!product.deleted_at) return res.status(400).json({ message: 'Product is not deleted' });
        await product.restore();
        return res.json(product);
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
        const result = await Product.destroy({ where: { id: ids } });
        return res.json({ message: result + ' products deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    index,
    topSelling,
    show,
    store,
    update,
    destroy,
    destroyImage,
    restore,
    bulkDelete
};
