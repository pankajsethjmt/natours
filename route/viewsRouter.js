const express = require('express');
const viewsControler = require('../controller/viewscontroler');
const authControler = require('../controller/authcontroler');
const bookingControler = require('../controller/bookingControler');

const router = express.Router();

router.get(
  '/',
  bookingControler.createBookingCheckout,
  authControler.isLoggedIn,
  viewsControler.getOverviews
);

router.get(
  '/tour/:slug',
  authControler.isLoggedIn,
  viewsControler.getTourDetails
);

router.get('/login', authControler.isLoggedIn, viewsControler.getLogin);
router.post(
  '/submit-user-data',
  authControler.protect,
  viewsControler.updateUser
);
router.get('/me', authControler.protect, viewsControler.getAccount);

router.get('/my-tours', authControler.protect, viewsControler.getMyTours);

module.exports = router;
