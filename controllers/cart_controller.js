const { Cart, Cart_Item, Product, Product_Image } = require('../models/associations');

const show = async (req, res) => {
    try {
        let cart = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Cart_Item,
                    required: false,
                    include: [
                        {
                            model: Product,
                            include: [
                                { model: Product_Image }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!cart) {
            return res.json({ items: [] });
        }

        return res.json(cart);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addItem = async (req, res) => {
    try {
        const product_id = parseInt(req.body.product_id, 10);
        const quantity = parseInt(req.body.quantity, 10) || 1;

        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
        }

        let cart = await Cart.findOne({ where: { user_id: req.user.id } });
        if (!cart) {
            cart = await Cart.create({ user_id: req.user.id });
        }

        const [cartItem, created] = await Cart_Item.findOrCreate({
            where: { cart_id: cart.id, product_id },
            defaults: { quantity }
        });

        if (!created) {
            if (cartItem.quantity + quantity > product.stock) {
                return res.status(400).json({ message: 'Adding this quantity would exceed available stock (' + product.stock + ')' });
            }
            cartItem.quantity += quantity;
            await cartItem.save();
        }

        const result = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Cart_Item,
                    required: false,
                    include: [
                        {
                            model: Product,
                            include: [{ model: Product_Image }]
                        }
                    ]
                }
            ]
        });

        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;

        const cartItem = await Cart_Item.findByPk(itemId);
        if (!cartItem) return res.status(404).json({ message: 'Cart item not found' });

        const product = await Product.findByPk(cartItem.product_id);
        if (product && quantity > product.stock) {
            return res.status(400).json({ message: 'Quantity exceeds available stock (' + product.stock + ')' });
        }

        if (quantity <= 0) {
            await cartItem.destroy();
            return res.json({ message: 'Item removed from cart' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        const result = await Cart_Item.findByPk(cartItem.id, {
            include: [
                {
                    model: Product,
                    include: [{ model: Product_Image }]
                }
            ]
        });

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const removeItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cartItem = await Cart_Item.findByPk(itemId);

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        await cartItem.destroy();

        return res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const clear = async (req, res) => {
    try {
        const cart = await Cart.findOne({ where: { user_id: req.user.id } });

        if (cart) {
            await Cart_Item.destroy({
                where: { cart_id: cart.id }
            });
        }

        return res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    show,
    addItem,
    updateItem,
    removeItem,
    clear
};