const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define("Product", {
     id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

    status: {
        type: DataTypes.ENUM([`active`, `inactive`]),
        allowNull: false,
        defaultValue: `active`
    },

}, 
{
  tableName: "products",
  timestamps: true,      
  paranoid: true,        
  deletedAt: 'deleted_at',
  createdAt: 'created_at', 
  updatedAt: 'updated_at' 
});

module.exports = Product;