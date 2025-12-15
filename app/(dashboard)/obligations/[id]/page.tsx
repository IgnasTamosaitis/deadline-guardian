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
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useActionState } from 'react';
import { updateObligation } from '../actions';
import { ObligationCategory, ObligationSeverity, CriticalObligation } from '@/lib/db/schema';

const categories = [
  { value: ObligationCategory.TAX, label: 'Tax', description: 'Tax filings, payments', icon: '📋' },
  { value: ObligationCategory.SUBSCRIPTION, label: 'Subscription', description: 'Service renewals', icon: '🔄' },
  { value: ObligationCategory.LEGAL, label: 'Legal', description: 'Contracts, permits', icon: '⚖️' },
  { value: ObligationCategory.BUSINESS, label: 'Business', description: 'Business deadlines', icon: '💼' },
  { value: ObligationCategory.PERSONAL, label: 'Personal', description: 'Personal matters', icon: '👤' },
  { value: ObligationCategory.OTHER, label: 'Other', description: 'Everything else', icon: '📌' },
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

export default function EditObligationPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [obligation, setObligation] = useState<CriticalObligation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(ObligationCategory.TAX);
  const [selectedSeverity, setSelectedSeverity] = useState(ObligationSeverity.HIGH);
  
  useEffect(() => {
    async function loadObligation() {
      try {
        const res = await fetch('/api/obligations');
        if (res.ok) {
          const obligations = await res.json();
          const found = obligations.find((o: CriticalObligation) => o.id === id);
          if (found) {
            setObligation(found);
            setSelectedCategory(found.category as ObligationCategory);
            setSelectedSeverity(found.severity as ObligationSeverity);
          } else {
            router.push('/obligations');
          }
        }
      } catch (error) {
        console.error('Failed to load obligation:', error);
        router.push('/obligations');
      } finally {
        setLoading(false);
      }
    }
    
    loadObligation();
  }, [id, router]);
  
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_, formData) => {
      formData.set('id', id.toString());
      const result = await updateObligation(formData);
      
      if (result.error) {
        return { error: result.error };
      }
      
      router.push('/obligations');
      return { success: true };
    },
    {}
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading obligation...</p>
        </div>
      </div>
    );
  }
  
  if (!obligation) {
    return null;
  }
  
  const deadlineDate = new Date(obligation.deadlineAt).toISOString().split('T')[0];
  
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
            <CardTitle className="text-2xl font-bold text-gray-900">Edit Obligation</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-2">
              Update your obligation details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form action={formAction} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-semibold">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={obligation.title}
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
                  defaultValue={deadlineDate}
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
                  defaultValue={obligation.consequence}
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
                        <RadioGroupItem value={sev.value} id={`edit-${sev.value}`} className="sr-only" />
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
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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
