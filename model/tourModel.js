const mongoose = require('mongoose');
const slugify = require('slugify');


const tourSchema = new mongoose.Schema({
    //schema objects
    name: {
        type: String,
        required: [true, "A tour must have a name"],
        unique: true,
        trim: true,
        maxLength: [40, 'A tour name must have less or equal to 40 characters'],
        minLength: [10, 'A tour have must have less or equal to 10 characters']
    },
    //new
    slug: String,
    duration: {
        type: Number,
        required: [true, "A tour must require a durationn"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have maxGroiupSize"]
    },
    difficulty: {
        type: String,
        required: [true, "A tour must have a difficulty"],
        enum: {
            values: ['easy', 'medium', 'hard'],
            message: 'Difficulty is either: easy, medium, hard'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.9,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "A tour must have a price"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            //this only points to current doc on NEW document creation
            validator: function (val) {
                return val < this.price
            },
            message: 'Discount price({VALUE}) shoule be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, "A tour must have a description"]
    },
    description: {
        type: String,
        trime: true
    },
    imageCover: {
        type: String,
        required: [true, "A tour must have a cover image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    //new
    secretTour: {
        type: Boolean,
        default: false
    }
},
    {
    //schema options
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
//VIRTUAL PROPERTIES
//basically fields we can define on our schema but it wont
//be saved on our DB
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create();
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});
tourSchema.post('save', function (doc, next) {
    console.log(doc);
    next();
});

//QUERY MIDDLEWARE: allows us to run functions before or after
//a query is executed
//tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.post(/^find/, function (doc, next) {
    console.log(`Query took ${Date.now() - this.start}milliseconds`);
    next();
});

//AGGREGATION MIDDLEWARE:
tourSchema.pre('aggregate', function (next) {
    //unshift is for adding an element at the begining of an array
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    console.log(this.pipeline());
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
