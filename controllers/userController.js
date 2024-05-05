const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');




exports.getAllUser = catchAsync(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: "Success",
        results: users.length,
        data: {
            users
        }
    });
});


exports.singleUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id)
    res.status(200).json({
        status: "Success",
        message: "user identified",
        data: {
            user
        }
    });
})

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: "Failed",
        message: "Route Not Defined"
    });
}
exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: "Failed",
        message: "Route Not Defined"
    });
}
