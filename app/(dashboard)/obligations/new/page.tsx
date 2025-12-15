'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useActionState } from 'react';
import { createObligation, redirectToUpgrade } from '../actions';
import { ObligationCategory, ObligationSeverity } from '@/lib/db/schema';

const categories = [
  { value: ObligationCategory.TAX, label: 'Tax', description: 'Tax filings, payments' },
  { value: ObligationCategory.SUBSCRIPTION, label: 'Subscription', description: 'Service renewals' },
  { value: ObligationCategory.LEGAL, label: 'Legal', description: 'Contracts, permits' },
  { value: ObligationCategory.BUSINESS, label: 'Business', description: 'Business deadlines' },
  { value: ObligationCategory.PERSONAL, label: 'Personal', description: 'Personal matters' },
  { value: ObligationCategory.OTHER, label: 'Other', description: 'Everything else' },
];

const severities = [
  { value: ObligationSeverity.LOW, label: 'Low', color: 'text-green-600' },
  { value: ObligationSeverity.MEDIUM, label: 'Medium', color: 'text-yellow-600' },
  { value: ObligationSeverity.HIGH, label: 'High', color: 'text-orange-600' },
  { value: ObligationSeverity.CRITICAL, label: 'Critical', color: 'text-red-600' },
];

type ActionState = {
  error?: string;
  success?: boolean;
};

export default function NewObligationPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_, formData) => {
      const result = await createObligation(formData);
      
      if (result.error === 'LIMIT_REACHED') {
        setShowUpgradePrompt(true);
        return { error: result.message };
      }
      
      if (result.error) {
        return { error: result.error };
      }
      
      router.push('/obligations');
      return { success: true };
    },
    {}
  );
  
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  if (showUpgradePrompt) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-orange-300 bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Upgrade Required</CardTitle>
            <CardDescription className="text-base">
              You've reached the free tier limit of 2 active obligations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Why upgrade?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Unlimited critical obligations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Advanced escalating reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Team collaboration features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={() => router.push('/pricing')}
              >
                View Pricing Plans
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => router.push('/obligations')}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/obligations">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Obligations
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Add Critical Obligation</CardTitle>
          <CardDescription>
            Track deadlines with serious consequences to avoid penalties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Annual Tax Filing"
                required
                maxLength={255}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category *</Label>
              <RadioGroup name="category" required defaultValue={ObligationCategory.TAX}>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <div key={cat.value} className="flex items-start space-x-2">
                      <RadioGroupItem value={cat.value} id={cat.value} />
                      <Label 
                        htmlFor={cat.value} 
                        className="font-normal cursor-pointer flex-1"
                      >
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-xs text-gray-500">{cat.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadlineAt">Deadline *</Label>
              <Input
                id="deadlineAt"
                name="deadlineAt"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consequence">What happens if you miss this? *</Label>
              <textarea
                id="consequence"
                name="consequence"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., €500 fine from tax authority, account suspension, loss of license..."
                required
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">Be specific about penalties, fines, or consequences</p>
            </div>
            
            <div className="space-y-2">
              <Label>Severity *</Label>
              <RadioGroup name="severity" required defaultValue={ObligationSeverity.HIGH}>
                <div className="space-y-2">
                  {severities.map((sev) => (
                    <div key={sev.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={sev.value} id={sev.value} />
                      <Label 
                        htmlFor={sev.value} 
                        className={`font-medium cursor-pointer ${sev.color}`}
                      >
                        {sev.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
            
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {state.error}
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Creating...' : 'Create Obligation'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/obligations')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
