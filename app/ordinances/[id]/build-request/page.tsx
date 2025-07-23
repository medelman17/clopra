import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { RequestBuilder } from '@/components/request-builder/request-builder';

interface RequestBuilderPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOrdinanceWithRequest(id: string) {
  const ordinance = await prisma.ordinance.findUnique({
    where: { id },
    include: {
      municipality: {
        include: {
          custodians: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      chunks: {
        orderBy: { chunkIndex: 'asc' },
      },
      opraRequests: {
        where: { status: 'DRAFT' },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  });

  return ordinance;
}

export default async function RequestBuilderPage({ params }: RequestBuilderPageProps) {
  const { id } = await params;
  const ordinance = await getOrdinanceWithRequest(id);

  if (!ordinance) {
    notFound();
  }

  // Get existing draft or null
  const existingDraft = ordinance.opraRequests[0] || null;

  return (
    <div className="container mx-auto py-6">
      <RequestBuilder 
        ordinance={ordinance}
        municipality={ordinance.municipality}
        existingDraft={existingDraft}
      />
    </div>
  );
}