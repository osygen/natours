const { model } = require('mongoose');
const { Friend } = require('../models');

const { catchAsync, AppError } = require('../utils');
const { getAll, getOne } = require('./factoryFunctions');

exports.setFriendsQuery = (request, response, next) => {
  request.query.loggedUser = request.query?.loggedUser || request.user.id;
  request.query.fields = request.query?.fields || 'following followed addUser';

  next();
};

exports.getAllFriend = getAll(Friend);
exports.getUserFriends = getOne(Friend);

exports.checkFriendRequest = catchAsync(async (request, response, next) => {
  Object.keys(request.body).forEach((item) => {
    if (['loggedUser', 'friends', 'followed', 'createdAt'].includes(item))
      delete request.body[item];
  });

  if (request.user.id === request.body.addUser)
    return next(
      new AppError(
        'You are not allowed to make request to self. Please try again',
        403
      )
    );

  request.body.loggedUser = request.user._id;

  next();
});

exports.createFriend = catchAsync(async (request, response, next) => {
  if (request.body.following === false || request.body.following === null)
    request.body.following = true;

  if (!(await model('User').findById(request.body.addUser)))
    return next(new AppError(`No user was found. Please try again`, 404));

  const newDoc = await Friend.create(request.body);
  await Friend.follow(newDoc);

  response.status(200).json({
    status: 'success',
    data: {
      data: newDoc
    }
  });
});

exports.updateFriend = catchAsync(async (request, response, next) => {
  let doc = await Friend.findById(request.params.id);

  if (!doc) return next(new AppError(`No document found for that ID`, 404));

  // prettier-ignore
  if (doc.loggedUser.toHexString() !== request.user._id.toHexString())
    return next(new AppError(`document do not belong to the current user`, 401));

  doc.following ? (doc.following = false) : (doc.following = true);

  // doc = await Friend.follow(doc);
  doc = !(await Friend.follow(doc)) ? null : await doc.save();

  response.status(!doc ? 204 : 200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});
