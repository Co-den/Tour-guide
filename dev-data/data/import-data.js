const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('../../model/tourModel');

//CONNECTING TO DB
mongoose.connect(process.env.DATABASE).then(() => {
    console.log('db connection successful');
});

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

//IMPORT DATA INTO DB
//USING FUNCTIONS
const exportData = async () => {
    try {
        await Tour.create(tours);
        console.log('Data succefully loaded!');
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

//DELETE EXISTING DATA IN THE DB
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log("Successfully deleted");
    } catch (err) {
        console.log(`Unsuccessful ${err}`);
    }
    process.exit();
}


//RUNNING OUR FUNCTIONS
if (process.argv[2] === '--import') {
    exportData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
