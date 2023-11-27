const mongoose = require('mongoose');

const Review = require('../modal/reviewModal');
const AppError = require('../utlis/appError');
const ApiFeature = require('../utlis/appFeature');
const catchAsync = require('../utlis/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.isOwner = factory.isOwner(Review, 'user');

exports.getAllReviews = factory.getAllDoc(Review);
exports.getReviews = factory.getOne(Review);
exports.creatReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
