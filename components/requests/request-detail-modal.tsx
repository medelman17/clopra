'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RequestDetail } from './request-detail';
import type { RequestStatus } from '@/types/api';

interface RequestDetailModalProps {
  request: {
    id: string;
    requestNumber: string;
    status: RequestStatus;
    categories: unknown;
    customizations: unknown;
    requestText: string;
    pdfUrl: string | null;
    submittedAt: Date | null;
    responseDeadline: Date | null;
    createdAt: Date;
    updatedAt: Date;
    municipality: {
      id: string;
      name: string;
      county: string;
      state: string;
      websiteUrl: string | null;
    };
    ordinance: {
      id: string;
      title: string;
      code: string | null;
      effectiveDate: Date | null;
      sourceUrl: string | null;
    } | null;
    custodian: {
      id: string;
      name: string;
      title: string;
      email: string | null;
      phone: string | null;
      address: string | null;
    } | null;
  };
}

export function RequestDetailModal({ request }: RequestDetailModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <div className="mt-6">
          <RequestDetail request={request} />
        </div>
      </DialogContent>
    </Dialog>
  );
}