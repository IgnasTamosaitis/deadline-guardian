import { NextRequest, NextResponse } from 'next/server';
import { processNotifications } from '@/lib/notifications/email-service';

/**
 * Cron job endpoint to process obligation notifications
 * Should be called every hour (or every 6 hours) by a cron service
 * 
 * For local development: Call manually or use node-cron
 * For production: Use Vercel Cron Jobs, AWS EventBridge, or similar
 * 
 * Vercel Cron example (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/notifications",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('\n🚀 Cron job triggered: Processing notifications...');
    const result = await processNotifications();
    
    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      ...result,
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
