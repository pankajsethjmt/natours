const express = require('express');
const tourController = require('../controller/tourcontroller');

const authcontroler = require('../controller/authcontroler');

const reviewRouter = require('./reviewRouter');

const router = express.Router();

// router.param('id', tourController.checkId);
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getTourDistance);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-planer/:year')
  .get(
    authcontroler.protect,
    authcontroler.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authcontroler.protect,
    authcontroler.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.creatTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authcontroler.protect,
    authcontroler.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPhoto,
    tourController.resizeTourPhoto,
    tourController.updateTour
  )
  .delete(
    authcontroler.protect,
    authcontroler.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
