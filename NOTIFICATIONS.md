# Obligation Notification System

This system automatically sends escalating email notifications for critical obligations as deadlines approach.

## How It Works

### Notification Thresholds

The system sends notifications at three key thresholds:

- **30 days before deadline** - Early warning (IMPORTANT)
- **7 days before deadline** - Urgent reminder (URGENT)
- **1 day before deadline** - Critical alert (CRITICAL)

Each notification is only sent once per threshold. The system tracks sent notifications in the `obligation_notifications` table.

### Email Format

Notifications include:

- Urgency banner (color-coded by severity)
- Obligation title and details
- Deadline date
- Consequence of missing the deadline
- Category and severity indicators
- Link to view all obligations

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Required for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Secure cron endpoint (recommended for production)
CRON_SECRET=your-secure-random-string

# Optional: Email service (for production)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=Deadline Guardian <notifications@yourdomain.com>
```

### 2. Email Service Integration (Production)

By default, notifications are logged to the console. For production, integrate with an email service:

**Option A: Resend (Recommended)**

```bash
pnpm add resend
```

Update `lib/notifications/email-service.ts`:

```typescript
import { Resend } from "resend";

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "Deadline Guardian <notifications@yourdomain.com>",
    to,
    subject,
    html,
    text,
  });

  return true;
}
```

**Option B: Other Services**

- SendGrid
- AWS SES
- Postmark
- Mailgun

### 3. Automated Scheduling

**Vercel (Easiest)**
The `vercel.json` file is already configured to run notifications every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Alternative: External Cron Services**

- AWS EventBridge
- Google Cloud Scheduler
- EasyCron
- cron-job.org

Configure them to call:

```
POST https://yourapp.com/api/cron/notifications
Authorization: Bearer YOUR_CRON_SECRET
```

## Testing

### Manual Testing

1. Navigate to `/test-notifications` in the app
2. Create test obligations with deadlines:
   - 30 days from now
   - 7 days from now
   - 1 day from now
3. Click "Run Notification Check"
4. Check the server console for email output

### API Testing

Call the cron endpoint directly:

```bash
curl -X POST http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer your-cron-secret"
```

## Architecture

### Files

- `lib/db/schema.ts` - Database schema (obligation_notifications table)
- `lib/db/notifications.ts` - Core notification logic
- `lib/notifications/email-service.ts` - Email formatting and sending
- `app/api/cron/notifications/route.ts` - Cron job endpoint
- `app/(dashboard)/test-notifications/` - Testing UI
- `vercel.json` - Vercel Cron configuration

### Database Schema

**obligation_notifications table:**

- `id` - UUID primary key
- `obligationId` - Foreign key to critical_obligations
- `userId` - Foreign key to users
- `type` - Notification type (EMAIL, SYSTEM)
- `daysBeforeDeadline` - Threshold (30, 7, or 1)
- `sentAt` - Timestamp of notification
- `success` - Whether sending succeeded
- `errorMessage` - Error details if failed

### Notification Flow

1. Cron job triggers `/api/cron/notifications`
2. `processNotifications()` calls `getObligationsNeedingNotification()`
3. System queries for active obligations with approaching deadlines
4. Filters out obligations already notified at current threshold
5. Formats email for each obligation
6. Sends email (or logs to console in dev)
7. Records notification in `obligation_notifications` table
8. Updates `lastNotificationAt` on the obligation

## Customization

### Adjust Notification Timing

Edit `lib/db/notifications.ts` to change thresholds:

```typescript
// Change from 30/7/1 days to 14/3/0 days
if (daysUntil >= 13 && daysUntil <= 15) {
  notificationThreshold = 14;
} else if (daysUntil >= 2 && daysUntil <= 4) {
  notificationThreshold = 3;
} else if (daysUntil >= -1 && daysUntil <= 1) {
  notificationThreshold = 0;
}
```

### Customize Email Template

Edit `lib/notifications/email-service.ts` in the `formatNotificationEmail()` function to modify:

- Subject line format
- HTML email layout
- Text email format
- Color scheme
- Branding

### Add SMS/Slack Notifications

Add new notification types in `lib/db/schema.ts`:

```typescript
export const NotificationType = pgEnum("notification_type", [
  "EMAIL",
  "SYSTEM",
  "SMS",
  "SLACK",
]);
```

Implement in `lib/notifications/sms-service.ts` or `lib/notifications/slack-service.ts`.

## Monitoring

### Check Notification History

Query the database:

```sql
SELECT
  o.title,
  n.type,
  n.days_before_deadline,
  n.sent_at,
  n.success
FROM obligation_notifications n
JOIN critical_obligations o ON n.obligation_id = o.id
ORDER BY n.sent_at DESC
LIMIT 50;
```

### View Logs

- **Vercel**: Check function logs in Vercel dashboard
- **Local**: Server console output shows detailed notification processing

## Troubleshooting

### Notifications Not Sending

1. Check cron job is running: Review logs in `/api/cron/notifications`
2. Verify environment variables are set
3. Ensure obligations are marked as ACTIVE
4. Check deadlines are within threshold windows (±1 day)
5. Verify email service credentials

### Duplicate Notifications

The system prevents duplicates by checking `obligation_notifications` table. If you receive duplicates:

1. Check database constraints on the table
2. Ensure transaction isolation in `logNotification()`

### Email Service Errors

Check error messages in `obligation_notifications.error_message` field:

```sql
SELECT * FROM obligation_notifications WHERE success = false;
```

## Production Checklist

- [ ] Set CRON_SECRET environment variable
- [ ] Configure email service (Resend/SendGrid/etc)
- [ ] Set NEXT_PUBLIC_APP_URL to production domain
- [ ] Test cron endpoint with Authorization header
- [ ] Enable Vercel Cron or configure external scheduler
- [ ] Set up monitoring/alerting for failed notifications
- [ ] Test with real deadlines before launch
- [ ] Document email sending limits (check your provider's quotas)
