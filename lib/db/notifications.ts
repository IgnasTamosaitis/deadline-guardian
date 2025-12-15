import { db } from './drizzle';
import { criticalObligations, obligationNotifications, users } from './schema';
import { and, eq, lt, gte, isNull, or } from 'drizzle-orm';
import { NotificationType, ObligationStatus } from './schema';

/**
 * Get obligations that need notifications sent
 * Checks for obligations that are:
 * - ACTIVE status
 * - Have deadlines approaching (30, 7, or 1 day before)
 * - Haven't been notified at this threshold yet
 */
export async function getObligationsNeedingNotification() {
  const now = new Date();
  
  // Calculate notification thresholds
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const oneDayFromNow = new Date(now);
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 2);
  
  const eightDaysFromNow = new Date(now);
  eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);
  
  const thirtyOneDaysFromNow = new Date(now);
  thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);
  
  // Get all active obligations with deadlines approaching
  const obligations = await db
    .select({
      id: criticalObligations.id,
      userId: criticalObligations.userId,
      title: criticalObligations.title,
      category: criticalObligations.category,
      deadlineAt: criticalObligations.deadlineAt,
      consequence: criticalObligations.consequence,
      severity: criticalObligations.severity,
      status: criticalObligations.status,
      userEmail: users.email,
      userName: users.name,
    })
    .from(criticalObligations)
    .innerJoin(users, eq(criticalObligations.userId, users.id))
    .where(
      and(
        eq(criticalObligations.status, ObligationStatus.ACTIVE),
        lt(criticalObligations.deadlineAt, thirtyOneDaysFromNow)
      )
    );
  
  // For each obligation, check what notifications need to be sent
  const obligationsNeedingNotifications = [];
  
  for (const obligation of obligations) {
    const deadline = new Date(obligation.deadlineAt);
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine which notification threshold this falls under
    let notificationThreshold: number | null = null;
    
    if (daysUntil >= 29 && daysUntil <= 31) {
      notificationThreshold = 30;
    } else if (daysUntil >= 6 && daysUntil <= 8) {
      notificationThreshold = 7;
    } else if (daysUntil >= 0 && daysUntil <= 2) {
      notificationThreshold = 1;
    }
    
    if (notificationThreshold !== null) {
      // Check if we've already sent a notification for this threshold
      const existingNotification = await db
        .select()
        .from(obligationNotifications)
        .where(
          and(
            eq(obligationNotifications.obligationId, obligation.id),
            eq(obligationNotifications.daysBeforeDeadline, notificationThreshold)
          )
        )
        .limit(1);
      
      if (existingNotification.length === 0) {
        obligationsNeedingNotifications.push({
          ...obligation,
          daysUntilDeadline: daysUntil,
          notificationThreshold,
        });
      }
    }
  }
  
  return obligationsNeedingNotifications;
}

/**
 * Log a notification to the database
 */
export async function logNotification(
  obligationId: number,
  userId: number,
  type: keyof typeof NotificationType,
  daysBeforeDeadline: number,
  success: boolean,
  errorMessage?: string
) {
  await db.insert(obligationNotifications).values({
    obligationId,
    userId,
    type,
    daysBeforeDeadline,
    sentAt: new Date(),
    success: success ? 'true' : 'false',
    errorMessage: errorMessage || null,
  });
  
  // Update lastNotificationAt on the obligation
  await db
    .update(criticalObligations)
    .set({ lastNotificationAt: new Date() })
    .where(eq(criticalObligations.id, obligationId));
}

/**
 * Get notification history for an obligation
 */
export async function getNotificationHistory(obligationId: number) {
  return await db
    .select()
    .from(obligationNotifications)
    .where(eq(obligationNotifications.obligationId, obligationId))
    .orderBy(obligationNotifications.sentAt);
}
