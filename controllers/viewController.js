const { model } = require('mongoose');
const { catchAsync, AppError } = require('../utils');

exports.getOverview = catchAsync(async (request, response, next) => {
  const tours = await model('Tour').find();
  response.status(200).render('overview', { title: 'overview', tours });
});

exports.getTour = catchAsync(async (request, response, next) => {
  const tour = await model('Tour')
    .findOne({ slug: request.params.slug })
    .populate('reviews', 'review rating user');
  if (!tour) return next(new AppError(`No document found for that name`, 404));

  response.status(200).render('tour', { title: tour.slug, tour });
});

exports.getLoginForm = (request, response) => {
  !response.locals.user
    ? response
        .status(200)
        .render('login', { title: 'Log into to Your Account' })
    : setTimeout(() => response.redirect('/'), 1500);
};

exports.getMe = (request, response) => {
  response.status(200).render('account', { title: 'My Account page' });
};
