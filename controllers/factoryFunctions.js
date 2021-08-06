const { catchAsync, AppError, APIFeatures } = require('../utils');

exports.getAll = (Model) =>
  catchAsync(async (request, response, next) => {
    const features = new APIFeatures(Model.find(), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    response.status(200).json({
      status: 'success',
      requestedAt: request.requestTime,
      results: docs.length,
      data: {
        data: docs
      }
    });
  });

exports.getOne = (Model, ...populateOpt) =>
  catchAsync(async (request, response, next) => {
    const doc = await Model.findById(request.params.id).populate(
      ...populateOpt
    );

    if (!doc) return next(new AppError(`No document found for that ID`, 404));

    response.status(200).json({
      status: 'success',
      requestedAt: request.requestTime,
      data: {
        data: doc
      }
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const newDoc = await Model.create(request.body);

    response.status(200).json({
      status: 'success',
      postedAt: request.requestTime,
      data: {
        data: newDoc
      }
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (request, response, next) => {
    let doc = await Model.findById(request.params.id);

    if (!doc) return next(new AppError(`No document found for that ID`, 404));

    Object.keys(request.body).forEach(
      (item) => (doc[item] = request.body[item])
    );

    doc = await doc.save();

    response.status(200).json({
      status: 'success',
      updatedAt: request.requestTime,
      data: {
        data: doc
      }
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const doc = await Model.findById(request.params.id);

    if (!doc) return next(new AppError('no document found for that Id', 401));

    await doc.remove();

    response.status(204).json({
      status: 'success',
      deletedAt: request.requestTime,
      data: null
    });
  });
