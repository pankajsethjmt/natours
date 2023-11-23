const mongoose = require('mongoose');

const { Schema } = mongoose;

const bookingSchema = new Schema({
  tour: {
    type: Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belongs to A Tour'],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belongs to a User'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price'],
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },

  paid: {
    type: Boolean,
    default: true,
  },
});
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
