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
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
        <AlertTriangle className="w-3 h-3 mr-1" />
        OVERDUE
      </span>
    );
  }
  
  if (level === 'critical') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {daysUntil === 0 ? 'TODAY' : '1 DAY LEFT'}
      </span>
    );
  }
  
  if (level === 'danger') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
        <Clock className="w-3 h-3 mr-1" />
        {daysUntil} days left
      </span>
    );
  }
  
  if (level === 'warning') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-white">
        <Clock className="w-3 h-3 mr-1" />
        {daysUntil} days left
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      {daysUntil} days left
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
  
  async function handleMarkHandled() {
    if (confirm('Mark this obligation as handled?')) {
      setIsMarking(true);
      await markObligationAsHandled(obligation.id);
      router.refresh();
    }
  }
  
  async function handleDelete() {
    if (confirm('Are you sure you want to delete this obligation?')) {
      setIsDeleting(true);
      await deleteObligation(obligation.id);
      router.refresh();
    }
  }
  
  return (
    <Card className={`${getUrgencyStyles(urgency)} ${isHandled ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{obligation.title}</CardTitle>
              {!isHandled && getUrgencyBadge(urgency, daysUntil)}
              {isHandled && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  HANDLED
                </span>
              )}
            </div>
            <CardDescription>
              Deadline: {new Date(obligation.deadlineAt).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Consequence:</p>
            <p className="text-sm text-gray-600">{obligation.consequence}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="capitalize">Category: {obligation.category}</span>
          <span>•</span>
          <span>Severity: {obligation.severity}</span>
        </div>
        
        <div className="flex gap-2 pt-2">
          {!isHandled && (
            <Button 
              size="sm" 
              onClick={handleMarkHandled}
              disabled={isMarking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarking ? 'Marking...' : 'Mark as Handled'}
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
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
            className="text-red-600 hover:bg-red-50"
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading obligations...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Critical Obligations</h1>
          <p className="text-gray-600 mt-1">Never miss a deadline that matters</p>
        </div>
        {canAddMore ? (
          <Button asChild size="lg">
            <Link href="/obligations/new">
              <Plus className="w-5 h-5 mr-2" />
              Add Obligation
            </Link>
          </Button>
        ) : (
          <Button 
            size="lg"
            onClick={() => router.push('/pricing')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Upgrade to Add More
          </Button>
        )}
      </div>
      
      {!hasSubscription && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Free Tier Limits</CardTitle>
            <CardDescription>
              You have {activeCount} of 2 active obligations. 
              <Button 
                variant="link" 
                className="text-orange-600 hover:text-orange-700 p-0 h-auto ml-1"
                onClick={() => router.push('/pricing')}
              >
                Upgrade for unlimited obligations →
              </Button>
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {obligations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No obligations yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Start tracking critical deadlines and never face penalties again
            </p>
            <Button asChild>
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Active Obligations ({activeObligations.length})
              </h2>
              <div className="grid gap-4">
                {activeObligations.map((obligation) => (
                  <ObligationCard key={obligation.id} obligation={obligation} />
                ))}
              </div>
            </div>
          )}
          
          {handledObligations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Handled ({handledObligations.length})
              </h2>
              <div className="grid gap-4">
                {handledObligations.map((obligation) => (
                  <ObligationCard key={obligation.id} obligation={obligation} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
