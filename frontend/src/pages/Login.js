import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
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
      await login(formData.email, formData.password);
      navigate('/'); // Redirect to home page
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 transition-colors">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md transition-colors">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Login to JobBoard</h2>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary dark:bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
          Don't have an account? <Link to="/register" className="text-primary dark:text-blue-400 font-semibold hover:underline">Sign up here</Link>
        </p>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          <Link to="/" className="text-primary dark:text-blue-400 hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;