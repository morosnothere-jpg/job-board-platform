import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyProfile, saveProfile } from '../services/api';
import NotificationBell from '../components/NotificationBell';

function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    bio: '',
    skills: [],
    experience: [],
    education: [],
    portfolio_links: [],
    resume_link: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
    availability: 'Available',
    expected_salary: ''
  });

  // Temporary form states
  const [newSkill, setNewSkill] = useState('');
  const [experienceForm, setExperienceForm] = useState({
    company: '', position: '', start_date: '', end_date: '', description: '', current: false
  });
  const [educationForm, setEducationForm] = useState({
    institution: '', degree: '', field: '', start_date: '', end_date: '', current: false
  });
  const [portfolioForm, setPortfolioForm] = useState({ title: '', url: '', description: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.user_type !== 'job_seeker') {
      alert('Only job seekers can create profiles');
      navigate('/dashboard');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await getMyProfile();
      if (response.data.profile) {
        setProfile(response.data.profile);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await saveProfile(profile);
      alert('Profile saved successfully!');
    } catch (error) {
      alert('Error saving profile: ' + (error.response?.data?.error || error.message));
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile({...profile, skills: [...(profile.skills || []), newSkill.trim()]});
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setProfile({...profile, skills: profile.skills.filter((_, i) => i !== index)});
  };

  const addExperience = () => {
    if (experienceForm.company && experienceForm.position) {
      setProfile({...profile, experience: [...(profile.experience || []), experienceForm]});
      setExperienceForm({company: '', position: '', start_date: '', end_date: '', description: '', current: false});
    }
  };

  const removeExperience = (index) => {
    setProfile({...profile, experience: profile.experience.filter((_, i) => i !== index)});
  };

  const addEducation = () => {
    if (educationForm.institution && educationForm.degree) {
      setProfile({...profile, education: [...(profile.education || []), educationForm]});
      setEducationForm({institution: '', degree: '', field: '', start_date: '', end_date: '', current: false});
    }
  };

  const removeEducation = (index) => {
    setProfile({...profile, education: profile.education.filter((_, i) => i !== index)});
  };

  const addPortfolio = () => {
    if (portfolioForm.title && portfolioForm.url) {
      setProfile({...profile, portfolio_links: [...(profile.portfolio_links || []), portfolioForm]});
      setPortfolioForm({title: '', url: '', description: ''});
    }
  };

  const removePortfolio = (index) => {
    setProfile({...profile, portfolio_links: profile.portfolio_links.filter((_, i) => i !== index)});
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate('/')}>
            JobBoard
          </h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-gray-700 hover:text-primary">
              Dashboard
            </button>
            <button onClick={logout} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <button 
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tell recruiters about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Location</label>
              <input
                type="text"
                value={profile.location || ''}
                onChange={(e) => setProfile({...profile, location: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Availability</label>
              <select
                value={profile.availability || 'Available'}
                onChange={(e) => setProfile({...profile, availability: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Available</option>
                <option>Available in 2 weeks</option>
                <option>Available in 1 month</option>
                <option>Not actively looking</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Expected Salary</label>
              <input
                type="text"
                value={profile.expected_salary || ''}
                onChange={(e) => setProfile({...profile, expected_salary: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., $80k - $100k"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Skills</h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add a skill (e.g., React, Node.js)"
            />
            <button onClick={addSkill} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600">
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((skill, index) => (
              <span key={index} className="bg-blue-100 text-primary px-3 py-1 rounded-full flex items-center gap-2">
                {skill}
                <button onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700">✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Work Experience</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={experienceForm.company}
                onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})}
                placeholder="Company"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={experienceForm.position}
                onChange={(e) => setExperienceForm({...experienceForm, position: e.target.value})}
                placeholder="Position"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="month"
                value={experienceForm.start_date}
                onChange={(e) => setExperienceForm({...experienceForm, start_date: e.target.value})}
                placeholder="Start Date"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="month"
                value={experienceForm.end_date}
                onChange={(e) => setExperienceForm({...experienceForm, end_date: e.target.value})}
                placeholder="End Date"
                disabled={experienceForm.current}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              />
            </div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={experienceForm.current}
                onChange={(e) => setExperienceForm({...experienceForm, current: e.target.checked, end_date: e.target.checked ? '' : experienceForm.end_date})}
              />
              <span className="text-sm text-gray-700">I currently work here</span>
            </label>
            <textarea
              value={experienceForm.description}
              onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})}
              placeholder="Description"
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <button onClick={addExperience} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-green-600">
              + Add Experience
            </button>
          </div>

          <div className="space-y-4">
            {(profile.experience || []).map((exp, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{exp.position}</h3>
                    <p className="text-primary">{exp.company}</p>
                    <p className="text-sm text-gray-600">
                      {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                    </p>
                    <p className="text-gray-700 mt-2">{exp.description}</p>
                  </div>
                  <button onClick={() => removeExperience(index)} className="text-red-500 hover:text-red-700">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Education</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={educationForm.institution}
                onChange={(e) => setEducationForm({...educationForm, institution: e.target.value})}
                placeholder="Institution"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={educationForm.degree}
                onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                placeholder="Degree"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={educationForm.field}
                onChange={(e) => setEducationForm({...educationForm, field: e.target.value})}
                placeholder="Field of Study"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="month"
                value={educationForm.start_date}
                onChange={(e) => setEducationForm({...educationForm, start_date: e.target.value})}
                placeholder="Start Date"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="month"
                value={educationForm.end_date}
                onChange={(e) => setEducationForm({...educationForm, end_date: e.target.value})}
                placeholder="End Date"
                disabled={educationForm.current}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              />
            </div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={educationForm.current}
                onChange={(e) => setEducationForm({...educationForm, current: e.target.checked, end_date: e.target.checked ? '' : educationForm.end_date})}
              />
              <span className="text-sm text-gray-700">I'm currently studying here</span>
            </label>
            <button onClick={addEducation} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-green-600">
              + Add Education
            </button>
          </div>

          <div className="space-y-4">
            {(profile.education || []).map((edu, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{edu.degree}</h3>
                    <p className="text-primary">{edu.institution}</p>
                    {edu.field && <p className="text-gray-600">{edu.field}</p>}
                    <p className="text-sm text-gray-600">
                      {edu.start_date} - {edu.current ? 'Present' : edu.end_date}
                    </p>
                  </div>
                  <button onClick={() => removeEducation(index)} className="text-red-500 hover:text-red-700">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Links */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Portfolio & Projects</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <input
                type="text"
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm({...portfolioForm, title: e.target.value})}
                placeholder="Project Title"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="url"
                value={portfolioForm.url}
                onChange={(e) => setPortfolioForm({...portfolioForm, url: e.target.value})}
                placeholder="URL (https://...)"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                value={portfolioForm.description}
                onChange={(e) => setPortfolioForm({...portfolioForm, description: e.target.value})}
                placeholder="Description"
                rows="2"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button onClick={addPortfolio} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-green-600">
              + Add Portfolio Item
            </button>
          </div>

          <div className="space-y-4">
            {(profile.portfolio_links || []).map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {item.url}
                    </a>
                    {item.description && <p className="text-gray-700 mt-2">{item.description}</p>}
                  </div>
                  <button onClick={() => removePortfolio(index)} className="text-red-500 hover:text-red-700">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Links</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Resume/CV Link</label>
              <input
                type="url"
                value={profile.resume_link || ''}
                onChange={(e) => setProfile({...profile, resume_link: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">LinkedIn</label>
              <input
                type="url"
                value={profile.linkedin_url || ''}
                onChange={(e) => setProfile({...profile, linkedin_url: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">GitHub</label>
              <input
                type="url"
                value={profile.github_url || ''}
                onChange={(e) => setProfile({...profile, github_url: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://github.com/your-username"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Personal Website</label>
              <input
                type="url"
                value={profile.website_url || ''}
                onChange={(e) => setProfile({...profile, website_url: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full py-4 bg-primary text-white rounded-lg hover:bg-blue-600 transition font-semibold text-lg disabled:opacity-50"
        >
          {saving ? 'Saving Profile...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

export default Profile;