const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../modal/tourModal');
const AppError = require('../utlis/appError');
const ApiFeature = require('../utlis/appFeature');
const catchAsync = require('../utlis/catchAsync');
const factory = require('./handlorFactory');

const multerPhotoStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) =>
  file.mimetype.startsWith('image')
    ? cb(null, true)
    : cb(new AppError(' Not an image! Please upload only image', 400), false);

const upload = multer({
  storage: multerPhotoStorage,
  fileFilter: multerFilter,
});

exports.uploadTourPhoto = upload.fields([
  {
    name: 'images',
    maxCount: 3,
  },
  {
    name: 'imageCover',
    maxCount: 1,
  },
]);

exports.resizeTourPhoto = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  ///imageCover upload
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  ///images Upload
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const imageFile = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toFile(`public/img/tours/${imageFile}`);
      req.body.images.push(imageFile);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage name price';
  req.query.fields = 'name price ratingsAverage duration difficulty summary';

  next();
};

exports.getAllTours = factory.getAlldoc(Tour);

exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
  select: 'tour review',
});

exports.creatTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },

    {
      $group: {
        // _id: null,
        _id: { $toUpper: '$difficulty' },
        // _id: '$price',
        // _id: '$ratingsAverage',
        numTour: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        avgDuration: { $avg: '$duration' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },

    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'Sucess',
    results: stats.length,

    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },

    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStart: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'Sucess',
    results: plan.length,

    data: {
      plan,
    },
  });
});

exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng)
    return next(
      new AppError('Please provide lat & lng in < lat, lng> formate', 400)
    );

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'Sucess',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getTourDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'km' ? 0.001 : 0.000621371;

  if (!lat || !lng)
    return next(
      new AppError('Please provide lat & lng in < lat, lng> formate', 400)
    );

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Sucess',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   console.log(req.user.id);
//   const feature = new ApiFeature(Tour, req.query)
//     .filter()
//     .sort()
//     .limit()
//     .pagination();

//   const tours = await feature.query;
//   res.status(200).json({
//     status: 'Sucess',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

// exports.getAllTours = async (req, res) => {
//   try {
//     // ////Bulid Query
//     // const queryObj = { ...req.query };

//     // ///exclude some query
//     // const excludePage = ['page', 'fields', 'sort', 'limit'];
//     // excludePage.forEach((el) => delete queryObj[el]);

//     // //////Advance filter

//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//     // const filterObj = JSON.parse(queryStr);

//     // let query = Tour.find(filterObj);
//     // ///////Sorting

//     // if (req.query.sort) {
//     //   const sortBy = req.query.sort.split(',').join(' ');

//     //   query = query.sort(sortBy);
//     // } else {
//     //   query = query.sort('-createdAt name _id');
//     // }

//     // //// limiting
//     // if (req.query.fields) {
//     //   const fields = req.query.fields.split(',').join(' ');

//     //   query = query.select(fields);
//     // } else {
//     //   query = query.select('-__v');
//     // }

//     // ////Pagination
//     // const page = +req.query.page || 1;
//     // const limitNum = +req.query.limit || 3;
//     // const skipNum = (page - 1) * limitNum;
//     // query = query.skip(skipNum).limit(limitNum);

//     // if (req.query.page) {
//     //   const numTour = await Tour.countDocuments();
//     //   if (skipNum >= numTour) throw new Error(`This Page Number doesn't Exits`);
//     // }
//     const feature = new ApiFeature(Tour, req.query)
//       .filter()
//       .sort()
//       .limit()
//       .pagination();

//     const tours = await feature.query;
//     res.status(200).json({
//       status: 'Sucess',
//       results: tours.length,
//       data: {
//         tours,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err.message,
//     });
//   }
// };

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate({
//     path: 'reviews',
//     select: 'tour review',
//   });

//   if (!tour) {
//     return next(
//       new AppError(`No Tour found for this  id :${req.params.id}`, 404)
//     );
//   }

//   res.status(200).json({
//     status: 'Sucess',

//     data: {
//       tour,
//     },
//   });
// });

// exports.creatTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     message: 'sucess',
//     data: {
//       tour: newTour,
//     },
//   });

//   // console.log(req.body);
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(
//       new AppError(`No Tour found for this  id :${req.params.id}`, 404)
//     );
//   }
//   res.status(200).json({
//     status: 'Sucess',

//     data: {
//       tour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(
//       new AppError(`No Tour found for this  id :${req.params.id}`, 404)
//     );
//   }
//   res.status(204).json({
//     status: 'Delete',

//     data: null,
//   });
// });
