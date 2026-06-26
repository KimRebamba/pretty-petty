const express = require('express');
const router = express.Router();

const Auth_Controller = require("../controllers/Auth_Controller");
const upload = require("../middlewares/upload");

router.post("/register", upload.single('image'), Auth_Controller.register);
router.post("/login", Auth_Controller.login);
router.post("/logout", Auth_Controller.logout);

router.get("/register", Auth_Controller.showRegister);
router.get("/login", Auth_Controller.showLogin);

module.exports = router;