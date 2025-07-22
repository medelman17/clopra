import { Badge } from '@/components/ui/badge';
import type { RequestStatus } from '@/types/api';

export function getStatusBadge(status: RequestStatus) {
  const variants: Record<RequestStatus, { variant: "secondary" | "default" | "outline" | "destructive"; label: string; className?: string }> = {
    DRAFT: { variant: 'secondary', label: 'Draft' },
    READY: { variant: 'default', label: 'Ready' },
    SUBMITTED: { variant: 'default', label: 'Sent' },
    ACKNOWLEDGED: { variant: 'outline', label: 'Acknowledged', className: 'border-blue-600 text-blue-700' },
    FULFILLED: { variant: 'outline', label: 'Fulfilled', className: 'border-green-600 text-green-700' },
    DENIED: { variant: 'destructive', label: 'Denied' },
    APPEALED: { variant: 'outline', label: 'Appealed', className: 'border-orange-600 text-orange-700' },
  };

  const config = variants[status] || variants.DRAFT;
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}