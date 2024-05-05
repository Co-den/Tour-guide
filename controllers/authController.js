const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');



//TOKEN
const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}


//Create new User
//SIGNING UP USERS
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });
    const token = signToken(newUser._id);
    res.status(201).json({
        status: "Success",
        token,
        message: "User created",
        data: {
            User: newUser
        }
    });
});



//LOGGING IN USER
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //1)check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    //2)check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user?.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //3)if everything is okay, send token to client
    const token = signToken(user._id);

    res.status(200).json({
        status: "Success",
        token
    });
});



//new middleware function for protecting routes
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user associated with this token no longer exists.', 401));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfterToken(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
});




//roles such as admins and normal users
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Check if user role is included in the allowed roles array
        if (!req.user || !roles.includes(req.user.role)) {
            // If user role is not included, return a 403 Forbidden error
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        // If user role is included, proceed to the next middleware
        next();
    };
};


//password reset
exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this email address', 404));
    }

    //2) Generate a random reset token
    const resetToken = user.passwordResetToken; // Assuming you have a method to generate the token in your user model

    //3) Save the user with the new reset token and expiration time
    await user.save({ validateBeforeSave: false });

    //4) Construct reset URL using hashed token
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}`;

    //5) Format message string without leading/trailing spaces
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}. If you didn't forget your password, please ignore this email.`;

    try {
        // Send email with the reset token URL
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: "success",
            message: 'Token sent to email!'
        });


    } catch (err) {
        // Log error or provide more detailed error messages
        console.error('Error sending email:', err);

        // Clear reset token and expiration time on error
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Please try again later.', 500));
    }
});




exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({
        passwordResetToken:
            hashedToken, passwordResetExpires:
            { $gt: Date.now() }
    });

    //2) if token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()

    //3) update changedpasswordAt property for the user

    //4) log the user in, send JWT token
    const token = signToken(user._id);

    res.status(200).json({
        status: "Success",
        token
    });
})