const User = require('../models/User');
const { signToken } = require('../utils/token');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email is already registered', 400));
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = signToken(user.id);

  // Exclude password from output
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and explicitly select password if omitted (by default it's not, but good to know)
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = signToken(user.id);

  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

const getMe = catchAsync(async (req, res, next) => {
  const user = req.user;
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
};
