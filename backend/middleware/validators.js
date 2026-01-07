const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => err.msg)
        });
    }
    next();
};

// Auth Validators
const validateRegister = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    body('full_name')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    body('user_type')
        .isIn(['job_seeker', 'recruiter'])
        .withMessage('User type must be either job_seeker or recruiter'),
    body('phone')
        .optional({ checkFalsy: true })
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('company_name')
        .if(body('user_type').equals('recruiter'))
        .trim()
        .notEmpty()
        .withMessage('Company name is required for recruiters')
        .isLength({ max: 200 })
        .withMessage('Company name must not exceed 200 characters'),
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Job Validators
const validateCreateJob = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Job title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Job title must be between 3 and 200 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Job description is required')
        .isLength({ min: 50, max: 10000 })
        .withMessage('Job description must be between 50 and 10,000 characters'),
    body('company')
        .trim()
        .notEmpty()
        .withMessage('Company name is required')
        .isLength({ max: 200 })
        .withMessage('Company name must not exceed 200 characters'),
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ max: 200 })
        .withMessage('Location must not exceed 200 characters'),
    body('job_type')
        .isIn(['full-time', 'part-time', 'contract', 'flexible'])
        .withMessage('Invalid job type'),
    body('work_mode')
        .isIn(['on-site', 'remote', 'hybrid'])
        .withMessage('Invalid work mode'),
    body('salary_range')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Salary range must not exceed 100 characters'),
    body('requirements')
        .trim()
        .notEmpty()
        .withMessage('Job requirements are required')
        .isLength({ min: 20, max: 5000 })
        .withMessage('Requirements must be between 20 and 5,000 characters'),
    handleValidationErrors
];

const validateUpdateJob = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Job title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 50, max: 10000 })
        .withMessage('Job description must be between 50 and 10,000 characters'),
    body('company')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Company name must not exceed 200 characters'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Location must not exceed 200 characters'),
    body('job_type')
        .optional()
        .isIn(['full-time', 'part-time', 'contract', 'flexible'])
        .withMessage('Invalid job type'),
    body('work_mode')
        .optional()
        .isIn(['on-site', 'remote', 'hybrid'])
        .withMessage('Invalid work mode'),
    body('salary_range')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Salary range must not exceed 100 characters'),
    body('requirements')
        .optional()
        .trim()
        .isLength({ min: 20, max: 5000 })
        .withMessage('Requirements must be between 20 and 5,000 characters'),
    body('status')
        .optional()
        .isIn(['open', 'closed'])
        .withMessage('Invalid job status'),
    handleValidationErrors
];

// Profile Validators
const validateProfile = [
    body('bio')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Bio must not exceed 1,000 characters'),
    body('skills')
        .optional({ nullable: true })
        .custom((value) => {
            if (!value || value.length === 0) return true; // Allow empty/null
            if (!Array.isArray(value)) throw new Error('Skills must be an array');
            return true;
        }),
    body('experience')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Experience must not exceed 5,000 characters'),
    body('education')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Education must not exceed 2,000 characters'),
    body('portfolio_links')
        .optional({ nullable: true })
        .custom((value) => {
            if (!value || value.length === 0) return true; // Allow empty/null
            if (!Array.isArray(value)) throw new Error('Portfolio links must be an array');
            return true;
        }),
    body('resume_link')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .custom((value) => {
            if (!value) return true; // Allow empty
            if (!/^https?:\/\/.+/.test(value)) throw new Error('Resume link must be a valid URL');
            return true;
        }),
    body('location')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 200 })
        .withMessage('Location must not exceed 200 characters'),
    body('linkedin_url')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .custom((value) => {
            if (!value) return true; // Allow empty
            if (!/^https?:\/\/.+/.test(value)) throw new Error('LinkedIn URL must be a valid URL');
            return true;
        }),
    body('github_url')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .custom((value) => {
            if (!value) return true; // Allow empty
            if (!/^https?:\/\/.+/.test(value)) throw new Error('GitHub URL must be a valid URL');
            return true;
        }),
    body('website_url')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .custom((value) => {
            if (!value) return true; // Allow empty
            if (!/^https?:\/\/.+/.test(value)) throw new Error('Website URL must be a valid URL');
            return true;
        }),
    body('availability')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['immediate', '2-weeks', '1-month', 'not-available'])
        .withMessage('Invalid availability option'),
    body('expected_salary')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Expected salary must not exceed 100 characters'),
    body('avatar')
        .optional({ nullable: true, checkFalsy: true }),
    handleValidationErrors
];

// Application Validators
const validateApplication = [
    body('job_id')
        .notEmpty()
        .withMessage('Job ID is required')
        .isUUID()
        .withMessage('Invalid job ID format'),
    body('cover_letter')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Cover letter must not exceed 5,000 characters'),
    body('resume_url')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage('Resume URL must be a valid URL'),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateCreateJob,
    validateUpdateJob,
    validateProfile,
    validateApplication
};