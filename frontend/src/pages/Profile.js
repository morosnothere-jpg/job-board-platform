import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyProfile, saveProfile } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';
import AvatarSelector from '../components/AvatarSelector';
import AvatarDisplay from '../components/AvatarDisplay';
import ProfileDropdown from '../components/ProfileDropdown';

function Profile() {
  const { user, logout, updateAvatar } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const navigationContext = useContext(UNSAFE_NavigationContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNavigationBlocked, setIsNavigationBlocked] = useState(false);
  
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

  // Block navigation when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || !navigationContext?.navigator) return;

    const { navigator } = navigationContext;
    const originalPush = navigator.push;
    const originalReplace = navigator.replace;
    const originalGo = navigator.go;
    const originalBack = navigator.back;
    const originalForward = navigator.forward;

    const confirmNavigation = (callback, ...args) => {
      if (hasUnsavedChanges) {
        const shouldProceed = window.confirm(
          'You have unsaved changes. Do you want to leave without saving?'
        );
        if (shouldProceed) {
          setHasUnsavedChanges(false);
          setTimeout(() => callback.apply(navigator, args), 0);
        }
      } else {
        callback.apply(navigator, args);
      }
    };

    navigator.push = (...args) => confirmNavigation(originalPush, ...args);
    navigator.replace = (...args) => confirmNavigation(originalReplace, ...args);
    navigator.go = (...args) => confirmNavigation(originalGo, ...args);
    navigator.back = (...args) => confirmNavigation(originalBack, ...args);
    navigator.forward = (...args) => confirmNavigation(originalForward, ...args);

    return () => {
      navigator.push = originalPush;
      navigator.replace = originalReplace;
      navigator.go = originalGo;
      navigator.back = originalBack;
      navigator.forward = originalForward;
    };
  }, [hasUnsavedChanges, navigationContext]);

  // Warn before leaving with unsaved changes (browser refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleLogoutWithWarning = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to logout without saving?')) {
        setHasUnsavedChanges(false);
        logout();
      }
    } else {
      logout();
    }
  };

  const handleNavigationWithWarning = (path) => {
    if (hasUnsavedChanges) {
      const shouldProceed = window.confirm(
        'You have unsaved changes. Do you want to leave without saving?'
      );
      if (shouldProceed) {
        setHasUnsavedChanges(false);
        setTimeout(() => navigate(path), 0);
      }
    } else {
      navigate(path);
    }
  };

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
      // Update avatar if changed
      if (selectedAvatar !== user.avatar) {
        await updateAvatar(selectedAvatar);
      }
      
      // Save profile
      await saveProfile(profile);
      setHasUnsavedChanges(false);
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
      setHasUnsavedChanges(true);
    }
  };

  const removeSkill = (index) => {
    setProfile({...profile, skills: profile.skills.filter((_, i) => i !== index)});
    setHasUnsavedChanges(true);
  };

  const addExperience = () => {
    if (experienceForm.company && experienceForm.position) {
      setProfile({...profile, experience: [...(profile.experience || []), experienceForm]});
      setExperienceForm({company: '', position: '', start_date: '', end_date: '', description: '', current: false});
      setHasUnsavedChanges(true);
    }
  };

  const removeExperience = (index) => {
    setProfile({...profile, experience: profile.experience.filter((_, i) => i !== index)});
    setHasUnsavedChanges(true);
  };

  const addEducation = () => {
    if (educationForm.institution && educationForm.degree) {
      setProfile({...profile, education: [...(profile.education || []), educationForm]});
      setEducationForm({institution: '', degree: '', field: '', start_date: '', end_date: '', current: false});
      setHasUnsavedChanges(true);
    }
  };

  const removeEducation = (index) => {
    setProfile({...profile, education: profile.education.filter((_, i) => i !== index)});
    setHasUnsavedChanges(true);
  };

  const addPortfolio = () => {
    if (portfolioForm.title && portfolioForm.url) {
      setProfile({...profile, portfolio_links: [...(profile.portfolio_links || []), portfolioForm]});
      setPortfolioForm({title: '', url: '', description: ''});
      setHasUnsavedChanges(true);
    }
  };

  const removePortfolio = (index) => {
    setProfile({...profile, portfolio_links: profile.portfolio_links.filter((_, i) => i !== index)});
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const firstName = user.full_name.split(' ')[0];
  const userTypeDisplay = '[Freelancer]';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-blue-400 cursor-pointer" onClick={() => handleNavigationWithWarning('/')}>
              JobBoard
            </h1>
            <div className="flex gap-3 items-center">
              <DarkModeToggle />
              <NotificationBell />
              <ProfileDropdown 
                user={user} 
                onLogout={handleLogoutWithWarning}
                onNavigate={handleNavigationWithWarning}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          <button 
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-3 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {hasUnsavedChanges && (
          <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded mb-6">
            ⚠️ You have unsaved changes. Remember to save your profile!
          </div>
        )}

        {/* Avatar Selection */}
        <AvatarSelector 
          currentAvatar={selectedAvatar} 
          onSelect={(avatar) => {
            setSelectedAvatar(avatar);
            setHasUnsavedChanges(true);
          }}
        />

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Basic Information</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => {
                setProfile({...profile, bio: e.target.value});
                setHasUnsavedChanges(true);
              }}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Tell recruiters about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Location</label>
              <input
                type="text"
                value={profile.location || ''}
                onChange={(e) => {
                  setProfile({...profile, location: e.target.value});
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Availability</label>
              <select
                value={profile.availability || 'Available'}
                onChange={(e) => {
                  setProfile({...profile, availability: e.target.value});
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option>Available</option>
                <option>Available in 2 weeks</option>
                <option>Available in 1 month</option>
                <option>Not actively looking</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Skills</h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Add a skill"
            />
            <button onClick={addSkill} type="button" className="px-4 py-2 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 whitespace-nowrap flex-shrink-0">
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((skill, index) => (
              <span key={index} className="bg-blue-100 dark:bg-blue-900 text-primary dark:text-blue-300 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                {skill}
                <button type="button" onClick={() => removeSkill(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-600">✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Work Experience</h2>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={experienceForm.company}
                onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})}
                placeholder="Company"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                type="text"
                value={experienceForm.position}
                onChange={(e) => setExperienceForm({...experienceForm, position: e.target.value})}
                placeholder="Position"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                type="month"
                value={experienceForm.start_date}
                onChange={(e) => setExperienceForm({...experienceForm, start_date: e.target.value})}
                placeholder="Start Date"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                type="month"
                value={experienceForm.end_date}
                onChange={(e) => setExperienceForm({...experienceForm, end_date: e.target.value})}
                placeholder="End Date"
                disabled={experienceForm.current}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={experienceForm.current}
                onChange={(e) => setExperienceForm({...experienceForm, current: e.target.checked, end_date: e.target.checked ? '' : experienceForm.end_date})}
                className="bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">I currently work here</span>
            </label>
            <textarea
              value={experienceForm.description}
              onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})}
              placeholder="Description"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button onClick={addExperience} type="button" className="px-4 py-2 bg-secondary dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700">
              + Add Experience
            </button>
          </div>

          <div className="space-y-4">
            {(profile.experience || []).map((exp, index) => (
              <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{exp.position}</h3>
                    <p className="text-primary dark:text-blue-400">{exp.company}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mt-2">{exp.description}</p>
                  </div>
                  <button onClick={() => removeExperience(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-600">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Education</h2>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={educationForm.institution}
                onChange={(e) => setEducationForm({...educationForm, institution: e.target.value})}
                placeholder="Institution"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                type="text"
                value={educationForm.degree}
                onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                placeholder="Degree"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                type="text"
                value={educationForm.field}
                onChange={(e) => setEducationForm({...educationForm, field: e.target.value})}
                placeholder="Field of Study"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                type="month"
                value={educationForm.start_date}
                onChange={(e) => setEducationForm({...educationForm, start_date: e.target.value})}
                placeholder="Start Date"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                type="month"
                value={educationForm.end_date}
                onChange={(e) => setEducationForm({...educationForm, end_date: e.target.value})}
                placeholder="End Date"
                disabled={educationForm.current}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={educationForm.current}
                onChange={(e) => setEducationForm({...educationForm, current: e.target.checked, end_date: e.target.checked ? '' : educationForm.end_date})}
                className="bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">I'm currently studying here</span>
            </label>
            <button onClick={addEducation} type="button" className="px-4 py-2 bg-secondary dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700">
              + Add Education
            </button>
          </div>

          <div className="space-y-4">
            {(profile.education || []).map((edu, index) => (
              <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{edu.degree}</h3>
                    <p className="text-primary dark:text-blue-400">{edu.institution}</p>
                    {edu.field && <p className="text-gray-600 dark:text-gray-400">{edu.field}</p>}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {edu.start_date} - {edu.current ? 'Present' : edu.end_date}
                    </p>
                  </div>
                  <button onClick={() => removeEducation(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-600">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Portfolio & Projects</h2>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <input
                type="text"
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm({...portfolioForm, title: e.target.value})}
                placeholder="Project Title"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                type="url"
                value={portfolioForm.url}
                onChange={(e) => setPortfolioForm({...portfolioForm, url: e.target.value})}
                placeholder="URL (https://...)"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <textarea
                value={portfolioForm.description}
                onChange={(e) => setPortfolioForm({...portfolioForm, description: e.target.value})}
                placeholder="Description"
                rows="2"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <button onClick={addPortfolio} type="button" className="px-4 py-2 bg-secondary dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700">
              + Add Portfolio Item
            </button>
          </div>

          <div className="space-y-4">
            {(profile.portfolio_links || []).map((item, index) => (
              <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.title}</h3>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-blue-400 hover:underline">
                      {item.url}
                    </a>
                    {item.description && <p className="text-gray-700 dark:text-gray-300 mt-2">{item.description}</p>}
                  </div>
                  <button onClick={() => removePortfolio(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-600">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Links</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Resume/CV Link</label>
              <input
                type="url"
                value={profile.resume_link || ''}
                onChange={(e) => {
                  setProfile({...profile, resume_link: e.target.value});
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">LinkedIn</label>
              <input
                type="url"
                value={profile.linkedin_url || ''}
                onChange={(e) => {
                  setProfile({...profile, linkedin_url: e.target.value});
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">GitHub</label>
              <input
                type="url"
                value={profile.github_url || ''}
                onChange={(e) => {
                  setProfile({...profile, github_url: e.target.value});
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="https://github.com/your-username"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Personal Website</label>
              <input
                type="url"
                value={profile.website_url || ''}
                onChange={(e) => {
                  setProfile({...profile, website_url: e.target.value});
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full py-4 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-50"
        >
          {saving ? 'Saving Profile...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

export default Profile;