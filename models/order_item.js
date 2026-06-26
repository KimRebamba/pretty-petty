const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order_Item = sequelize.define("Order_Item", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

}, {
    tableName: "order_items",
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at'
});

module.exports = Order_Item;