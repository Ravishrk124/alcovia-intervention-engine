import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to detect tab visibility changes
 * Returns true when tab is hidden/switched away
 * BONUS CHALLENGE #1: Tab switching detection
 */
export function useTabVisibility() {
    const [isTabVisible, setIsTabVisible] = useState(true);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const hasSwitchedRef = useRef(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            setIsTabVisible(isVisible);

            // Track when user leaves the tab
            if (!isVisible && !hasSwitchedRef.current) {
                hasSwitchedRef.current = true;
                setTabSwitchCount(prev => prev + 1);
                console.warn('⚠️ Tab switch detected - session marked as violated');
            }
        };

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also listen for blur events (when window loses focus)
        const handleBlur = () => {
            if (!hasSwitchedRef.current) {
                hasSwitchedRef.current = true;
                setTabSwitchCount(prev => prev + 1);
                console.warn('⚠️ Window blur detected - session marked as violated');
            }
        };

        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Function to reset the switch detection (call when starting new session)
    const resetTabSwitch = () => {
        hasSwitchedRef.current = false;
        setTabSwitchCount(0);
    };

    return {
        isTabVisible,
        hasTabSwitched: hasSwitchedRef.current,
        tabSwitchCount,
        resetTabSwitch
    };
}
