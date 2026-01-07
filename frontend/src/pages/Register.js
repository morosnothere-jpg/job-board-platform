import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { register } from '../services/api';
import { toast } from 'sonner';
import DarkModeToggle from '../components/DarkModeToggle';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    user_type: 'job_seeker',
    phone: '',
    company_name: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Real-time email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time password validation
  useEffect(() => {
    const password = formData.password;
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
  }, [formData.password]);

  // Real-time field validation
  useEffect(() => {
    const newErrors = {};

    if (touched.email && formData.email) {
      if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (touched.full_name && formData.full_name) {
      if (formData.full_name.length < 2) {
        newErrors.full_name = 'Name must be at least 2 characters';
      }
    }

    if (touched.password && formData.password) {
      const { minLength, hasUppercase, hasLowercase, hasNumber } = passwordValidation;
      if (!minLength || !hasUppercase || !hasLowercase || !hasNumber) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    if (formData.user_type === 'recruiter' && touched.company_name && !formData.company_name) {
      newErrors.company_name = 'Company name is required for recruiters';
    }

    setErrors(newErrors);
  }, [formData, touched, passwordValidation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleBlur = (field) => {
    setTouched({
      ...touched,
      [field]: true
    });
  };

  const isFormValid = () => {
    return (
      validateEmail(formData.email) &&
      formData.full_name.length >= 2 &&
      passwordValidation.minLength &&
      passwordValidation.hasUppercase &&
      passwordValidation.hasLowercase &&
      passwordValidation.hasNumber &&
      (formData.user_type !== 'recruiter' || formData.company_name)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      full_name: true,
      company_name: true
    });

    if (!isFormValid()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register(formData);
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      const errorDetails = error.response?.data?.details;
      if (errorDetails && errorDetails.length > 0) {
        toast.error(errorDetails[0]); // Show first validation error
      } else {
        toast.error(errorMessage);
      } setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8 transition-colors">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Account</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Join JobBoard today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 space-y-5 transition-colors">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={() => handleBlur('full_name')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.full_name && touched.full_name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                }`}
              placeholder="John Doe"
            />
            {errors.full_name && touched.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.email && touched.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                }`}
              placeholder="name@email.com"
            />
            {errors.email && touched.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.password && touched.password
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                }`}
              placeholder="••••••••"
            />

            {/* Password Requirements */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <PasswordRequirement
                  met={passwordValidation.minLength}
                  text="At least 8 characters"
                />
                <PasswordRequirement
                  met={passwordValidation.hasUppercase}
                  text="At least 1 uppercase letter"
                />
                <PasswordRequirement
                  met={passwordValidation.hasLowercase}
                  text="At least 1 lowercase letter"
                />
                <PasswordRequirement
                  met={passwordValidation.hasNumber}
                  text="At least 1 number"
                />
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* User Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I am a *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.user_type === 'job_seeker'
                ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}>
                <input
                  type="radio"
                  name="user_type"
                  value="job_seeker"
                  checked={formData.user_type === 'job_seeker'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Job Seeker</span>
              </label>

              <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.user_type === 'recruiter'
                ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}>
                <input
                  type="radio"
                  name="user_type"
                  value="recruiter"
                  checked={formData.user_type === 'recruiter'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Recruiter</span>
              </label>
            </div>
          </div>

          {/* Company Name (Conditional) */}
          {formData.user_type === 'recruiter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                onBlur={() => handleBlur('company_name')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.company_name && touched.company_name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                  }`}
                placeholder="Your Company Inc."
              />
              {errors.company_name && touched.company_name && (
                <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className="w-full bg-primary dark:bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary dark:text-blue-400 hover:underline font-semibold"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

// Password Requirement Component
function PasswordRequirement({ met, text }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
      )}
      <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
        {text}
      </span>
    </div>
  );
}

export default Register;