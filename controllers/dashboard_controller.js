const { Order, User, Product, Category, Order_Item } = require('../models/associations');
const { fn, col, literal, Op } = require('sequelize');

const stats = async (req, res) => {
    try {
        const totalRevenue = await Order_Item.findAll({
            attributes: [[fn('SUM', literal('quantity * unit_price')), 'total']],
            raw: true
        }).then(result => result[0]?.total || 0);

        const totalOrders = await Order.count();
        const totalUsers = await User.count();
        const totalProducts = await Product.count();

        return res.json({
            totalRevenue: parseFloat(totalRevenue) || 0,
            totalOrders,
            totalUsers,
            totalProducts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const chartData = async (req, res) => {
    try {
        const orderStatusRows = await Order.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });
        const orderStatuses = orderStatusRows.map(row => ({
            status: row.status,
            count: parseInt(row.count, 10) || 0
        }));

        const productsPerCategoryRows = await Product.findAll({
            attributes: [
                'category_id',
                [fn('COUNT', col('Product.id')), 'count']
            ],
            include: [
                {
                    model: Category,
                    attributes: ['name']
                }
            ],
            group: ['category_id', 'Category.id', 'Category.name'],
            raw: true
        });
        const productsPerCategory = productsPerCategoryRows.map(row => ({
            category_name: row['Category.name'] || 'Uncategorised',
            count: parseInt(row.count, 10) || 0
        }));

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlySalesRows = await Order_Item.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('Order.created_at'), '%Y-%m'), 'month'],
                [fn('SUM', literal('quantity * unit_price')), 'total']
            ],
            include: [
                {
                    model: Order,
                    attributes: [],
                    where: {
                        created_at: { [Op.gte]: twelveMonthsAgo }
                    },
                    required: true
                }
            ],
            group: [fn('DATE_FORMAT', col('Order.created_at'), '%Y-%m')],
            order: [[fn('DATE_FORMAT', col('Order.created_at'), '%Y-%m'), 'ASC']],
            raw: true
        });
        const monthlySales = monthlySalesRows.map(row => ({
            month: row.month,
            total: parseFloat(row.total) || 0
        }));

        return res.json({
            orderStatuses,
            productsPerCategory,
            monthlySales
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    stats,
    chartData
};
