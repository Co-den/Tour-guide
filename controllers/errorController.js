//GLOBAL ERROR HANDLER
const AppError = require('../utils/appError');

//HANDLING INVALIDE DATABASE IDS
const handleCastErrorDB = err => {
    //message goes into our AppError;
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}


//HANDLING DUPLICATE DATABASE FIELDS;
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. please use another value`;
    return new AppError(message, 400);
}


//HANDLING MONGOOSE VALIDATION ERRORS
const handleValidatorErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalide input data.${errors.join('. ')}`;
    return new AppError(message, 400);
}
//jsonwebtokenerror
const handleJsonWebTokenError = () => new AppError('Invalid token!, please log in again', 401);

//TokenExpiredError
const handleTokenExpiredError = () => new AppError('Your token has expired!, please log in again', 401);

//development error
const devError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}


//production error
const prodError = (err, res) => {
    //operational error
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        //programming error
    } else {
        //2) send general message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }

};

module.exports = (err, req, res, next) => {
    //STORING THE ERROR INSIDE A VARIABLE.
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'


    if (process.env.NODE_ENV === 'development') {
        devError(err, res);

    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidatorError') error = handleValidatorErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError(error);
        if (error.name === 'TokenExpiredError') error = handleTokenExpiredError(error);
        prodError(error, res);
    }
    next();
}

