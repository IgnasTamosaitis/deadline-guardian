'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CriticalObligation, ObligationStatus } from '@/lib/db/schema';
import { AlertTriangle, CheckCircle2, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { markObligationAsHandled, deleteObligation, redirectToUpgrade } from './actions';
import { useRouter } from 'next/navigation';

type UrgencyLevel = 'safe' | 'warning' | 'danger' | 'critical';

function getUrgencyLevel(deadlineAt: Date, status: string): UrgencyLevel {
  if (status !== ObligationStatus.ACTIVE) return 'safe';
  
  const now = new Date();
  const daysUntil = Math.ceil((new Date(deadlineAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) return 'critical';
  if (daysUntil <= 1) return 'critical';
  if (daysUntil <= 7) return 'danger';
  if (daysUntil <= 30) return 'warning';
  return 'safe';
}

function getUrgencyStyles(level: UrgencyLevel) {
  switch (level) {
    case 'critical':
      return 'border-red-600 bg-red-50 border-2';
    case 'danger':
      return 'border-red-400 bg-red-50';
    case 'warning':
      return 'border-yellow-400 bg-yellow-50';
    default:
      return 'border-green-200 bg-white';
  }
}

function getUrgencyBadge(level: UrgencyLevel, daysUntil: number) {
  if (level === 'critical' && daysUntil < 0) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse shadow-lg">
        <AlertTriangle className="w-4 h-4 mr-1.5" />
        OVERDUE
      </span>
    );
  }
  
  if (level === 'critical') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-md">
        <AlertTriangle className="w-4 h-4 mr-1.5" />
        {daysUntil === 0 ? 'DUE TODAY' : '1 DAY LEFT'}
      </span>
    );
  }
  
  if (level === 'danger') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-sm">
        <Clock className="w-4 h-4 mr-1.5" />
        {daysUntil} days left
      </span>
    );
  }
  
  if (level === 'warning') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900 shadow-sm">
        <Clock className="w-4 h-4 mr-1.5" />
        {daysUntil} days left
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
      <CheckCircle2 className="w-4 h-4 mr-1.5" />
      {daysUntil} days
    </span>
  );
}

function ObligationCard({ obligation }: { obligation: CriticalObligation }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const router = useRouter();
  
  const now = new Date();
  const daysUntil = Math.ceil((new Date(obligation.deadlineAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const urgency = getUrgencyLevel(new Date(obligation.deadlineAt), obligation.status);
  
  const isHandled = obligation.status === ObligationStatus.HANDLED;
  
  const severityColors = {
    LOW: 'bg-blue-100 text-blue-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  
  async function handleMarkHandled() {
    if (confirm('Mark this obligation as handled?')) {
      setIsMarking(true);
      try {
        const result = await markObligationAsHandled(obligation.id);
        if (result.error) {
          alert('Failed to mark as handled: ' + result.error);
        } else {
          window.location.reload();
        }
      } catch (error) {
        alert('An error occurred while marking as handled');
        console.error(error);
      } finally {
        setIsMarking(false);
      }
    }
  }
  
  async function handleDelete() {
    if (confirm('Are you sure you want to delete this obligation? This cannot be undone.')) {
      setIsDeleting(true);
      try {
        const result = await deleteObligation(obligation.id);
        if (result.error) {
          alert('Failed to delete: ' + result.error);
          setIsDeleting(false);
        } else {
          window.location.reload();
        }
      } catch (error) {
        alert('An error occurred while deleting');
        console.error(error);
        setIsDeleting(false);
      }
    }
  }
  
  return (
    <Card className={`${getUrgencyStyles(urgency)} ${isHandled ? 'opacity-70' : ''} transition-all duration-200 hover:shadow-lg`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-start gap-3 flex-wrap">
              <CardTitle className="text-xl font-bold leading-tight">{obligation.title}</CardTitle>
              {!isHandled && getUrgencyBadge(urgency, daysUntil)}
              {isHandled && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  COMPLETED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {new Date(obligation.deadlineAt).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Consequence</p>
              <p className="text-sm text-gray-800 leading-relaxed">{obligation.consequence}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
            {obligation.category}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${severityColors[obligation.severity as keyof typeof severityColors]}`}>
            {obligation.severity}
          </span>
        </div>
        
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          {!isHandled && (
            <Button 
              size="sm" 
              onClick={handleMarkHandled}
              disabled={isMarking}
              className="bg-green-600 hover:bg-green-700 shadow-sm"
            >
              {isMarking ? 'Marking...' : 'Mark Complete'}
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            className="border-gray-300"
            asChild
          >
            <Link href={`/obligations/${obligation.id}`}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50 border-red-200 ml-auto"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ObligationsPage() {
  const [obligations, setObligations] = useState<CriticalObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    async function loadObligations() {
      try {
        const [obligationsRes, teamRes] = await Promise.all([
          fetch('/api/obligations'),
          fetch('/api/team')
        ]);
        
        if (obligationsRes.ok) {
          const data = await obligationsRes.json();
          setObligations(data);
          const active = data.filter((o: CriticalObligation) => o.status === ObligationStatus.ACTIVE);
          setActiveCount(active.length);
        }
        
        if (teamRes.ok) {
          const team = await teamRes.json();
          setHasSubscription(
            team?.stripeSubscriptionId && 
            (team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing')
          );
        }
      } catch (error) {
        console.error('Failed to load obligations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadObligations();
  }, []);
  
  const activeObligations = obligations.filter(o => o.status === ObligationStatus.ACTIVE);
  const handledObligations = obligations.filter(o => o.status === ObligationStatus.HANDLED);
  
  const canAddMore = hasSubscription || activeCount < 2;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-orange-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading your obligations...</p>
          <p className="mt-2 text-sm text-gray-500">Checking for upcoming deadlines</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Critical Obligations</h1>
            <p className="text-lg text-gray-600 mt-2">Never miss a deadline that matters</p>
          </div>
          {canAddMore ? (
            <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/obligations/new">
                <Plus className="w-5 h-5 mr-2" />
                Add Obligation
              </Link>
            </Button>
          ) : (
            <Button 
              size="lg"
              onClick={() => router.push('/pricing')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upgrade to Add More
            </Button>
          )}
        </div>
      
        {!hasSubscription && (
          <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-orange-900 text-lg">Free Tier Limits</CardTitle>
                  <CardDescription className="text-orange-700 mt-1">
                    You're using {activeCount} of 2 active obligations
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={() => router.push('/pricing')}
                >
                  Upgrade →
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}
      
        {obligations.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="rounded-full bg-gray-100 p-6 mb-6">
                <AlertTriangle className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No obligations yet</h3>
              <p className="text-gray-600 text-center mb-8 max-w-md">
                Start tracking critical deadlines and never face penalties again. Get notified before it's too late.
              </p>
              <Button asChild size="lg" className="shadow-md">
                <Link href="/obligations/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Obligation
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeObligations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-red-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Active Obligations
                  </h2>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                    {activeObligations.length}
                  </span>
                </div>
                <div className="grid gap-5">
                  {activeObligations.map((obligation) => (
                    <ObligationCard key={obligation.id} obligation={obligation} />
                  ))}
                </div>
              </div>
            )}
            
            {handledObligations.length > 0 && (
              <div className="space-y-4 mt-12">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-green-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Completed
                  </h2>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {handledObligations.length}
                  </span>
                </div>
                <div className="grid gap-5">
                  {handledObligations.map((obligation) => (
                    <ObligationCard key={obligation.id} obligation={obligation} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
