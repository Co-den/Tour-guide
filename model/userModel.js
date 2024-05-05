const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


//USER SCHEMA
const userSchema = new mongoose.Schema(
    //schema object
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
            unique: true,
        },
        email: {
            type: String,
            required: [true, "Please enter an email"],
            unique: true,
            lowercase: true,
            validate: {
                validator: function (value) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                },
                message: 'Invalid email address format'
            }
        },
        photo: [String],
        role: {
            type: String,
            enum: ['user', 'guide', 'lead-guide', 'admin'],
            default: 'user'
        },
        password: {
            type: String,
            required: [true, 'User must create a password'],
            minLength: 8,
            select: false
        },
        passwordConfirm: {
            type: String,
            required: [true, 'please confirm your password'],
            validate: {
                //this only works on save!!
                validator: function (el) {
                    return el === this.password;
                },
                message: 'password does not match!'
            }
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date
    }, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }

});

//password encryption
userSchema.pre('save', async function (next) {
    //only runs if password was modified
    if (!this.isModified('password')) return next();
    //hashing/encrypting the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    //deleting the conform password
    this.passwordConfirm = undefined;
    next();
});



//checking if the passwords match
userSchema.methods.correctPassword = async function (
    candidatePassword, userPassword) {
    return await bcrypt.compare(
        candidatePassword,
        userPassword);
}


//USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED
userSchema.methods.changedPasswordAfterToken = async function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        // Remember to specify the base, which is 10, for parseInt
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        // Convert milliseconds to seconds
        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}



//reset token
userSchema.methods.PasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    return resetToken;
};

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now()
    next();
});


const User = mongoose.model('User', userSchema);
module.exports = User;
