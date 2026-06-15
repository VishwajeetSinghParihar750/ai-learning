const Task = require('../models/Task');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getTasks = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { completed, page = 1, limit = 10 } = req.query;

  // Build query condition
  const whereCondition = { userId };
  if (completed !== undefined) {
    whereCondition.completed = completed === 'true';
  }

  // Pagination logic
  const offset = (page - 1) * limit;
  
  const { count, rows: tasks } = await Task.findAndCountAll({
    where: whereCondition,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / limit),
    data: {
      tasks,
    },
  });
});

const getTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const task = await Task.findOne({ where: { id, userId } });

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

const createTask = catchAsync(async (req, res, next) => {
  const { title, description, completed } = req.body;
  const userId = req.user.id;

  const task = await Task.create({
    title,
    description,
    completed,
    userId,
  });

  res.status(201).json({
    status: 'success',
    data: {
      task,
    },
  });
});

const updateTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, description, completed } = req.body;

  const task = await Task.findOne({ where: { id, userId } });

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (completed !== undefined) task.completed = completed;

  await task.save();

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

const deleteTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const task = await Task.findOne({ where: { id, userId } });

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  await task.destroy();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
