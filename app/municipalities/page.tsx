'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Grid,
  List,
  Download,
  Eye,
  FileDown,
  BarChart3,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface MunicipalityWithStatus {
  id: string;
  name: string;
  county: string;
  state: string;
  websiteUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  ordinanceCount: number;
  lastOrdinanceUpdate?: string | null;
  status: 'has_ordinance' | 'no_ordinance' | 'not_scraped';
}

interface MunicipalitiesResponse {
  municipalities: MunicipalityWithStatus[];
  total: number;
  statistics: {
    total: number;
    hasOrdinance: number;
    noOrdinance: number;
    notScraped: number;
    byCounty: Record<string, number>;
  };
}

// New Jersey counties
const NJ_COUNTIES = [
  'Atlantic', 'Bergen', 'Burlington', 'Camden', 'Cape May', 'Cumberland',
  'Essex', 'Gloucester', 'Hudson', 'Hunterdon', 'Mercer', 'Middlesex',
  'Monmouth', 'Morris', 'Ocean', 'Passaic', 'Salem', 'Somerset',
  'Sussex', 'Union', 'Warren'
];

export default function MunicipalitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MunicipalitiesResponse | null>(null);
  const [search, setSearch] = useState('');
  const [county, setCounty] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<Set<string>>(new Set());

  const fetchMunicipalities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (county !== 'all') params.append('county', county);
      if (status !== 'all') params.append('status', status);
      params.append('sort', sort);
      
      const response = await fetch(`/api/municipalities?${params}`);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Failed to fetch municipalities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMunicipalities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, county, status, sort]);

  const getStatusBadge = (municipality: MunicipalityWithStatus) => {
    switch (municipality.status) {
      case 'has_ordinance':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Has Ordinance
          </Badge>
        );
      case 'no_ordinance':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            No Ordinance Found
          </Badge>
        );
      case 'not_scraped':
        return (
          <Badge variant="outline" className="text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            Not Scraped
          </Badge>
        );
    }
  };

  const handleScrape = (municipalityId: string) => {
    router.push(`/app?municipalityId=${municipalityId}`);
  };

  const handleReset = async (municipalityId: string, name: string) => {
    if (!confirm(`Are you sure you want to reset ${name}? This will delete all scraped ordinance data.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/municipalities/${municipalityId}/reset`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset municipality');
      }

      const result = await response.json();
      
      toast.success(`${name} has been reset. ${result.deleted.ordinancesDeleted} ordinance(s) removed.`);

      // Refresh the data
      fetchMunicipalities();
    } catch (error) {
      console.error('Error resetting municipality:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset municipality');
    }
  };

  const handleBulkReset = async () => {
    if (selectedMunicipalities.size === 0) {
      toast.error('Please select municipalities to reset.');
      return;
    }

    if (!confirm(`Are you sure you want to reset ${selectedMunicipalities.size} municipalities? This will delete all their scraped ordinance data.`)) {
      return;
    }

    let successful = 0;
    let failed = 0;
    
    for (const municipalityId of selectedMunicipalities) {
      try {
        const response = await fetch(`/api/municipalities/${municipalityId}/reset`, {
          method: 'DELETE',
        });

        if (response.ok) {
          successful++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (failed > 0) {
      toast.error(`${successful} municipalities reset successfully, ${failed} failed.`);
    } else {
      toast.success(`${successful} municipalities reset successfully.`);
    }

    setSelectedMunicipalities(new Set());
    fetchMunicipalities();
  };

  const exportCSV = () => {
    if (!data) return;
    
    const csv = [
      ['Municipality', 'County', 'Status', 'Ordinance Count', 'Last Updated'],
      ...data.municipalities.map(m => [
        m.name,
        m.county,
        m.status.replace('_', ' '),
        m.ordinanceCount.toString(),
        m.lastOrdinanceUpdate || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nj-municipalities.csv';
    a.click();
    
    toast.success('Exported nj-municipalities.csv');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">New Jersey Municipalities</h1>
              <p className="text-xl text-gray-600">
                Browse rent control ordinances across all {data?.statistics.total || '565'} NJ municipalities
              </p>
            </div>
            <Button onClick={exportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics Bar */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Municipalities</p>
                    <p className="text-2xl font-bold">{data.statistics.total}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Has Ordinance</p>
                    <p className="text-2xl font-bold text-green-600">{data.statistics.hasOrdinance}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Not Scraped</p>
                    <p className="text-2xl font-bold text-gray-600">{data.statistics.notScraped}</p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Coverage</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round((data.statistics.hasOrdinance / data.statistics.total) * 100)}%
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search municipalities..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={county} onValueChange={setCounty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {NJ_COUNTIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="has_ordinance">Has Ordinance</SelectItem>
                  <SelectItem value="no_ordinance">No Ordinance</SelectItem>
                  <SelectItem value="not_scraped">Not Scraped</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="county">County</SelectItem>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {selectedMunicipalities.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedMunicipalities.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkReset}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMunicipalities(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.municipalities.map((municipality) => (
              <Card key={municipality.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{municipality.name}</CardTitle>
                      <CardDescription>{municipality.county} County</CardDescription>
                    </div>
                    {getStatusBadge(municipality)}
                  </div>
                </CardHeader>
                <CardContent>
                  {municipality.status === 'has_ordinance' && (
                    <p className="text-sm text-gray-600 mb-4">
                      {municipality.ordinanceCount} ordinance{municipality.ordinanceCount !== 1 ? 's' : ''} found
                    </p>
                  )}
                  <div className="flex gap-2">
                    {municipality.status === 'has_ordinance' ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/ordinances/${municipality.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => router.push(`/app?municipalityId=${municipality.id}`)}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          Generate OPRA
                        </Button>
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReset(municipality.id, municipality.name)}
                          title="Reset ordinance data"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    ) : municipality.status === 'no_ordinance' ? (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleScrape(municipality.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Re-search
                        </Button>
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReset(municipality.id, municipality.name)}
                          title="Reset and clear status"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleScrape(municipality.id)}
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Scrape Ordinance
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Municipality</th>
                    <th className="text-left p-4">County</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Ordinances</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.municipalities.map((municipality) => (
                    <tr key={municipality.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{municipality.name}</td>
                      <td className="p-4">{municipality.county}</td>
                      <td className="p-4">{getStatusBadge(municipality)}</td>
                      <td className="p-4">{municipality.ordinanceCount || '-'}</td>
                      <td className="p-4">
                        {municipality.status === 'has_ordinance' ? (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => router.push(`/ordinances/${municipality.id}`)}
                              title="View ordinances"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/app?municipalityId=${municipality.id}`)}
                              title="Generate OPRA request"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReset(municipality.id, municipality.name)}
                              title="Reset ordinance data"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : municipality.status === 'no_ordinance' ? (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => handleScrape(municipality.id)}
                              title="Re-search for ordinances"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReset(municipality.id, municipality.name)}
                              title="Reset and clear status"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm"
                            variant="ghost"
                            onClick={() => handleScrape(municipality.id)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}