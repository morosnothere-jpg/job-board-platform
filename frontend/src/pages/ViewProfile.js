import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../services/api';
import NotificationBell from '../components/NotificationBell';

function ViewProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await getUserProfile(userId);
      setProfile(response.data.profile);
      setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Could not load profile');
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
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
            <button 
              onClick={() => navigate(-1)} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-4xl font-bold mb-2">{user.full_name}</h1>
          <p className="text-blue-100 text-lg mb-4">{user.email}</p>
          {user.phone && <p className="text-blue-100">📞 {user.phone}</p>}
          
          {profile && (
            <div className="mt-4 flex flex-wrap gap-4">
              {profile.location && (
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  📍 {profile.location}
                </span>
              )}
              {profile.availability && (
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  🕐 {profile.availability}
                </span>
              )}
              {profile.expected_salary && (
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  💰 {profile.expected_salary}
                </span>
              )}
            </div>
          )}
        </div>

        {!profile ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">This candidate hasn't completed their profile yet.</p>
          </div>
        ) : (
          <>
            {/* Bio */}
            {profile.bio && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">About</h2>
                <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-primary px-4 py-2 rounded-full font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Work Experience</h2>
                <div className="space-y-6">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h3 className="text-xl font-bold text-gray-800">{exp.position}</h3>
                      <p className="text-primary font-semibold text-lg">{exp.company}</p>
                      <p className="text-gray-600 mb-2">
                        {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                      </p>
                      {exp.description && (
                        <p className="text-gray-700">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Education</h2>
                <div className="space-y-6">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="border-l-4 border-secondary pl-4">
                      <h3 className="text-xl font-bold text-gray-800">{edu.degree}</h3>
                      <p className="text-secondary font-semibold text-lg">{edu.institution}</p>
                      {edu.field && <p className="text-gray-600">{edu.field}</p>}
                      <p className="text-gray-600">
                        {edu.start_date} - {edu.current ? 'Present' : edu.end_date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile.portfolio_links && profile.portfolio_links.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Portfolio & Projects</h2>
                <div className="space-y-4">
                  {profile.portfolio_links.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        🔗 {item.url}
                      </a>
                      {item.description && (
                        <p className="text-gray-700 mt-2">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Links & Contact</h2>
              <div className="space-y-3">
                {profile.resume_link && (
                  <a 
                    href={profile.resume_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:underline"
                  >
                    <span className="text-2xl">📄</span>
                    <span className="font-semibold">View Resume/CV</span>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:underline"
                  >
                    <span className="text-2xl">💼</span>
                    <span className="font-semibold">LinkedIn Profile</span>
                  </a>
                )}
                {profile.github_url && (
                  <a 
                    href={profile.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:underline"
                  >
                    <span className="text-2xl">💻</span>
                    <span className="font-semibold">GitHub Profile</span>
                  </a>
                )}
                {profile.website_url && (
                  <a 
                    href={profile.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:underline"
                  >
                    <span className="text-2xl">🌐</span>
                    <span className="font-semibold">Personal Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">Interested in this candidate?</h3>
              <p className="mb-4">Reach out via email: <a href={`mailto:${user.email}`} className="underline font-semibold">{user.email}</a></p>
              {user.phone && (
                <p>Or call: <span className="font-semibold">{user.phone}</span></p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewProfile;