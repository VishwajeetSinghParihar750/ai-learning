const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createTaskSchema, updateTaskSchema } = require('../utils/validationSchemas');

const router = express.Router();

// All task routes are protected
router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(validate(createTaskSchema), createTask);

router
  .route('/:id')
  .get(getTask)
  .put(validate(updateTaskSchema), updateTask)
  .delete(deleteTask);

module.exports = router;
