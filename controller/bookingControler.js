const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const factory = require('./handlorFactory');
const Tour = require('../modal/tourModal');

const Booking = require('../modal/bookingModal');

const catchAsync = require('../utlis/catchAsync');
const User = require('../modal/userModal');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const product = await stripe.products.create({
    name: `${tour.name} Tour`,
    description: tour.summary,
    images: [
      `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
    ],
  });
  const price = await stripe.prices.create({
    currency: 'inr',
    product: product.id,
    unit_amount: tour.price * 100,
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',

    success_url: `${req.protocol}://${req.get('host')}/webhook-checkout`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: price.id,
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = catchAsync(async (sessions) => {
  const tour = sessions.client_reference_id;
  const user = await User.findOne({ email: sessions.customer_email });
  const price = sessions.amount_total / 100;

  await Booking.create({
    tour,
    user,
    price,
  });
});

exports.webhookCheckout = (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  const endPointSecret = process.env.STRIPE_SIGNING_SECRET;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endPointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }
  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAlldoc(Booking);
exports.getBookings = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
