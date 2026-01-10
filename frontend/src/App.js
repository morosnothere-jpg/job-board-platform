import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplyJob from './pages/ApplyJob';
import Profile from './pages/Profile';
import ViewProfile from './pages/ViewProfile';
import SavedJobs from './pages/SavedJobs';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                closeButton: '!bg-red-500 !text-white !border-red-600 hover:!bg-red-600 !left-auto !right-2 !top-1/2 !-translate-y-1/2'
              }
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/apply/:jobId" element={<ApplyJob />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/view-profile/:userId" element={<ViewProfile />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            <Route path="/admin" element={<AdminDashboard />} />  </Routes>
        </>
      </div>
    </Router>
  );
}

export default App;