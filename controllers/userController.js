const { User } = require('../models');
const { catchAsync, AppError } = require('../utils');
const { getAll, getOne, deleteOne } = require('./factoryFunctions');

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User, {
  path: 'friends',
  select: '-following -followed -createdAt -friends -__v',
  match: { friends: 'friends' }
});
exports.deleteUser = deleteOne(User);

exports.createUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'route not defined, use /signUp'
  });
};

exports.updateUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'route not defined. Use: /updateMe'
  });
};

exports.updateMe = catchAsync(async (request, response, next) => {
  const { password, passwordConfirm } = request.body;
  if (password || passwordConfirm)
    return next(
      new AppError(
        `This route is not for password update. Please use: ${
          request.protocol
        }://${request.get('host')}/api/v1/users/updateMyPassword`,
        403
      )
    );
  const user = await User.findById(request.user._id);

  Object.keys(request.body).forEach((item) => {
    if (['name', 'email', 'role'].includes(item))
      user[item] = request.body[item];
  });

  await user.save({ validateModifiedOnly: true });

  response.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteMe = catchAsync(async (request, response, next) => {
  const user = await User.findById(request.user._id);
  user.active = false;
  user.recoverBefore = Date.now() + 10 * 24 * 60 * 60 * 1000;
  await user.save({ validateModifiedOnly: true });

  response.status(204).json({
    status: 'success',
    data: null
  });
});
