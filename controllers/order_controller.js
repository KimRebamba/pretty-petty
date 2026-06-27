const { Order, Order_Item, User, Product } = require('../models/associations');
const { Cart, Cart_Item } = require('../models/associations');
const nodemailer = require('nodemailer');

const index = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : null;

        const orders = await Order.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Order_Item,
                    include: [{ model: Product }]
                }
            ],
            order: [['created_at', 'DESC']],
            ...(limit ? { limit } : {})
        });

        return res.json(orders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const show = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Order_Item,
                    include: [{ model: Product }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.json(order);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const store = async (req, res) => {
    try {
        const { delivery_address } = req.body;
        const user_id = req.user.id;

        const cart = await Cart.findOne({
            where: { user_id },
            include: [
                {
                    model: Cart_Item,
                    required: false,
                    include: [{ model: Product }]
                }
            ]
        });

        if (!cart || !cart.Cart_Items || cart.Cart_Items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const user = await User.findByPk(user_id);
        const address = (delivery_address && delivery_address.trim()) || user.delivery_address;

        if (!address || !address.trim()) {
            return res.status(400).json({ message: 'Please add a delivery address in your profile before placing an order.' });
        }

        const order = await Order.create({
            user_id,
            status: 'Pending'
        });

        // Save delivery address to user profile when provided at checkout
        if (delivery_address && delivery_address.trim()) {
            user.delivery_address = delivery_address.trim();
            await user.save();
        }

        const orderItems = [];
        for (const item of cart.Cart_Items) {
            const product = item.Product;

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();

            orderItems.push({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: product.price * item.quantity,
                unit_price: product.price
            });
        }

        await Order_Item.bulkCreate(orderItems);

        // Clear the cart
        await Cart_Item.destroy({
            where: { cart_id: cart.id }
        });

        const result = await Order.findByPk(order.id, {
            include: [
                { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
                { model: Order_Item, include: [{ model: Product }] }
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
        const { status } = req.body;
        const { id } = req.params;

        const order = await Order.findByPk(id, {
            include: [
                { model: User },
                {
                    model: Order_Item,
                    include: [{ model: Product }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        // Send email notification
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT) || 587,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const itemsText = order.Order_Items.map(item =>
                `  - ${item.Product.name} x${item.quantity} @ $${parseFloat(item.unit_price).toFixed(2)} = $${parseFloat(item.price).toFixed(2)}`
            ).join('\n');

            const grandTotal = order.Order_Items.reduce(
                (sum, item) => sum + parseFloat(item.price),
                0
            );

            const emailBody = `
========================================
Order Receipt
========================================

Order #${order.id}
Date: ${new Date().toLocaleDateString()}
Status: ${order.status}

Customer: ${order.User.first_name} ${order.User.last_name}
Email: ${order.User.email}

----------------------------------------
Items:
${itemsText}

----------------------------------------
Grand Total: $${grandTotal.toFixed(2)}
========================================

Thank you for shopping with Pretty Petty!
            `.trim();

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: order.User.email,
                subject: `Order #${order.id} - Status Updated to ${status}`,
                text: emailBody
            });
        } catch (emailError) {
            console.error('Failed to send order email:', emailError.message);
            // Don't fail the request if email fails
        }

        const result = await Order.findByPk(order.id, {
            include: [
                { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
                { model: Order_Item, include: [{ model: Product }] }
            ]
        });

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const myOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Order_Item,
                    include: [{ model: Product }]
                }
            ],
            order: [['created_at', 'DESC']]
        });
        return res.json(orders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const cancel = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: Order_Item,
                    include: [{ model: Product }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        if (order.status === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        if (order.status === 'Completed') {
            return res.status(400).json({ message: 'Completed orders cannot be cancelled' });
        }

        for (const item of order.Order_Items) {
            const product = item.Product;
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        order.status = 'Cancelled';
        await order.save();

        const result = await Order.findByPk(order.id, {
            include: [
                {
                    model: Order_Item,
                    include: [{ model: Product }]
                }
            ]
        });

        return res.json(result);
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
    myOrders,
    cancel
};