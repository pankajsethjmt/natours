const multer = require('multer');
const sharp = require('sharp');

const User = require('../modal/userModal');
const catchAsync = require('../utlis/catchAsync');
const AppError = require('../utlis/appError');
const factory = require('./handlorFactory');

// const multerPhotoStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerPhotoStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) =>
  file.mimetype.startsWith('image')
    ? cb(null, true)
    : cb(new AppError(' Not an image! Please upload only image', 400), false);

const upload = multer({
  storage: multerPhotoStorage,
  fileFilter: multerFilter,
});

exports.uploadUsersPhoto = upload.single('photo');

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObject = (obj, ...allowedfileds) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedfileds.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAlldoc(User);

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

// const allowedfiledsToUpdate = ['name', 'email', 'photo'];
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: 'sucess',
//     results: users.length,

//     data: {
//       users,
//     },
//   });
// });

exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  res.status(201).json({
    status: 'success',
    data: {
      newUser,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.body);

  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'You Cannot change Password in this route. For Password change use route of /updateMyPassword !',
        400
      )
    );

  const newObj = filterObject(req.body, 'name', 'email');
  if (req.file) newObj.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, newObj, {
    validateModifiedOnly: true,
    new: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'success',
    data: {
      data: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    satus: 'success',
    message: 'User successfully deleted',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
