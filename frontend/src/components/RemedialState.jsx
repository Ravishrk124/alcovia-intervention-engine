import { useState } from 'react';
import { motion } from 'framer-motion';

export default function RemedialState({ student, intervention, onComplete }) {
    const [isCompleting, setIsCompleting] = useState(false);

    const handleMarkComplete = async () => {
        setIsCompleting(true);
        await onComplete();
        setIsCompleting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="glass-card p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="text-6xl"
                    >
                        📋
                    </motion.div>

                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Remedial Task Assigned
                    </h1>

                    <div className="badge-remedial">
                        ⚡ Action Required
                    </div>
                </div>

                {/* Task Details */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 space-y-4">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-yellow-400 mb-2">
                            Your Assigned Task
                        </h2>
                        <p className="text-xl text-white font-medium">
                            {intervention.assigned_task}
                        </p>
                    </div>

                    {intervention.assigned_by && (
                        <div className="text-center text-sm text-gray-400 pt-4 border-t border-white/10">
                            Assigned by: <span className="text-gray-200 font-medium">{intervention.assigned_by}</span>
                            <br />
                            <span className="text-xs">
                                {new Date(intervention.assigned_at).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded-xl p-5 space-y-3">
                    <h3 className="font-semibold text-primary-400">📌 Instructions:</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-0.5">•</span>
                            <span>Complete the assigned task thoroughly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-0.5">•</span>
                            <span>Once finished, click "Mark Complete" below</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-0.5">•</span>
                            <span>Your access to regular features will be restored</span>
                        </li>
                    </ul>
                </div>

                {/* Previous Performance */}
                {intervention.quiz_score !== null && (
                    <div className="p-4 bg-black/20 rounded-lg space-y-2 text-sm">
                        <div className="text-gray-400 text-center mb-2">Previous Performance:</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-red-400">{intervention.quiz_score}/10</div>
                                <div className="text-xs text-gray-400 mt-1">Quiz Score</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-red-400">{intervention.focus_minutes}</div>
                                <div className="text-xs text-gray-400 mt-1">Focus Minutes</div>
                            </div>
                        </div>
                        {intervention.reason && (
                            <div className="text-xs text-gray-400 text-center mt-2">
                                {intervention.reason}
                            </div>
                        )}
                    </div>
                )}

                {/* Complete Button */}
                <button
                    onClick={handleMarkComplete}
                    disabled={isCompleting}
                    className="btn-success w-full py-4 text-lg"
                >
                    {isCompleting ? (
                        <span className="flex items-center justify-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            Processing...
                        </span>
                    ) : (
                        '✓ Mark Task as Complete'
                    )}
                </button>
            </div>
        </motion.div>
    );
}
