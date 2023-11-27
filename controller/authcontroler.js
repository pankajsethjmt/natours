const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const User = require('../modal/userModal');
const catchAsync = require('../utlis/catchAsync');
const AppError = require('../utlis/appError');
const Email = require('../utlis/email');

const signInToken = async (id) => {
  const token = await jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const createSendToken = async (user, statusCode, req, res) => {
  const token = await signInToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  user.password = undefined;

  res.status(statusCode).json({
    message: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  await createSendToken(newUser, 201, req, res);
});

exports.logOut = (req, res) => {
  res.clearCookie('jwt');
  // res.cookie('jwt', 'loggedOut', {
  //   expires: new Date(Date.now() + 1000),
  //   httpOnly: true,
  // });
  res.status(200).json({ message: 'success' });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(
      new AppError('Please Provide valid email address & password', 400)
    );

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Email or Password is incorrect', 400));

  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  await createSendToken(user, 201, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (!token) {
    return next(
      new AppError('You are not login. Please log in first to get access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The User belonging to this token, no longer exits', 401)
    );
  }
  if (freshUser.checkPasswordChange(decoded.iat))
    return next(
      new AppError(
        'The User recently changed password! Please Login Again.',
        401
      )
    );
  req.user = freshUser;
  res.locals.user = freshUser;

  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      return next();
    }

    if (freshUser.checkPasswordChange(decoded.iat)) return next();
    res.locals.user = freshUser;
    return next();
  }
  next();
});

exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(
        new AppError(`User doesn't have permision to perform this action.`, 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('User not found with this email address', 404));
  }

  const resetToken = user.createResetPasswordToken();
  await user.save({ validateModifiedOnly: true });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;

  // const message = `Forgot Your Password. Submit a patch request with new password and password confirm at : ${resetURL}. \nIf you don't forgot your email. Just Ignore this email!. `;

  try {
    await new Email(user, resetURL).sendPasswordResetToken();

    // await sendEmail({
    //   email: req.body.email,
    //   subject: 'Your Password Reset Token ( Valid for 10 min)',
    //   message: message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to your registered Email Address.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({ validateModifiedOnly: true });

    return next(new AppError('Some Things Went Wrong. Please Try Again!', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const RecivedToken = req.params.token;

  const hashtoken = crypto
    .createHash('sha256')
    .update(RecivedToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashtoken,
  });

  // console.log(user);

  if (!user)
    return next(
      new AppError(
        'Invailid Token or Reset Password Token Expired. Please try to reset your password with register email address',
        400
      )
    );

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = Date.now() - 1000;
  user.passwordResetToken = undefined;
  user.passwordResetExpired = undefined;
  await user.save({ validateModifiedOnly: true });

  await createSendToken(user, 201, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user) return next(new AppError('No User Find. Please login again', 400));

  const validatePassword = await user.correctPassword(
    req.body.oldPassword,
    user.password
  );

  if (!validatePassword)
    return next(new AppError('Your Enter old Password is incorrect', 400));

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.passwordChangedAt = Date.now() - 1000;

  await user.save({ validateModifiedOnly: true });

  await createSendToken(user, 201, req, res);
});
