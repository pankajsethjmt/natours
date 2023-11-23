const catchAsync = require('../utlis/catchAsync');

const AppError = require('../utlis/appError');
const ApiFeature = require('../utlis/appFeature');

exports.getAlldoc = (Model) =>
  catchAsync(async (req, res, next) => {
    let queryStr;
    if (req.params.tourId) {
      queryStr = { tour: req.params.tourId };
    } else if (req.params.userId) {
      queryStr = { user: req.params.userId };
    } else {
      queryStr = req.query;
    }

    const feature = new ApiFeature(Model, queryStr)
      .filter()
      .sort()
      .limit()
      .pagination();
    const doc = await feature.query;
    res.status(200).json({
      status: 'Sucess',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOption) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    console.log(req.params.id);

    const doc = await query.populate(popOption);

    if (!doc) {
      return next(
        new AppError(`No documents found for this  id :${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      status: 'Sucess',

      data: {
        data: doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(`No documents found for this  id :${req.params.id}`, 404)
      );
    }
    res.status(204).json({
      status: 'Delete',

      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(`No documents found for this  id :${req.params.id}`, 404)
      );
    }
    res.status(200).json({
      status: 'Sucess',

      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (!req.body)
      return next(
        new AppError('No inpute data recived to create documents', 400)
      );
    const doc = await Model.create(req.body);
    res.status(201).json({
      message: 'sucess',
      data: {
        data: doc,
      },
    });
  });

exports.isOwner = (Model, idField) =>
  catchAsync(async (req, res, next) => {
    const matchDoc = await Model.findById(req.params.id);

    if (req.user.id !== matchDoc[idField].id) {
      next(new AppError('Unauthorized', 403));
      return;
    }

    next();
  });
