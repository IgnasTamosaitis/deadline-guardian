'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export function TestNotificationsForm() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  async function handleRunTest() {
    setIsRunning(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/cron/notifications', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run notification check');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Notification Check</CardTitle>
          <CardDescription>
            Trigger the notification system to check for obligations needing alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRunTest}
            disabled={isRunning}
            size="lg"
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Notifications...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-5 w-5" />
                Run Notification Check
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Check Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {result.sent || 0}
                </div>
                <div className="text-sm text-gray-600">Notifications Sent</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-gray-600">
                  {result.failed || 0}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="text-xs text-gray-500 font-mono">
                Timestamp: {result.timestamp}
              </div>
            </div>
            
            <div className="text-sm text-green-800 bg-green-100 p-3 rounded">
              ℹ️ Check the server console (terminal) to see the formatted email notifications
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-800 font-mono text-sm bg-red-100 p-3 rounded">
              {error}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Quick Test Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="font-semibold text-sm mb-2">Create test obligations with these deadlines:</div>
            <div className="space-y-1 text-sm text-gray-700">
              <div>• <strong>30 days from now</strong> - Will trigger 30-day warning</div>
              <div>• <strong>7 days from now</strong> - Will trigger 7-day warning</div>
              <div>• <strong>1 day from now</strong> - Will trigger 1-day critical alert</div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
            <strong>Tip:</strong> After creating obligations, run the notification check. 
            Notifications will only be sent once per threshold, so you'll need to create 
            new obligations or delete notification history to test again.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
