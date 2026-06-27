const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Cart_Item = sequelize.define("Cart_Item", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },

}, {
    tableName: "cart_items",
    timestamps: false,      

});

module.exports = Cart_Item;