const express = require('express');
const reviewController = require('../controller/reviewcontroler');

const authcontroler = require('../controller/authcontroler');

const router = express.Router({ mergeParams: true });

///only for login users
router.use(authcontroler.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authcontroler.restrictTo('admin', 'user'),
    reviewController.setTourUserIds,
    reviewController.creatReview
  );

router
  .route('/:id')
  .get(reviewController.getReviews)
  .patch(
    authcontroler.restrictTo('admin', 'user'),
    reviewController.setTourUserIds,
    reviewController.isOwner,
    reviewController.updateReview
  )
  .delete(
    authcontroler.restrictTo('admin', 'user'),
    reviewController.setTourUserIds,
    reviewController.isOwner,
    reviewController.deleteReview
  );

module.exports = router;
