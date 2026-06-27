const { Product, Product_Image, Category } = require('../models/associations');
const { Op } = require('sequelize');

const search = async (req, res) => {
    try {
        const q = req.query.q;

        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const products = await Product.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } }
                ]
            },
            include: [
                {
                    model: Product_Image,
                    limit: 1,
                    where: { deletedAt: null },
                    required: false
                },
                {
                    model: Category,
                    attributes: ['name']
                }
            ],
            limit: 10,
            order: [['created_at', 'DESC']]
        });

        const results = products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image_path: p.Product_Images && p.Product_Images.length > 0 ? p.Product_Images[0].image_path : null,
            category_name: p.Category ? p.Category.name : null
        }));

        return res.json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    search
};