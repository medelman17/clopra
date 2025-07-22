import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { OrdinanceViewer } from '@/components/ordinances/ordinance-viewer';

interface OrdinancePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOrdinance(id: string) {
  const ordinance = await prisma.ordinance.findUnique({
    where: { id },
    include: {
      municipality: true,
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        take: 10, // Get first 10 chunks for section preview
      },
      opraRequests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return ordinance;
}

export default async function OrdinancePage({ params }: OrdinancePageProps) {
  const { id } = await params;
  const ordinance = await getOrdinance(id);

  if (!ordinance) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <OrdinanceViewer 
        ordinance={ordinance}
        showActions={true}
      />
    </div>
  );
}