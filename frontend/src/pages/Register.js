import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/'); // Redirect to home page
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8 transition-colors">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md transition-colors">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Create Your Account</h2>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">I am a:</label>
            <select 
              name="user_type" 
              value={formData.user_type} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="job_seeker">Job Seeker</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a strong password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="1234567890"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {formData.user_type === 'recruiter' && (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Your Company"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary dark:bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-primary dark:text-blue-400 font-semibold hover:underline">Login here</Link>
        </p>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          <Link to="/" className="text-primary dark:text-blue-400 hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;