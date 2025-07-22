import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MunicipalitiesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-4">Browse New Jersey Municipalities</h1>
        <p className="text-xl text-gray-600">
          Find and explore rent control ordinances across New Jersey municipalities.
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600 mb-4">Municipality search and browsing coming soon!</p>
        <Link href="/app">
          <Button>
            Generate an OPRA Request
          </Button>
        </Link>
      </div>
    </div>
  );
}