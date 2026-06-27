const { Review, User, Product, Order, Order_Item } = require('../models/associations');
const { findRecord } = require('../utils/findRecord');

const index = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const where = {};
        if (req.query.product_id) {
            where.product_id = req.query.product_id;
        }
        if (req.query.verified === 'true') where.verified_at = { [require('sequelize').Op.ne]: null };
        if (req.query.verified === 'false') where.verified_at = null;

        const reviews = await Review.findAll({
            where,
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Product,
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']],
            paranoid: !includeDeleted
        });

        return res.json(reviews);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const show = async (req, res) => {
    try {
        const review = await findRecord(Review, req.params.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Product,
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const isOwner = review.user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this review' });
        }

        return res.json(review);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

async function userHasCompletedPurchase(user_id, product_id) {
    const purchased = await Order_Item.findOne({
        where: { product_id },
        include: [
            {
                model: Order,
                where: { user_id, status: 'Completed' },
                required: true
            }
        ]
    });
    return !!purchased;
}

const store = async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;
        const user_id = req.user.id;

        if (!product_id || !rating) {
            return res.status(400).json({ message: 'Product ID and rating are required' });
        }

        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const hasPurchased = await userHasCompletedPurchase(user_id, product_id);
        if (!hasPurchased) {
            return res.status(403).json({ message: 'You can only review products from completed orders' });
        }

        const existingReview = await Review.findOne({
            where: { user_id, product_id }
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product. Edit it from My Reviews.' });
        }

        const review = await Review.create({
            user_id,
            product_id,
            rating: parseInt(rating, 10),
            comment: comment || ''
        });

        const result = await Review.findByPk(review.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Product,
                    attributes: ['id', 'name']
                }
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
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this review' });
        }

        if (review.verified_at) {
            return res.status(400).json({ message: 'Verified reviews cannot be edited' });
        }

        const { rating, comment } = req.body;

        if (rating !== undefined) {
            const parsedRating = parseInt(rating, 10);
            if (parsedRating < 1 || parsedRating > 5) {
                return res.status(400).json({ message: 'Rating must be between 1 and 5' });
            }
            review.rating = parsedRating;
        }

        if (comment !== undefined) {
            review.comment = comment;
        }

        await review.save();

        const result = await Review.findByPk(review.id, {
            include: [
                {
                    model: Product,
                    attributes: ['id', 'name']
                }
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
        const review = await findRecord(Review, req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const isOwner = review.user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        if (review.deleted_at) {
            return res.status(400).json({ message: 'Review is already deleted' });
        }

        await review.destroy();

        return res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verify = async (req, res) => {
    try {
        const review = await findRecord(Review, req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.deleted_at) {
            return res.status(400).json({ message: 'Review is deleted. Restore it before verifying.' });
        }

        review.verified_at = new Date();
        await review.save();

        const result = await Review.findByPk(review.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Product,
                    attributes: ['id', 'name']
                }
            ]
        });

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const myReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Product,
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        return res.json(reviews);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const restore = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id, { paranoid: false });
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (!review.deleted_at) return res.status(400).json({ message: 'Review is not deleted' });
        await review.restore();
        return res.json(review);
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
        const result = await Review.destroy({ where: { id: ids } });
        return res.json({ message: result + ' reviews deleted successfully' });
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
    verify,
    myReviews,
    restore,
    bulkDelete
};
