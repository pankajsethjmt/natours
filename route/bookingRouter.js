const express = require('express');
const bookingControler = require('../controller/bookingControler');
const authControler = require('../controller/authcontroler');

const router = express.Router();

router.use(authControler.protect);

router.get('/checkout-session/:tourId', bookingControler.getCheckoutSession);

router.use(authControler.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingControler.getAllBookings)
  .post(bookingControler.createBooking);

router
  .route('/:id')
  .patch(bookingControler.updateBooking)
  .delete(bookingControler.deleteBooking);

module.exports = router;
