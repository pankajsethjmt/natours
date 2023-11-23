const express = require('express');

const userController = require('../controller/usercontroller');

const authcontroler = require('../controller/authcontroler');

const reviewRouter = require('./reviewRouter');

const router = express.Router();

// router.param('id', tourController.checkId);
router.use('/:userId/reviews', reviewRouter);

///open for all user
router.post('/signup', authcontroler.signup);
router.post('/login', authcontroler.login);
router.get('/logout', authcontroler.logOut);
router.post('/forgotpassword', authcontroler.forgotPassword);
router.patch('/resetpassword/:token', authcontroler.resetPassword);

/// open for only login user

router.use(authcontroler.protect);

router.patch('/updateMyPassword', authcontroler.updatePassword);

router.get('/getMe', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUsersPhoto,
  userController.resizePhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

///open for admin
router.use(authcontroler.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

///only open for admin

module.exports = router;
