'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  criticalObligations,
  ObligationCategory,
  ObligationSeverity,
  ObligationStatus,
  type NewCriticalObligation,
} from '@/lib/db/schema';
import { getUser, getActiveObligationsCount, getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';

// Validation schemas
const obligationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  category: z.nativeEnum(ObligationCategory),
  deadlineAt: z.string().min(1, 'Deadline is required'),
  consequence: z.string().min(1, 'Consequence is required').max(1000),
  severity: z.nativeEnum(ObligationSeverity),
});

export async function createObligation(formData: FormData) {
  const user = await getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check paywall: free tier = max 2 active obligations
  const team = await getTeamForUser();
  const hasSubscription = team?.stripeSubscriptionId && 
    (team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing');

  if (!hasSubscription) {
    const activeCount = await getActiveObligationsCount();
    if (activeCount >= 2) {
      return { 
        error: 'LIMIT_REACHED',
        message: 'Free tier limited to 2 active obligations. Upgrade to add unlimited obligations.' 
      };
    }
  }

  const validated = obligationSchema.safeParse({
    title: formData.get('title'),
    category: formData.get('category'),
    deadlineAt: formData.get('deadlineAt'),
    consequence: formData.get('consequence'),
    severity: formData.get('severity'),
  });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { title, category, deadlineAt, consequence, severity } = validated.data;

  const newObligation: NewCriticalObligation = {
    userId: user.id,
    teamId: team?.id || null,
    title,
    category,
    deadlineAt: new Date(deadlineAt),
    consequence,
    severity,
    status: ObligationStatus.ACTIVE,
  };

  try {
    await db.insert(criticalObligations).values(newObligation);
    revalidatePath('/obligations');
    return { success: true };
  } catch (error) {
    console.error('Failed to create obligation:', error);
    return { error: 'Failed to create obligation' };
  }
}

export async function updateObligation(id: number, formData: FormData) {
  const user = await getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = obligationSchema.safeParse({
    title: formData.get('title'),
    category: formData.get('category'),
    deadlineAt: formData.get('deadlineAt'),
    consequence: formData.get('consequence'),
    severity: formData.get('severity'),
  });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { title, category, deadlineAt, consequence, severity } = validated.data;

  try {
    await db
      .update(criticalObligations)
      .set({
        title,
        category,
        deadlineAt: new Date(deadlineAt),
        consequence,
        severity,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(criticalObligations.id, id),
          eq(criticalObligations.userId, user.id)
        )
      );

    revalidatePath('/obligations');
    revalidatePath(`/obligations/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update obligation:', error);
    return { error: 'Failed to update obligation' };
  }
}

export async function markObligationAsHandled(id: number) {
  const user = await getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    await db
      .update(criticalObligations)
      .set({
        status: ObligationStatus.HANDLED,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(criticalObligations.id, id),
          eq(criticalObligations.userId, user.id)
        )
      );

    revalidatePath('/obligations');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark obligation as handled:', error);
    return { error: 'Failed to update obligation' };
  }
}

export async function deleteObligation(id: number) {
  const user = await getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    await db
      .delete(criticalObligations)
      .where(
        and(
          eq(criticalObligations.id, id),
          eq(criticalObligations.userId, user.id)
        )
      );

    revalidatePath('/obligations');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete obligation:', error);
    return { error: 'Failed to delete obligation' };
  }
}

export async function redirectToUpgrade() {
  redirect('/pricing');
}
