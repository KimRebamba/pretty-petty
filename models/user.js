const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
     id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    
    email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },

    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },

    delivery_address: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    role: {
        type: DataTypes.ENUM([`admin`, `customer`]),
        allowNull: false,
        defaultValue: `customer`
    },

    status: {
        type: DataTypes.ENUM([`active`, `inactive`]),
        allowNull: false,
        defaultValue: `active`
    },

    token: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },

    image_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    
}, 
{
  tableName: "users",
  timestamps: true,      
  paranoid: true,        
  deletedAt: 'deleted_at',
  createdAt: 'created_at', 
  updatedAt: 'updated_at' 
});

module.exports = User;