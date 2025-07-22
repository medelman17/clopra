import { notFound } from 'next/navigation';
import { RequestDetailModal } from '@/components/requests/request-detail-modal';
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

export default async function RequestModalPage({ params }: PageProps) {
  const { id } = await params;
  const request = await getRequest(id);

  if (!request) {
    notFound();
  }

  return <RequestDetailModal request={request} />;
}