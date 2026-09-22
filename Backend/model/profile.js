const mongoose = require('mongoose');
const Joi = require('joi');

const profileSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        fullName: { type: String, required: true, trim: true },
        department: { type: String, default: 'General' },
        qualifications: [{ type: String }],
        certifications: [{
            name: { type: String, required: true },
            issueDate: { type: Date },
            expiryDate: { type: Date, required: true },
            status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
            fileUrl: { type: String }
        }],
        experienceYears: { type: Number, default: 0, min: 0 },
        shiftPreference: { 
            type: String, 
            enum: ['Morning', 'Evening', 'Night', 'Flexible'], 
            default: 'Flexible' 
        },
        phone: { type: String, default: '' },
        emergencyContact: {
            name: { type: String, default: '' },
            phone: { type: String, default: '' },
            relation: { type: String, default: '' }
        },
        maxShiftsPerWeek: { type: Number, default: 5, min: 1, max: 7 },
        status: { 
            type: String, 
            enum: ['Active', 'On Leave', 'Inactive'], 
            default: 'Active' 
        },
        profilePic: { type: String, default: '' }
    },
    { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);

const profileValidationSchema = Joi.object({
    fullName: Joi.string().required(),
    department: Joi.string().allow('', null),
    qualifications: Joi.array().items(Joi.string()).optional(),
    certifications: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        issueDate: Joi.date().optional(),
        expiryDate: Joi.date().required(),
        status: Joi.string().valid('Active', 'Expired').optional(),
        fileUrl: Joi.string().allow('', null).optional()
    })).optional(),
    experienceYears: Joi.number().min(0).optional(),
    shiftPreference: Joi.string().valid('Morning', 'Evening', 'Night', 'Flexible').optional(),
    phone: Joi.string().allow('', null),
    emergencyContact: Joi.object({
        name: Joi.string().allow('', null),
        phone: Joi.string().allow('', null),
        relation: Joi.string().allow('', null)
    }).optional(),
    maxShiftsPerWeek: Joi.number().min(1).max(7).optional(),
    status: Joi.string().valid('Active', 'On Leave', 'Inactive').optional(),
    profilePic: Joi.string().allow('', null)
});

module.exports = { Profile, profileValidationSchema };