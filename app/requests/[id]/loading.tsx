import { RequestDetailSkeleton } from '@/components/ui/loading-skeleton';

export default function RequestDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RequestDetailSkeleton />
    </div>
  );
}