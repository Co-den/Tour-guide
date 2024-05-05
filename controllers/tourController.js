const Tour = require('../model/tourModel');
const APIfeatures = require('../utils/API-features');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const express = require('express');
const app = express();


app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    req.createdAt = new Date().toISOString();
    next();
});

//CONTROLLERS   
//CHEAP TOURS
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage, price";
    req.query.fields = "name, price, ratingsAverage, summary, difficulty";
    next();
};

//GET ALL TOUR-data)
exports.getAllTours = catchAsync(async (req, res, next) => {
    //EXECUTE QUERY
    const features = new APIfeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination()
    const tours = await features.query;
    //SEND RESPONSE
    res.status(200).json({
        status: 'success',
        createdAt: req.requestTime,
        results: tours.length,
        data: {
            tours
        }
    });
});

//GET SINGLE TOUR:
exports.singleTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});


//POST
//posting new tours
exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        createdAt: req.createdOn,
        data: {
            tour: newTour
        }
    });
});

//UPDATING OUR TOUR
exports.patchTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404))
    }
    res.status(200).json({
        status: "Success",
        data: {
            tour
        }
    });
});
//Handling delete request
exports.deleteTour = catchAsync(async (req, res, next) => {
    //we dont save anything to a variable because
    // we are not sending anything back to 
    //our client
   const tour = await Tour.findByIdAndDelete(req.params.id, req.body);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404))
    }
    res.status(204).json({
        status: "Success",
        data: null,
    });
});

//AGGREGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: 'ratingaQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
            }
        },
        {
            $sort: {
                avgPrice: 1
            }
        }
    ]);
    res.status(200).json({
        status: "Success",
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    //implement a function to calculate the busiest month of a given year
    //basically how many tours start in each of the month of the given year
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numTourStarts: -1
            }
        },
        {
            $limit: 12
        }

    ]);
    res.status(200).json({
        status: "Success",
        data: {
            plan
        }
    });
}
);