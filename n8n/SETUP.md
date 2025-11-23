# Alcovia Intervention Engine - n8n Setup Guide

## Quick Setup

1. **Create n8n Cloud Account**
   - Go to https://n8n.io/
   - Sign up for free account
   - Create a new workflow

2. **Import Workflow**
   - Click on **Import from File** or **Import from URL**
   - Upload `workflow.json` from this directory
   - The workflow will be created with all nodes

3. **Configure Email Node**
   
   The workflow sends emails to `ravishrk0407@gmail.com`. You need to configure SMTP credentials:

   **Option A: Gmail (Easiest)**
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Create an "App Password" specifically for n8n
   - In n8n's "Send Email" node, add SMTP credentials:
     - Host: `smtp.gmail.com`
     - Port: `587`
     - User: your Gmail address
     - Password: the App Password you created
   
   **Option B: SendGrid (Recommended for production)**
   - Sign up at https://sendgrid.com (free tier: 100 emails/day)
   - Create API key
   - In n8n, use SendGrid node instead of Email node
   - Configure with API key

4. **Activate Workflow**
   - Click the toggle to **Activate** the workflow
   - You'll see a webhook URL appear in the first node
   - Copy this URL (looks like: `https://your-instance.app.n8n.cloud/webhook/student-intervention`)

5. **Update Backend .env**
   - Add the webhook URL to `backend/.env`:
     ```
     N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/student-intervention
     ```
   - Restart your backend server

## Workflow Nodes Explanation

### 1. Webhook - Student Failed
- **Type**: Webhook Trigger
- **Method**: POST
- **Receives**: Student performance data from backend

### 2. Webhook Response
- **Type**: Respond to Webhook
- **Returns**: Immediate acknowledgment to backend

### 3. Send Email to Mentor
- **Type**: Email Send (or SendGrid)
- **To**: ravishrk0407@gmail.com
- **Contains**: Beautiful HTML email with student stats and action buttons

### 4. Wait for Mentor Approval
- **Type**: Wait Node
- **Mode**: Wait for webhook call
- **Creates**: Resume webhook URL embedded in email buttons

### 5. Assign Intervention (API Call)
- **Type**: HTTP Request
- **URL**: `http://localhost:3001/api/assign-intervention` (change for production)
- **Method**: POST
- **Body**: intervention_id and assigned task from email click

### 6. Confirmation Page
- **Type**: Respond to Webhook
- **Returns**: Success HTML page to mentor

## Testing the Workflow

1. **Manual Test in n8n**
   - Click "Test Workflow" in n8n
   - Use "Execute Node" on the webhook
   - Provide test data:
     ```json
     {
       "student_id": "test-uuid",
       "student_name": "Ravish Kumar",
       "student_email": "ravishrk0407@gmail.com",
       "quiz_score": 4,
       "focus_minutes": 30,
       "reason": "Both quiz score and focus time below threshold",
       "intervention_id": "test-intervention-uuid"
     }
     ```

2. **End-to-End Test**
   - Use the app to submit a bad score
   - Backend will trigger the webhook
   - Check email for notification
   - Click a task button
   - Verify API call succeeds

## Production Updates

When deploying, update the "Assign Intervention" node URL from:
```
http://localhost:3001/api/assign-intervention
```
to your production backend URL:
```
https://your-backend.railway.app/api/assign-intervention
```

## Troubleshooting

**Email not sending?**
- Check SMTP credentials in n8n
- Verify email is not in spam folder
- Try SendGrid instead of SMTP

**Webhook not triggering?**
- Verify N8N_WEBHOOK_URL is correct in backend .env
- Check workflow is activated in n8n
- View execution logs in n8n dashboard

**App not unlocking?**
- Check backend logs for API call from n8n
- Verify intervention_id is correct
- Check WebSocket connection in browser console

## Email Template Preview

The email includes:
- 🚨 Urgent header with gradient styling
- Student name and email
- Performance stats (quiz score, focus minutes)
- Three action buttons:
  - 📚 Assign: Read Chapter 4
  - ✍️ Assign: Practice Exercises  
  - 👥 Assign: 1-on-1 Session
- Note about instant WebSocket unlock

## Advanced: Custom Tasks

To add custom task options, edit the email HTML in the "Send Email" node:

```html
<a href="{{ $resumeWebhookUrl }}?task=Your Custom Task&mentor=Your Name" class="action-btn">
  🔔 Assign: Your Custom Task
</a>
```

The task parameter will be URL-decoded and sent to the backend.
