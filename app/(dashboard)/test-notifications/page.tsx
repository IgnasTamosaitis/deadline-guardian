import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { TestNotificationsForm } from './test-form';

export default async function TestNotificationsPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-orange-500 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">🔔 Notification System Testing</h1>
            <p className="text-orange-100">Test the obligation notification system</p>
          </div>
          
          <div className="p-6">
            <TestNotificationsForm />
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Testing Instructions</h2>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <div>
                <strong>Create test obligations</strong> with deadlines in 30, 7, and 1 days from now
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <div>
                <strong>Run the notification check</strong> by clicking the button below
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <div>
                <strong>Check the console output</strong> to see formatted email notifications
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-blue-600">4.</span>
              <div>
                <strong>View notification history</strong> in the obligation details
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">⚙️ Cron Job Configuration</h2>
          <div className="text-amber-800 space-y-2">
            <p>
              <strong>Vercel Cron:</strong> Configured in vercel.json to run every 6 hours
            </p>
            <p>
              <strong>Manual trigger:</strong> Call <code className="bg-amber-100 px-2 py-1 rounded text-sm">GET /api/cron/notifications</code>
            </p>
            <p className="text-sm mt-3">
              For production: Set CRON_SECRET in environment variables and add Authorization header
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
