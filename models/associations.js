const User = require('./user');
const Category = require('./category');
const Product = require('./product');
const Product_Image = require('./product_image');
const Cart = require('./cart');
const Cart_Item = require('./cart_item');
const Order = require('./order');
const Order_Item = require('./order_item');
const Review = require('./review');

Category.hasMany(Product, { foreignKey: 'category_id', onDelete: 'CASCADE' });
Product.belongsTo(Category, { foreignKey: 'category_id', onDelete: 'CASCADE' });

Product.hasMany(Product_Image, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product_Image.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });

User.hasOne(Cart, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

Cart.hasMany(Cart_Item, { foreignKey: 'cart_id', onDelete: 'CASCADE' });
Cart_Item.belongsTo(Cart, { foreignKey: 'cart_id' });

Product.hasMany(Cart_Item, { foreignKey: 'product_id', onDelete: 'CASCADE'  });
Cart_Item.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(Order_Item, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Order_Item.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(Review, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Review.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

Product.hasMany(Order_Item, { foreignKey: 'product_id' });
Order_Item.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });

User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

module.exports = { 
    User, 
    Category, 
    Product, 
    Product_Image, 
    Cart, 
    Cart_Item, 
    Order, 
    Order_Item,
    Review
};