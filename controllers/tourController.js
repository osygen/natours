//prettier-ignore
const {getAll,getOne,createOne,updateOne,deleteOne} = require('./factoryFunctions');
const { Tour } = require('../models');
const { catchAsync, APIFeatures, AppError } = require('../utils');

exports.aliasTopTours = (request, response, next) => {
  request.query.limit = '5';
  request.query.sort = '-ratingsAverage,price';
  request.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.getAllTours = getAll(Tour);
exports.getTour = getOne(Tour, 'reviews', '-__v');
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

exports.checkTourBody = catchAsync(async (request, response, next) => {
  Object.keys(request.body).forEach((item) => {
    if (['ratingsQuantity', 'ratingsAverage', 'createdAt'].includes(item))
      delete request.body[item];
  });

  next();
});

exports.getTourStat = catchAsync(async (request, response, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    { $sort: { avgPrice: 1 } }
  ]);

  response.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (request, response, next) => {
  const year = request.params.year;
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
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
        numTours: { $sum: 1 },
        tour: { $push: '$name' }
      }
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTours: -1 } }
    // { $limit: 6 },
  ]);

  response.status(200).json({
    status: 'success',
    data: {
      total: plan.length,
      plan
    }
  });
});
