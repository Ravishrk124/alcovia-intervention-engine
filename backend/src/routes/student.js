import express from 'express';
import axios from 'axios';
import supabase from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Store io instance (will be set from server.js)
let io;
export function setSocketIO(socketIO) {
    io = socketIO;
}

// GET /api/student-status/:studentId - Get current student state
router.get('/student-status/:studentId', asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    // Get student info
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

    if (studentError) {
        return res.status(404).json({
            success: false,
            error: 'Student not found'
        });
    }

    // Get active intervention if exists
    const { data: intervention } = await supabase
        .from('interventions')
        .select('*')
        .eq('student_id', studentId)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    res.json({
        success: true,
        student,
        intervention: intervention || null
    });
}));

// POST /api/daily-checkin - Student submits daily check-in
router.post('/daily-checkin', asyncHandler(async (req, res) => {
    const { student_id, quiz_score, focus_minutes, tab_switched = false } = req.body;

    // Validation
    if (!student_id || quiz_score === undefined || focus_minutes === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: student_id, quiz_score, focus_minutes'
        });
    }

    if (quiz_score < 0 || quiz_score > 10) {
        return res.status(400).json({
            success: false,
            error: 'Quiz score must be between 0 and 10'
        });
    }

    // Get student info
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', student_id)
        .single();

    if (studentError) {
        return res.status(404).json({
            success: false,
            error: 'Student not found'
        });
    }

    // THE LOGIC GATE
    // Success criteria: quiz_score > 7 AND focus_minutes > 60 AND no tab switching
    const meetsThreshold = quiz_score > 7 && focus_minutes > 60 && !tab_switched;

    // Log to daily_logs table
    const { data: logEntry, error: logError } = await supabase
        .from('daily_logs')
        .insert({
            student_id,
            quiz_score,
            focus_minutes,
            success: meetsThreshold,
            tab_switched
        })
        .select()
        .single();

    if (logError) {
        throw new Error('Failed to log daily check-in');
    }

    // SUCCESS CASE
    if (meetsThreshold) {
        // Keep student in active status
        await supabase
            .from('students')
            .update({ status: 'active' })
            .eq('id', student_id);

        return res.json({
            success: true,
            status: 'On Track',
            message: 'Great job! Keep up the good work! 🎉',
            data: logEntry
        });
    }

    // FAILURE CASE - THE LOCK
    // Update student status to "needs_intervention"
    await supabase
        .from('students')
        .update({ status: 'needs_intervention' })
        .eq('id', student_id);

    // Create intervention record
    let reason = '';
    if (tab_switched) {
        reason = 'Tab switching detected during focus session - automatic failure';
    } else if (quiz_score <= 7 && focus_minutes <= 60) {
        reason = 'Both quiz score and focus time below threshold';
    } else if (quiz_score <= 7) {
        reason = 'Quiz score below threshold';
    } else {
        reason = 'Focus time below threshold';
    }

    const { data: intervention, error: interventionError } = await supabase
        .from('interventions')
        .insert({
            student_id,
            reason,
            quiz_score,
            focus_minutes
        })
        .select()
        .single();

    if (interventionError) {
        throw new Error('Failed to create intervention');
    }

    // Trigger n8n webhook
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await axios.post(webhookUrl, {
                student_id: student.id,
                student_name: student.name,
                student_email: student.email,
                quiz_score,
                focus_minutes,
                tab_switched,
                reason,
                intervention_id: intervention.id,
                timestamp: new Date().toISOString()
            }, {
                timeout: 5000
            });
            console.log('✅ n8n webhook triggered successfully');
        } catch (error) {
            console.error('❌ Failed to trigger n8n webhook:', error.message);
            // Continue execution - webhook failure shouldn't break the flow
        }
    } else {
        console.warn('⚠️ N8N_WEBHOOK_URL not configured');
    }

    // Emit WebSocket event to student's room
    if (io) {
        io.to(student_id).emit('status_changed', {
            status: 'needs_intervention',
            intervention
        });
    }

    return res.json({
        success: true,
        status: 'Pending Mentor Review',
        message: 'Your performance needs attention. A mentor will review and assign next steps.',
        data: {
            log: logEntry,
            intervention
        }
    });
}));

// POST /api/assign-intervention - Mentor assigns remedial task (called by n8n)
router.post('/assign-intervention', asyncHandler(async (req, res) => {
    const { intervention_id, assigned_task, assigned_by = 'Mentor' } = req.body;

    if (!intervention_id || !assigned_task) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: intervention_id, assigned_task'
        });
    }

    // Update intervention with assigned task
    const { data: intervention, error: updateError } = await supabase
        .from('interventions')
        .update({
            assigned_task,
            assigned_by,
            assigned_at: new Date().toISOString()
        })
        .eq('id', intervention_id)
        .select()
        .single();

    if (updateError) {
        return res.status(404).json({
            success: false,
            error: 'Intervention not found'
        });
    }

    // Update student status to "remedial"
    await supabase
        .from('students')
        .update({ status: 'remedial' })
        .eq('id', intervention.student_id);

    // Emit WebSocket event to UNLOCK student instantly
    if (io) {
        io.to(intervention.student_id).emit('intervention_assigned', {
            status: 'remedial',
            intervention
        });
        console.log(`✅ WebSocket event sent to student ${intervention.student_id}`);
    }

    res.json({
        success: true,
        message: 'Intervention assigned successfully',
        intervention
    });
}));

// POST /api/complete-intervention - Student marks remedial task as complete
router.post('/complete-intervention', asyncHandler(async (req, res) => {
    const { student_id, intervention_id } = req.body;

    if (!student_id || !intervention_id) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: student_id, intervention_id'
        });
    }

    // Mark intervention as completed
    const { data: intervention, error: updateError } = await supabase
        .from('interventions')
        .update({
            completed: true,
            completed_at: new Date().toISOString()
        })
        .eq('id', intervention_id)
        .eq('student_id', student_id)
        .select()
        .single();

    if (updateError) {
        return res.status(404).json({
            success: false,
            error: 'Intervention not found'
        });
    }

    // Reset student status to "active"
    await supabase
        .from('students')
        .update({ status: 'active' })
        .eq('id', student_id);

    // Emit WebSocket event
    if (io) {
        io.to(student_id).emit('intervention_completed', {
            status: 'active'
        });
    }

    res.json({
        success: true,
        message: 'Intervention completed! You can now continue with regular activities.',
        intervention
    });
}));

// GET /api/student-by-email/:email - Get student by email (for easy access)
router.get('/student-by-email/:email', asyncHandler(async (req, res) => {
    const { email } = req.params;

    const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        return res.status(404).json({
            success: false,
            error: 'Student not found'
        });
    }

    res.json({
        success: true,
        student
    });
}));

export default router;
