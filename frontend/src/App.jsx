import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NormalState from './components/NormalState';
import LockedState from './components/LockedState';
import RemedialState from './components/RemedialState';
import { studentAPI } from './services/api';
import {
    connectSocket,
    disconnectSocket,
    onStatusChanged,
    onInterventionAssigned,
    onInterventionCompleted,
    onJoined
} from './services/socket';

// Hardcoded student email (you can make this dynamic later)
const STUDENT_EMAIL = 'ravishrk0407@gmail.com';

function App() {
    const [student, setStudent] = useState(null);
    const [intervention, setIntervention] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Load student data on mount
    useEffect(() => {
        loadStudentData();
    }, []);

    // Set up WebSocket listeners
    useEffect(() => {
        if (!student) return;

        // Connect to WebSocket
        connectSocket(student.id);

        // Listen for connection confirmation
        const unsubJoined = onJoined((data) => {
            console.log('✅ Joined room:', data);
            setSocketConnected(true);
        });

        // Listen for status changes (when intervention is created)
        const unsubStatus = onStatusChanged((data) => {
            console.log('📨 Status changed:', data);
            setStudent(prev => ({ ...prev, status: data.status }));
            setIntervention(data.intervention);
        });

        // Listen for intervention assignment (mentor assigned task)
        const unsubIntervention = onInterventionAssigned((data) => {
            console.log('📨 Intervention assigned:', data);
            setStudent(prev => ({ ...prev, status: data.status }));
            setIntervention(data.intervention);
        });

        // Listen for intervention completion
        const unsubCompleted = onInterventionCompleted((data) => {
            console.log('📨 Intervention completed:', data);
            setStudent(prev => ({ ...prev, status: data.status }));
            setIntervention(null);
        });

        return () => {
            unsubJoined();
            unsubStatus();
            unsubIntervention();
            unsubCompleted();
            disconnectSocket();
        };
    }, [student]);

    const loadStudentData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get student by email
            const studentData = await studentAPI.getByEmail(STUDENT_EMAIL);
            setStudent(studentData.student);

            // Get current status and intervention
            const statusData = await studentAPI.getStatus(studentData.student.id);
            setStudent(statusData.student);
            setIntervention(statusData.intervention);

            setLoading(false);
        } catch (err) {
            console.error('Error loading student data:', err);
            setError(err.message || 'Failed to load student data');
            setLoading(false);
        }
    };

    const handleCheckinSubmit = async (data) => {
        try {
            const response = await studentAPI.submitCheckin({
                student_id: student.id,
                ...data
            });

            console.log('Check-in response:', response);

            // Update student status based on response
            if (response.status === 'On Track') {
                setStudent(prev => ({ ...prev, status: 'active' }));
                setIntervention(null);
            } else {
                setStudent(prev => ({ ...prev, status: 'needs_intervention' }));
                setIntervention(response.data.intervention);
            }

            return response;
        } catch (err) {
            console.error('Error submitting check-in:', err);
            alert('Failed to submit check-in: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleCompleteIntervention = async () => {
        try {
            const response = await studentAPI.completeIntervention({
                student_id: student.id,
                intervention_id: intervention.id
            });

            console.log('Complete intervention response:', response);

            setStudent(prev => ({ ...prev, status: 'active' }));
            setIntervention(null);

            return response;
        } catch (err) {
            console.error('Error completing intervention:', err);
            alert('Failed to complete intervention: ' + (err.response?.data?.error || err.message));
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"
                    />
                    <p className="text-gray-400">Loading student data...</p>
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md text-center space-y-4">
                    <div className="text-6xl">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-400">Error Loading App</h2>
                    <p className="text-gray-300">{error}</p>
                    <button onClick={loadStudentData} className="btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Header with connection status */}
            <div className="w-full max-w-2xl mb-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                        Alcovia Intervention Engine
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-gray-400">
                            {socketConnected ? 'Real-time connected' : 'Connecting...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main content with state transitions */}
            <AnimatePresence mode="wait">
                {student.status === 'active' && (
                    <motion.div
                        key="normal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <NormalState
                            student={student}
                            onCheckinSubmit={handleCheckinSubmit}
                        />
                    </motion.div>
                )}

                {student.status === 'needs_intervention' && (
                    <motion.div
                        key="locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <LockedState intervention={intervention} />
                    </motion.div>
                )}

                {student.status === 'remedial' && intervention && (
                    <motion.div
                        key="remedial"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <RemedialState
                            student={student}
                            intervention={intervention}
                            onComplete={handleCompleteIntervention}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div className="w-full max-w-2xl mt-8 text-center text-xs text-gray-500">
                <p>Built with ❤️ for Alcovia | Real-time intervention system</p>
            </div>
        </div>
    );
}

export default App;
