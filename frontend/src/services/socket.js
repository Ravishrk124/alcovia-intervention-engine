import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Create socket instance
const socket = io(SOCKET_URL, {
    autoConnect: false, // Don't connect immediately
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

// Socket connection helpers
export function connectSocket(studentId) {
    if (!socket.connected) {
        socket.connect();
    }

    // Join student's personal room for targeted updates
    socket.emit('join_student_room', studentId);

    socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket.id);
        socket.emit('join_student_room', studentId);
    });

    socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
    });
}

export function disconnectSocket() {
    if (socket.connected) {
        socket.disconnect();
    }
}

// Event listeners
export function onStatusChanged(callback) {
    socket.on('status_changed', callback);
    return () => socket.off('status_changed', callback);
}

export function onInterventionAssigned(callback) {
    socket.on('intervention_assigned', callback);
    return () => socket.off('intervention_assigned', callback);
}

export function onInterventionCompleted(callback) {
    socket.on('intervention_completed', callback);
    return () => socket.off('intervention_completed', callback);
}

export function onJoined(callback) {
    socket.on('joined', callback);
    return () => socket.off('joined', callback);
}

export default socket;
