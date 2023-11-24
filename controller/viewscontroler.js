const Tour = require('../modal/tourModal');
const User = require('../modal/userModal');
const Booking = require('../modal/bookingModal');

const catchAsync = require('../utlis/catchAsync');

const AppError = require('../utlis/appError');

exports.getOverviews = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All The Tours',
    tours,
  });
});

exports.getTourDetails = catchAsync(async (req, res, next) => {
  const query = Tour.findOne({ slug: req.params.slug });

  const tour = await query.populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(
      new AppError(`No tour found for this  name :${req.params.slug}`, 404)
    );
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('loginForm', {
    title: 'Log in to Your Account',
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  const booking = await Booking.find({ user: req.user.id });

  const tourIds = await booking.map((el) => el.tour.id);

  const tours = await Tour.find({ _id: { $in: tourIds } });
  // console.log(tours);

  res.status(200).render('overview', {
    title: 'All The Tours',
    tours,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  // console.log(req.user);

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  // console.log(updatedUser);

  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});
