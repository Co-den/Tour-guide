const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

//HANDLING UNCAUGHT EXCEPTIONS
//it should always be before our codes(app);
process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION! shutting down...');
        process.exit(1);
});

const app = require('./App');



//(1) CREATE A SERVER:'22
mongoose.connect(process.env.DATABASE).then(() => {
    console.log('db connection successful');
});


const port = process.env.PORT || 3000;
const localhost = process.env.LOCALHOST;


//LISTEN TO SERVER:
const server = app.listen(port, localhost, () => {
    console.log(`App is runing on ${localhost}:${port}`);
});


//ERRORS OUTSIDE EXPRESS UNHANDLED REJECTIONS
process.on('unHandledRejection', err => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! shutting down...');
    server.close(() => {
        process.exit(1);
    });
});


