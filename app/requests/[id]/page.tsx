import { notFound } from 'next/navigation';
import { RequestDetail } from '@/components/requests/request-detail';
import { prisma as db } from '@/lib/db/prisma';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getRequest(id: string) {
  const request = await db.opraRequest.findUnique({
    where: { id },
    include: {
      municipality: true,
      ordinance: {
        select: {
          id: true,
          title: true,
          code: true,
          effectiveDate: true,
          sourceUrl: true,
        },
      },
      custodian: true,
    },
  });

  return request;
}

export default async function RequestPage({ params }: PageProps) {
  const { id } = await params;
  const request = await getRequest(id);

  if (!request) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RequestDetail request={request} />
    </div>
  );
}