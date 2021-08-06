const { model } = require('mongoose');
//prettier-ignore
const {getAll,getOne,createOne,updateOne,deleteOne} = require('./factoryFunctions');
const { catchAsync, AppError } = require('../utils');
const { Review } = require('../models');

exports.checkReviewBody = catchAsync(async (request, response, next) => {
  if (!request.body.tour) request.body.tour = request.params.tourId;
  if (!request.body.user) request.body.user = request.user.id;

  const { tour, user } = request.body;

  const requestBody = await Promise.all(
    [model('Tour'), model('User')].map(
      async (Item, i) => await Item.findById([tour, user][i])
    )
  );

  if (!requestBody[0])
    return next(new AppError('A review must have a tour', 401));
  if (!requestBody[1])
    return next(new AppError('A review must have a user', 401));

  if (!(request.method === 'PATCH')) return next();

  const review = await Review.findOne({
    _id: request.params.id,
    tour: request.body.tour,
    user: { _id: request.body.user }
  });

  if (!review)
    return next(new AppError('A review must have a user and a tour', 401));

  next();
});

exports.getAllReviews = getAll(Review);
exports.getReview = getOne(Review);
exports.createReview = createOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
