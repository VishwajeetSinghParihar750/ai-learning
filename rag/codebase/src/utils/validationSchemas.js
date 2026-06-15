const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be at least 2 characters long',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email cannot be empty',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Password cannot be empty',
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email cannot be empty',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required',
  }),
});

const createTaskSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'string.empty': 'Title cannot be empty',
    'any.required': 'Title is required',
  }),
  description: Joi.string().allow('', null).optional(),
  completed: Joi.boolean().optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().allow('', null).optional(),
  completed: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'Please provide at least one field to update (title, description, completed)',
});

module.exports = {
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
};
