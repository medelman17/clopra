import { PageHeaderSkeleton, FilterBarSkeleton, RequestListSkeleton } from '@/components/ui/loading-skeleton';

export default function RequestsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaderSkeleton />
      
      <div className="space-y-6">
        <FilterBarSkeleton />
        
        <div className="text-sm text-muted-foreground">
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        
        <RequestListSkeleton count={3} />
      </div>
    </div>
  );
}