const mongoose = require('mongoose');

const slugify = require('slugify');

const User = require('./userModal');

const { Schema } = mongoose;

const tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A Tour name must have less or equal to 40 charector'],
      minlength: [10, 'A Tour name must have minimum or equal to 10 charector'],
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, 'A Tour must have duration Time'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have Group Size'],
      min: [2, 'A Tour must have 2 people in group'],
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A Tour must have either easy, medium or difficult ',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A Tour must have minimum 1 rating'],
      max: [5, 'A Tour have maximum 5 rating'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have Price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val <= this.price;
        },
        message: 'A Discounted price ({VALUE}) must be below regular price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A Tour must have Summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have Cover Image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: [Date],
    screatTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      description: String,
      address: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        description: String,
        address: String,
        day: Number,
      },
    ],
    // guides: Array,
    guides: [
      {
        type: Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/// indexing

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeak').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

////DOCUMENT mIDLEWARE

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.pre('save', async function (next) {
  const guidesPromiess = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidesPromiess);
  next();
});

//query Middleware

tourSchema.pre(/^find/, function (next) {
  this.find({ screatTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: 'name photo role',
  });
  next();
});
///Aggerator middleware

tourSchema.pre('aggregate', function (next) {
  const things = this.pipeline()[0];
  if (Object.keys(things)[0] !== '$geoNear') {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  } else {
    this.pipeline().splice(2, 0, { $match: { secretTour: { $ne: true } } });
  }

  // console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
