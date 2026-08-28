const mongoose = require('mongoose');
const Joi = require('joi');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String },
    role: { 
      type: String, 
      enum: ['nurse', 'head_nurse', 'admin', 'manager'], 
      default: 'nurse' 
    },
    department: { type: String, default: 'General' },
    employeeId: { type: String, default: '' },
    profilePic: { type: String, default: '' }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// Joi Input Validations
const registerSchema = Joi.object({
  username: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('nurse', 'head_nurse', 'admin', 'manager').default('nurse'),
  department: Joi.string().optional(),
  employeeId: Joi.string().optional()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

module.exports = { User, registerSchema, loginSchema };