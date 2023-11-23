const mongoose = require('mongoose');

const User = require('./userModal');

const Tour = require('./tourModal');
const catchAsync = require('../utlis/catchAsync');

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, 'Review Can not be Empty'],
    },
    rating: {
      type: Number,
      min: [1, 'A Tour must have minimum 1 rating'],
      max: [5, 'A Tour have maximum 5 rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belongs to A Tour'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belongs to a User'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },

    {
      $group: {
        _id: '$tour',
        numRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,

      ratingsQuantity: stats[0].numRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// eslint-disable-next-line prefer-arrow-callback
reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
