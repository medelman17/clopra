'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type { Municipality, Custodian } from '@prisma/client';

interface RequestPreviewProps {
  requestText: string;
  municipality: Municipality;
  custodian?: Custodian | null;
}

export function RequestPreview({ 
  requestText, 
  municipality, 
  custodian 
}: RequestPreviewProps) {
  const today = new Date();
  const responseDeadline = new Date();
  responseDeadline.setDate(responseDeadline.getDate() + 7); // 7 business days

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">OPRA Request</h3>
          <p className="text-sm text-muted-foreground">
            Generated on {format(today, 'MMMM d, yyyy')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">To:</p>
            <p>{custodian?.name || 'Municipal Clerk'}</p>
            <p>{custodian?.title || 'OPRA Custodian'}</p>
            <p>{municipality.name}, NJ</p>
            {custodian?.email && (
              <p className="text-muted-foreground">{custodian.email}</p>
            )}
          </div>
          
          <div>
            <p className="font-medium">From:</p>
            <p>[Your Name]</p>
            <p>[Your Address]</p>
            <p>[Your Email]</p>
            <p>[Your Phone]</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            Response Due: {format(responseDeadline, 'MMM d, yyyy')}
          </Badge>
          <Badge variant="outline">
            Request #{new Date().getFullYear()}-{String(Math.floor(Math.random() * 10000)).padStart(4, '0')}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Request Body */}
      <Card className="p-6 bg-muted/30">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {requestText || 'Start editing your request to see the preview here...'}
          </pre>
        </div>
      </Card>

      {/* Footer Information */}
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Important Notes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>This request is made pursuant to OPRA, N.J.S.A. 47:1A-1 et seq.</li>
          <li>The custodian must respond within 7 business days</li>
          <li>You may be charged reasonable fees for copying</li>
          <li>Electronic records should be provided in their original format when possible</li>
        </ul>
      </div>
    </div>
  );
}