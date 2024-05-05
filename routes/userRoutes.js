const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');


const router = express.Router();

//signup and login routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

//forgotpassword and reset password routes
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


//getting users route
router.route('/')
    .get(userController.getAllUser)


//getting single user route
router.route('/:id')
    .get(userController.singleUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;





