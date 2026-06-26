const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Review = sequelize.define("Review", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    rating: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },

    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },

}, {
    tableName: "reviews",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'product_id'] 
        }
    ]
});

module.exports = Review;