const crypto = require('crypto');

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

// const slugify = require('slugify');

const validator = require('validator');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please tell your User Name'],

    trim: true,
  },

  email: {
    type: String,
    required: [true, 'Please tell Your email address'],
    lowercase: true,
    validator: [validator.isEmail, 'Please Provide a valid email address'],
    unique: true,
  },

  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A User must have password'],
    maxlength: [40, 'A user password must have less or equal to 40 charector'],
    minlength: [
      8,
      'A User passsword must have minimum or equal to 10 charector',
    ],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A User must confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password Must be same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpired: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.checkPasswordChange = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const passwordTimeStamp = this.passwordChangedAt.getTime() / 1000;

    return jwtTimestamp < passwordTimeStamp;
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(36).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpired = Date.now() + 10 * 60 * 1000;
  // console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
