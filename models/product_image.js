const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product_Image = sequelize.define("Product_Image", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    image_path: {
        type: DataTypes.STRING(255),
        allowNull: false
    },

}, {
    tableName: "product_images",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,       
    paranoid: true,
    deletedAt: 'deleted_at'
});

module.exports = Product_Image;