const crypto = require('crypto');
const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
      minLength: [8, 'name is minimum of 8 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add a valid email'],
      validate: [isEmail, 'Please provide a valid email'],
      unique: true,
      lowerCase: true
    },
    photo: { type: 'String', default: 'default.jpg' },
    role: {
      type: 'String',
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    stats: {
      friends: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      follower: { type: Number, default: 0 }
    },
    password: {
      type: 'String',
      required: [true, 'Please provide a password'],
      minLength: [8, 'minimum of 8 characters'],
      select: false
    },
    passwordConfirm: {
      type: 'String',
      required: [true, 'Please provide a password'],
      validate: [
        function (val) {
          return val === this.password;
        },
        'password are not the same'
      ]
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    },
    recoverBefore: {
      type: 'Date'
    },
    passwordChangedAt: 'Date',
    passwordResetToken: 'String',
    passwordResetExpire: 'Date'
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual('friends', {
  ref: 'Friend',
  localField: '_id',
  foreignField: 'loggedUser'
});

if (!process.argv.includes('user')) {
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    next();
  });

  userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;

    next();
  });
}

userSchema.pre('save', async function (next) {
  if (this.isNew || !this.isModified('role')) return next();

  const tours = await model('Tour').find({ guides: { $all: [this.id] } });
  if (!tours || tours?.length < 1) return next();
  tours.forEach(async (tour) => await tour.save());

  next();
});

userSchema.pre([/^find/, 'deleteOne'], function (next) {
  this.find({
    $or: [{ recoverBefore: { $gt: Date.now() } }, { active: { $ne: false } }]
  });

  next();
});

userSchema.methods.correctPassword = async function (
  loginPassword,
  dbPassword
) {
  return await bcrypt.compare(loginPassword, dbPassword);
};

userSchema.methods.passwordChangedAfter = async function (JWTTimeStamp) {
  return (
    this.passwordChangedAt &&
    JWTTimeStamp < parseInt(this.passwordChangedAt.getTime() / 1000, 10)
  );
};

userSchema.methods.resetPassword = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = model('User', userSchema);
module.exports = User;
