const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Category = sequelize.define("Category", {
     id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    image_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM([`active`, `inactive`]),
        allowNull: false,
        defaultValue: `active`
    },
    
}, 
{
  tableName: "categories",
  timestamps: true,      
  paranoid: true,        
  deletedAt: 'deleted_at',
  createdAt: 'created_at', 
  updatedAt: 'updated_at' 
});

module.exports = Category;