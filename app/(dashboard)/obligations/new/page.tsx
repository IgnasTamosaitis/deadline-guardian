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
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
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
  { value: ObligationSeverity.LOW, label: 'Low', color: 'border-blue-300 bg-blue-50 hover:border-blue-400', icon: '🟦' },
  { value: ObligationSeverity.MEDIUM, label: 'Medium', color: 'border-yellow-300 bg-yellow-50 hover:border-yellow-400', icon: '🟨' },
  { value: ObligationSeverity.HIGH, label: 'High', color: 'border-orange-300 bg-orange-50 hover:border-orange-400', icon: '🟧' },
  { value: ObligationSeverity.CRITICAL, label: 'Critical', color: 'border-red-300 bg-red-50 hover:border-red-400', icon: '🟥' },
];

type ActionState = {
  error?: string;
  success?: boolean;
};

export default function NewObligationPage() {
  const router = useRouter();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ObligationCategory.TAX);
  const [selectedSeverity, setSelectedSeverity] = useState(ObligationSeverity.HIGH);
  
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Button variant="ghost" asChild className="mb-6 hover:bg-white/50">
          <Link href="/obligations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Obligations
          </Link>
        </Button>
        
        <Card className="shadow-xl border border-gray-200">
        <CardHeader className="border-b bg-white pb-6">
          <CardTitle className="text-2xl font-bold text-gray-900">Add Critical Obligation</CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            Track deadlines with serious consequences to avoid penalties
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form action={formAction} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-semibold">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Annual Tax Filing"
                required
                maxLength={255}
                className="text-base h-12"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold">Category *</Label>
              <RadioGroup 
                name="category" 
                required 
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as ObligationCategory)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <label 
                      key={cat.value}
                      className={`relative flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCategory === cat.value 
                          ? 'border-orange-500 bg-orange-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <RadioGroupItem value={cat.value} id={cat.value} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-semibold text-gray-900">{cat.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{cat.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="deadlineAt" className="text-base font-semibold">Deadline *</Label>
              <Input
                id="deadlineAt"
                name="deadlineAt"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="text-base h-12"
              />
              <p className="text-sm text-gray-500">When is this obligation due?</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="consequence" className="text-base font-semibold">What happens if you miss this? *</Label>
              <textarea
                id="consequence"
                name="consequence"
                className="flex min-h-[120px] w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., €500 fine from tax authority, account suspension, loss of license..."
                required
                maxLength={1000}
              />
              <p className="text-sm text-gray-500">Be specific about penalties, fines, or consequences</p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold">Severity *</Label>
              <RadioGroup 
                name="severity" 
                required 
                value={selectedSeverity}
                onValueChange={(value) => setSelectedSeverity(value as ObligationSeverity)}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {severities.map((sev) => (
                    <label
                      key={sev.value}
                      className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedSeverity === sev.value
                          ? sev.color.replace('hover:', '')
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <RadioGroupItem value={sev.value} id={sev.value} className="sr-only" />
                      <span className="text-3xl mb-2">{sev.icon}</span>
                      <span className="font-semibold text-sm">{sev.label}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
            
            {state.error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}
            
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isPending} 
                size="lg"
                className="flex-1 text-base font-semibold shadow-md"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Obligation'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                className="border-2"
                onClick={() => router.push('/obligations')}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
