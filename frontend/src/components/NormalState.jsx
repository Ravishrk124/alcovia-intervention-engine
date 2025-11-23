import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTabVisibility } from '../hooks/useTabVisibility';

export default function NormalState({ student, onCheckinSubmit }) {
    const [quizScore, setQuizScore] = useState('');
    const [focusMinutes, setFocusMinutes] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { hasTabSwitched, resetTabSwitch, isTabVisible } = useTabVisibility();

    // Timer effect (BONUS: Tab detection integrated)
    useEffect(() => {
        if (!isTimerRunning) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    setIsTimerRunning(false);
                    setFocusMinutes(Math.floor((focusMinutes * 60 - prev) / 60));
                    setShowQuiz(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // Check for tab switching during timer
    useEffect(() => {
        if (isTimerRunning && hasTabSwitched) {
            // Immediate failure - stop timer and mark as failed
            setIsTimerRunning(false);
            handleFailedSession();
        }
    }, [hasTabSwitched, isTimerRunning]);

    const startFocusTimer = (minutes) => {
        if (isTimerRunning) return;

        setFocusMinutes(minutes);
        setTimeLeft(minutes * 60);
        setIsTimerRunning(true);
        setShowQuiz(false);
        resetTabSwitch(); // Reset tab detection for new session
    };

    const handleFailedSession = async () => {
        setIsSubmitting(true);
        await onCheckinSubmit({
            quiz_score: 0,
            focus_minutes: 0,
            tab_switched: true
        });
        setIsSubmitting(false);
        setFocusMinutes(0);
        setQuizScore('');
        setShowQuiz(false);
    };

    const handleSubmitCheckin = async (e) => {
        e.preventDefault();

        if (!quizScore) {
            alert('Please enter your quiz score');
            return;
        }

        const score = parseInt(quizScore);
        if (score < 0 || score > 10) {
            alert('Quiz score must be between 0 and 10');
            return;
        }

        setIsSubmitting(true);
        await onCheckinSubmit({
            quiz_score: score,
            focus_minutes: focusMinutes,
            tab_switched: hasTabSwitched
        });
        setIsSubmitting(false);

        // Reset form
        setQuizScore('');
        setFocusMinutes(0);
        setShowQuiz(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="glass-card p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                        Welcome, {student.name}!
                    </h1>
                    <div className="badge-active inline-block">
                        ✓ Status: On Track
                    </div>
                </div>

                {/* Timer Section */}
                {!isTimerRunning && !showQuiz && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-semibold text-center">Start Your Focus Session</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {[30, 60, 90].map((mins) => (
                                <button
                                    key={mins}
                                    onClick={() => startFocusTimer(mins)}
                                    className="btn-secondary py-6"
                                >
                                    <div className="text-2xl font-bold">{mins}</div>
                                    <div className="text-sm opacity-70">minutes</div>
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 text-center">
                            ⚠️ Don't switch tabs during the session or it will auto-fail
                        </p>
                    </motion.div>
                )}

                {/* Active Timer */}
                {isTimerRunning && (
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="relative">
                            <div className="text-6xl font-bold glow">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-lg text-gray-400 mt-2">Focus Time Running</div>
                        </div>

                        {!isTabVisible && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-red-500/20 border border-red-500 rounded-xl p-4"
                            >
                                🚨 Tab is not visible! Session will fail if you switched tabs.
                            </motion.div>
                        )}

                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                                initial={{ width: '100%' }}
                                animate={{ width: `${(timeLeft / (focusMinutes * 60)) * 100}%` }}
                            />
                        </div>

                        <button
                            onClick={() => {
                                setIsTimerRunning(false);
                                setShowQuiz(true);
                            }}
                            className="btn-secondary"
                        >
                            End Session Early
                        </button>
                    </motion.div>
                )}

                {/* Quiz Section */}
                {showQuiz && (
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleSubmitCheckin}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-semibold">Daily Quiz</h2>
                            <p className="text-gray-400">
                                Focus Time: <span className="text-primary-400 font-semibold">{focusMinutes} minutes</span>
                            </p>
                            {hasTabSwitched && (
                                <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 text-red-400">
                                    ⚠️ Tab switching detected - session marked as violated
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Quiz Score (0-10)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={quizScore}
                                onChange={(e) => setQuizScore(e.target.value)}
                                className="input-field"
                                placeholder="Enter your score"
                                required
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-gray-400">
                                Note: You need score &gt; 7 AND focus time &gt; 60 min to pass
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Check-in'}
                        </button>
                    </motion.form>
                )}
            </div>
        </motion.div>
    );
}
