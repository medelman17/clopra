'use client';

import { cn } from '@/lib/utils';
import { Check, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface ProcessStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number;
}

interface MultiStepProgressProps {
  steps: ProcessStep[];
  showProgress?: boolean;
  className?: string;
}

export function MultiStepProgress({ 
  steps, 
  showProgress = true,
  className 
}: MultiStepProgressProps) {
  // Calculate overall progress
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const overallProgress = (completedSteps / steps.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'completed' ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : step.status === 'in-progress' ? (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              ) : step.status === 'error' ? (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                  <Circle className="w-3 h-3 text-muted-foreground/30" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  "text-sm font-medium",
                  step.status === 'completed' ? "text-green-600" :
                  step.status === 'in-progress' ? "text-blue-600" :
                  step.status === 'error' ? "text-red-600" :
                  "text-muted-foreground"
                )}>
                  {step.label}
                </h4>
                {step.status === 'in-progress' && step.progress !== undefined && (
                  <span className="text-xs text-muted-foreground">{step.progress}%</span>
                )}
              </div>
              
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
              
              {step.status === 'in-progress' && step.progress !== undefined && (
                <Progress value={step.progress} className="h-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SimpleProgressProps {
  label: string;
  description?: string;
  progress?: number;
  isIndeterminate?: boolean;
  className?: string;
}

export function SimpleProgress({ 
  label, 
  description, 
  progress = 0,
  isIndeterminate = false,
  className 
}: SimpleProgressProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">{label}</h4>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {!isIndeterminate && (
          <span className="text-sm font-medium">{progress}%</span>
        )}
      </div>
      
      {isIndeterminate ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-full animate-progress-indeterminate bg-primary" />
        </div>
      ) : (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
}

