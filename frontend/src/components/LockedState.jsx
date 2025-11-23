import { motion } from 'framer-motion';

export default function LockedState({ intervention }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="glass-card p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1
                        }}
                        className="text-6xl"
                    >
                        🔒
                    </motion.div>

                    <h1 className="text-3xl font-bold text-red-400">
                        Access Locked
                    </h1>

                    <div className="badge-locked">
                        🚨 Needs Intervention
                    </div>
                </div>

                {/* Message */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-center">
                        Analysis in Progress
                    </h2>

                    <p className="text-center text-gray-300">
                        Your recent performance requires mentor attention. All app features are temporarily disabled.
                    </p>

                    {intervention && (
                        <div className="mt-4 p-4 bg-black/20 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Quiz Score:</span>
                                <span className="font-semibold text-red-400">{intervention.quiz_score}/10</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Focus Time:</span>
                                <span className="font-semibold text-red-400">{intervention.focus_minutes} min</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10">
                                <span className="text-gray-400">Reason:</span>
                                <p className="text-gray-200 mt-1">{intervention.reason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Waiting Animation */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-3 h-3 bg-primary-500 rounded-full"
                        />
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-3 h-3 bg-primary-500 rounded-full"
                        />
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-3 h-3 bg-primary-500 rounded-full"
                        />
                    </div>

                    <p className="text-gray-400">
                        Waiting for mentor review and task assignment...
                    </p>

                    <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                        <p className="text-sm text-primary-300">
                            💡 <strong>Real-time enabled:</strong> Your app will unlock automatically when your mentor assigns a task. No refresh needed!
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
