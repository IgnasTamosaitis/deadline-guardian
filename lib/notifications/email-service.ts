import { getObligationsNeedingNotification, logNotification } from '@/lib/db/notifications';
import { NotificationType } from '@/lib/db/schema';

/**
 * Format email content for obligation notification
 */
function formatNotificationEmail(obligation: any) {
  const { title, category, deadlineAt, consequence, severity, daysUntilDeadline, notificationThreshold } = obligation;
  
  const deadlineDate = new Date(deadlineAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const urgencyLevel = daysUntilDeadline <= 1 ? 'CRITICAL' : daysUntilDeadline <= 7 ? 'URGENT' : 'IMPORTANT';
  const urgencyColor = urgencyLevel === 'CRITICAL' ? '#DC2626' : urgencyLevel === 'URGENT' ? '#F97316' : '#F59E0B';
  
  const subject = `⚠️ ${urgencyLevel}: ${title} - ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} remaining`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with urgency banner -->
          <tr>
            <td style="background-color: ${urgencyColor}; padding: 20px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">
                ${urgencyLevel} DEADLINE ALERT
              </h1>
              <p style="margin: 8px 0 0 0; color: white; font-size: 18px;">
                ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} remaining
              </p>
            </td>
          </tr>
          
          <!-- Obligation details -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 22px; font-weight: bold;">
                ${title}
              </h2>
              
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400E;">⚠️ What happens if you miss this?</p>
                <p style="margin: 0; color: #78350F; line-height: 1.6;">
                  ${consequence}
                </p>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                    <span style="color: #6B7280; font-size: 14px;">Deadline:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                    <strong style="color: #111827; font-size: 16px;">${deadlineDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                    <span style="color: #6B7280; font-size: 14px;">Category:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                    <span style="background-color: #F3F4F6; padding: 4px 12px; border-radius: 12px; font-size: 14px; text-transform: capitalize;">
                      ${category}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #6B7280; font-size: 14px;">Severity:</span>
                  </td>
                  <td style="padding: 12px 0; text-align: right;">
                    <span style="background-color: ${severity === 'CRITICAL' ? '#FEE2E2' : severity === 'HIGH' ? '#FED7AA' : severity === 'MEDIUM' ? '#FEF3C7' : '#DBEAFE'}; color: ${severity === 'CRITICAL' ? '#991B1B' : severity === 'HIGH' ? '#9A3412' : severity === 'MEDIUM' ? '#92400E' : '#1E3A8A'}; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: bold;">
                      ${severity}
                    </span>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/obligations" 
                   style="display: inline-block; background-color: #F97316; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  View All Obligations
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
                This is an automated reminder from Deadline Guardian
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                You're receiving this because you have active critical obligations
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  const text = `
${urgencyLevel} DEADLINE ALERT
${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} remaining

${title}

Deadline: ${deadlineDate}
Category: ${category}
Severity: ${severity}

⚠️ What happens if you miss this?
${consequence}

View all obligations: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/obligations

---
This is an automated reminder from Deadline Guardian
`;
  
  return { subject, html, text };
}

/**
 * Send email notification (console.log for now, can be replaced with actual email service)
 */
async function sendEmail(to: string, subject: string, html: string, text: string) {
  // For now, just log to console. In production, integrate with Resend, SendGrid, or similar
  console.log('='.repeat(80));
  console.log('📧 EMAIL NOTIFICATION');
  console.log('='.repeat(80));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('\n--- Text Version ---');
  console.log(text);
  console.log('='.repeat(80));
  
  // TODO: Integrate with email service
  // Example with Resend:
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'Deadline Guardian <notifications@yourdomain.com>',
  //   to,
  //   subject,
  //   html,
  //   text,
  // });
  
  return true;
}

/**
 * Process all pending notifications
 * This function should be called by a cron job or scheduled task
 */
export async function processNotifications() {
  console.log(`\n🔔 [${new Date().toISOString()}] Processing obligation notifications...`);
  
  try {
    const obligations = await getObligationsNeedingNotification();
    
    if (obligations.length === 0) {
      console.log('✅ No notifications needed at this time');
      return { success: true, count: 0 };
    }
    
    console.log(`📬 Found ${obligations.length} obligation(s) needing notification`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const obligation of obligations) {
      try {
        const { subject, html, text } = formatNotificationEmail(obligation);
        
        await sendEmail(obligation.userEmail, subject, html, text);
        
        await logNotification(
          obligation.id,
          obligation.userId,
          NotificationType.EMAIL,
          obligation.notificationThreshold,
          true
        );
        
        successCount++;
        console.log(`✅ Notification sent for: ${obligation.title} (${obligation.notificationThreshold} days threshold)`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to send notification for: ${obligation.title}`, error);
        
        await logNotification(
          obligation.id,
          obligation.userId,
          NotificationType.EMAIL,
          obligation.notificationThreshold,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
    
    console.log(`\n📊 Summary: ${successCount} sent, ${failureCount} failed`);
    return { success: true, sent: successCount, failed: failureCount };
    
  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
