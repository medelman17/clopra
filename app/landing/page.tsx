import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileSearch, 
  Sparkles, 
  Download, 
  Clock, 
  Shield, 
  Users,
  CheckCircle,
  ArrowRight,
  Search,
  Brain,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white px-4 py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Generate Comprehensive OPRA Requests<br />
              for NJ Rent Control Records
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              AI-powered analysis ensures you request every relevant document from municipal clerks
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/app">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Your First Request
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-lg shadow-2xl p-8 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <Search className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium">Find Ordinance</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium">AI Analysis</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">OPRA Request</p>
                  </div>
                </div>
                <div className="ml-8 text-right">
                  <p className="text-3xl font-bold text-green-600">2 minutes</p>
                  <p className="text-sm text-gray-600">Average time to generate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stop Missing Critical Rent Control Documents
            </h2>
            <p className="text-xl text-gray-600">
              Generic OPRA requests lead to incomplete responses and wasted time
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: "Time-Consuming Review",
                description: "Manual ordinance review takes hours and often misses key provisions"
              },
              {
                icon: FileSearch,
                title: "Incomplete Requests",
                description: "Generic templates don't capture municipality-specific records"
              },
              {
                icon: Shield,
                title: "Unique Record-Keeping",
                description: "Each town has different systems and document categories"
              },
              {
                icon: Users,
                title: "Legal Consequences",
                description: "Missing documents can derail proceedings and hurt clients"
              }
            ].map((problem, index) => (
              <Card key={index} className="border-red-200 bg-red-50">
                <CardHeader>
                  <problem.icon className="h-8 w-8 text-red-600 mb-2" />
                  <CardTitle className="text-lg">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to comprehensive OPRA requests
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Search & Extract",
                description: "Enter a municipality name. We automatically find and extract their rent control ordinance from official sources.",
                icon: Search,
                bgColor: "bg-blue-100",
                textColor: "text-blue-600"
              },
              {
                step: "2",
                title: "AI Analysis",
                description: "Our AI identifies all record categories mentioned in the ordinance, from registration forms to enforcement actions.",
                icon: Sparkles,
                bgColor: "bg-purple-100",
                textColor: "text-purple-600"
              },
              {
                step: "3",
                title: "Generate & Download",
                description: "Get a comprehensive, professionally formatted OPRA request as a PDF, ready to send to the municipal clerk.",
                icon: Download,
                bgColor: "bg-green-100",
                textColor: "text-green-600"
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className={`w-20 h-20 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className={`text-3xl font-bold ${step.textColor}`}>{step.step}</span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-10 -right-4 h-8 w-8 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Comprehensive Requests
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "Smart Ordinance Analysis",
                description: "AI identifies all record types mentioned in the ordinance"
              },
              {
                icon: FileSearch,
                title: "35+ Record Categories",
                description: "From tenant registration to enforcement actions"
              },
              {
                icon: FileText,
                title: "Professional PDFs",
                description: "Properly formatted requests ready to send"
              },
              {
                icon: Users,
                title: "Custodian Information",
                description: "Automatically finds the right person to send to"
              },
              {
                icon: Sparkles,
                title: "Tailored Requests",
                description: "Customized to each municipality's ordinance"
              },
              {
                icon: Clock,
                title: "Time-Saving",
                description: "Hours of work completed in minutes"
              }
            ].map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-blue-600 mb-3" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Who Uses OPRA Request Generator
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Tenant Advocates",
                description: "Ensure complete documentation for rent control cases",
                benefits: ["Get all relevant registration records", "Access enforcement history", "Document rent increase patterns"]
              },
              {
                title: "Property Attorneys",
                description: "Comprehensive records for due diligence",
                benefits: ["Review compliance history", "Identify potential liabilities", "Verify rent control status"]
              },
              {
                title: "Researchers",
                description: "Access comprehensive municipal data",
                benefits: ["Study rent control implementation", "Analyze enforcement patterns", "Compare municipal approaches"]
              },
              {
                title: "Property Managers",
                description: "Understand local compliance requirements",
                benefits: ["Identify required registrations", "Review fee structures", "Understand enforcement procedures"]
              }
            ].map((useCase, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-2xl font-semibold mb-3">{useCase.title}</h3>
                <p className="text-gray-600 mb-4">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Generate Your First OPRA Request?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join legal professionals saving hours on document requests
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/app">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Generate Your First Request
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/municipalities">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 text-white border-white hover:bg-white/20">
                Browse Municipalities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-300">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">OPRA Request Generator</h3>
              <p className="text-sm">
                AI-powered OPRA request generation for New Jersey rent control records.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about-opra" className="hover:text-white">About OPRA</Link></li>
                <li><Link href="/guide" className="hover:text-white">User Guide</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 OPRA Request Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}