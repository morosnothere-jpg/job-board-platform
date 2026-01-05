import React, { useState, useEffect } from 'react';
import { searchCandidates, sendJobInvitation } from '../services/api';
import AvatarDisplay from './AvatarDisplay';

function CandidateSearch({ myJobs }) {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await searchCandidates('');
            setCandidates(response.data.candidates);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching candidates:', error);
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await searchCandidates(searchTerm);
            setCandidates(response.data.candidates);
            setLoading(false);
        } catch (error) {
            console.error('Error searching candidates:', error);
            setLoading(false);
        }
    };

    const openInviteModal = (candidate) => {
        setSelectedCandidate(candidate);
        setShowInviteModal(true);
    };

    const handleInvite = async () => {
        if (!selectedJob) {
            alert('Please select a job to invite the candidate to');
            return;
        }

        setSending(true);
        try {
            await sendJobInvitation(selectedCandidate.id, selectedJob);
            alert(`Invitation sent to ${selectedCandidate.full_name} successfully! 🎉`);
            setShowInviteModal(false);
            setSelectedJob('');
            setSelectedCandidate(null);
        } catch (error) {
            alert('Error sending invitation: ' + (error.response?.data?.error || error.message));
        }
        setSending(false);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Find Candidates</h2>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Candidates List */}
            {loading ? (
                <p className="text-gray-600 dark:text-gray-400">Loading candidates...</p>
            ) : candidates.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors">
                    <p className="text-gray-600 dark:text-gray-400">No candidates found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map((candidate) => (
                        <div key={candidate.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors hover:shadow-lg">
                            <div className="flex items-center gap-4 mb-4">
                                <AvatarDisplay avatarId={candidate.avatar} size="lg" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{candidate.full_name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{candidate.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => openInviteModal(candidate)}
                                className="w-full bg-secondary dark:bg-green-600 text-white py-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition font-semibold"
                            >
                                Invite to Apply
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && selectedCandidate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full transition-colors">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                            Invite {selectedCandidate.full_name}
                        </h3>

                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Select a job to invite this candidate to apply:
                        </p>

                        <select
                            value={selectedJob}
                            onChange={(e) => setSelectedJob(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4"
                        >
                            <option value="">Select a job...</option>
                            {myJobs.filter(job => job.status === 'open').map((job) => (
                                <option key={job.id} value={job.id}>
                                    {job.title} at {job.company}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-4">
                            <button
                                onClick={handleInvite}
                                disabled={sending}
                                className="flex-1 bg-primary dark:bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                            >
                                {sending ? 'Sending...' : 'Send Invitation'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setSelectedJob('');
                                }}
                                disabled={sending}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CandidateSearch;