const crypto = require('crypto');
const { promisify } = require('util');

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { catchAsync, AppError, sendEmail } = require('../utils');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

const createSendToken = (res, statusCode, user) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production' ? true : false,
    httpOnly: true
  });

  user.active = user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

exports.signup = catchAsync(async (request, response, next) => {
  [
    'role',
    'photo',
    'active',
    'passwordChangedAt',
    'passwordRestToken',
    'passwordResetExpire',
    'recoverBefore'
  ].forEach((item) => delete request.body[item]);
  const newUser = await User.create(request.body);

  createSendToken(response, 201, newUser);
});

exports.login = catchAsync(async (request, response, next) => {
  const { email, password } = request.body;

  let error;
  error =
    !(email && password) &&
    new AppError('Please provide email and password', 400);
  if (error) return next(error);

  const user = await User.findOne({ email }).select('+password');

  error =
    !(await user?.correctPassword(password, user.password)) && //same as !(user && (await user.correctPassword(password, user.password))) &&
    new AppError('incorrect email or password', 401);

  if (error) return next(error);

  // recover a deleted user
  if (user.recoverBefore && user.recoverBefore > Date.now()) {
    user.recoverBefore = undefined;
    user.active = true;
    await user.save({ validateModifiedOnly: true });
  }

  createSendToken(response, 201, user);
});

exports.logout = async (request, response) => {
  response.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production' ? true : false,
    httpOnly: true
  });

  response.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (request, response, next) => {
  const token =
    (request.headers.authorization?.startsWith('Bearer') &&
      request.headers.authorization.split(' ')[1]) ||
    request.cookies?.jwt;

  if (!token) return next(new AppError('Please login to get access', 401));

  const { id, iat } = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  const loggedUser = await User.findById(id);
  // if (!loggedUser) return next(new AppError('user do not exist', 401));

  if (await loggedUser?.passwordChangedAfter(iat))
    return next(new AppError('invalid user or password', 401));

  response.locals.user = request.user = loggedUser;

  next();
});

exports.isLoggedIn = async (request, response, next) => {
  if (!request.cookies.jwt) return next();

  try {
    const { id, iat } = await promisify(jwt.verify)(
      request.cookies.jwt,
      process.env.JWT_SECRET
    );

    const loggedUser = await User.findById(id);

    if (await loggedUser?.passwordChangedAfter(iat)) return next();

    response.locals.user = loggedUser;
  } catch (error) {
    return next();
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (request, response, next) => {
    const error =
      !roles.includes(request.user.role) &&
      new AppError('You have not been permitted', 403);
    if (error) return next(error);

    next();
  };
};

exports.forgotPassword = catchAsync(async (request, response, next) => {
  const user = await User.findOne({ email: request.body.email });

  let error =
    !user && new AppError(`No user found for: ${request.body.email}`, 404);
  if (error) return next(error);

  const resetToken = user.resetPassword();

  user.save({ validateModifiedOnly: true });

  const resetURL = `${request.protocol}://${request.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `use this : ${resetURL}`;
  console.log(message);
  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'reset password',
  //     message
  //   });

  //   response.status(200).json({
  //     status: 'success',
  //     message: 'email sent'
  //   });
  // } catch (error) {
  //   user.passwordResetExpire = undefined;
  //   user.passwordRestToken = undefined;
  //   await user.save({ validateModifiedOnly: true });
  //   return next(new AppError('error sending the email', 500));
  // }
});

exports.resetPassword = catchAsync(async (request, response, next) => {
  const hashToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpire: { $gt: Date.now() }
  }).select('+password');

  if (!user) return next(new AppError('invalid or expired Token', 400));

  if (await user.correctPassword(request.body.password, user.password))
    return next(new AppError('Please use a different Password', 400));

  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  createSendToken(response, 200, user);
});

exports.updatePassword = catchAsync(async (request, response, next) => {
  const user = await User.findOne(await request.user._id).select('+password');

  const { loggedPassword, password, passwordConfirm } = request.body;

  if (!(await user.correctPassword(loggedPassword, user.password))) {
    return next(new AppError('you are not correct', 400));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();

  createSendToken(response, 200, user);
});
