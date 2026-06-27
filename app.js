require('dotenv').config();
require('./models/associations');

const cors = require('cors');
const express = require("express");
const path = require("path");
const sequelize = require("./config/db");
const cookieParser = require('cookie-parser');

const Auth_Routes = require("./routes/Auth_Routes");
const Product_Routes = require("./routes/Product_Routes");
const Category_Routes = require("./routes/Category_Routes");
const Review_Routes = require("./routes/Review_Routes");
const Cart_Routes = require("./routes/Cart_Routes");
const Order_Routes = require("./routes/Order_Routes");
const User_Routes = require("./routes/User_Routes");
const Dashboard_Routes = require("./routes/Dashboard_Routes");
const Search_Routes = require("./routes/Search_Routes");
const Profile_Routes = require("./routes/Profile_Routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(express.static("public"));

app.use("/api/auth", Auth_Routes);
app.use("/api/products", Product_Routes);
app.use("/api/categories", Category_Routes);
app.use("/api/reviews", Review_Routes);
app.use("/api/cart", Cart_Routes);
app.use("/api/orders", Order_Routes);
app.use("/api/users", User_Routes);
app.use("/api/dashboard", Dashboard_Routes);
app.use("/api/search", Search_Routes);
app.use("/api/profile", Profile_Routes);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "views/index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "views/index.html")));
app.get("/login.html", (req, res) => res.sendFile(path.join(__dirname, "views/login.html")));
app.get("/register.html", (req, res) => res.sendFile(path.join(__dirname, "views/register.html")));
app.get("/products.html", (req, res) => res.sendFile(path.join(__dirname, "views/products.html")));
app.get("/product_details.html", (req, res) => res.sendFile(path.join(__dirname, "views/product_details.html")));
app.get("/cart.html", (req, res) => res.sendFile(path.join(__dirname, "views/cart.html")));
app.get("/checkout.html", (req, res) => res.sendFile(path.join(__dirname, "views/checkout.html")));
app.get("/profile.html", (req, res) => res.sendFile(path.join(__dirname, "views/profile.html")));
app.get("/profile-orders.html", (req, res) => res.sendFile(path.join(__dirname, "views/profile-orders.html")));
app.get("/profile-reviews.html", (req, res) => res.sendFile(path.join(__dirname, "views/profile-reviews.html")));
app.get("/review.html", (req, res) => res.sendFile(path.join(__dirname, "views/review.html")));
app.get("/admin/dashboard.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/dashboard.html")));
app.get("/admin/admin-products.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-products.html")));
app.get("/admin/admin-categories.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-categories.html")));
app.get("/admin/admin-orders.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-orders.html")));
app.get("/admin/admin-reviews.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-reviews.html")));
app.get("/admin/admin-users.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-users.html")));

// Backward-compatible aliases
app.get("/admin/products.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-products.html")));
app.get("/admin/categories.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-categories.html")));
app.get("/admin/orders.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-orders.html")));
app.get("/admin/reviews.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-reviews.html")));
app.get("/admin/users.html", (req, res) => res.sendFile(path.join(__dirname, "views/admin/admin-users.html")));



async function testConnection() {
  try {
    await sequelize.authenticate();

    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

async function syncDatabase() {
  try {

    await sequelize.sync();
    console.log("Database synchronized successfully!");
    console.log(`>---------------------------------------------------------`);
    console.log(``);
  } catch (error) {
    console.error("Database sync failed:", error.message);
  }
}

app.listen(process.env.PORT, async () => {

    console.log(``);
    console.log(`>---------------------------------------------------------`);
    console.log(`Hi! :) this was made with ❤️  (2026). Developed by kim0.`);
    console.log(`Pretty Petty is running at: http://localhost:${process.env.PORT} `);
    console.log(``);

    testConnection();
    syncDatabase();
})
