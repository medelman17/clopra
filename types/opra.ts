export interface OpraCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  ordinanceSections?: string[]; // Sections that trigger this category
}

export const OPRA_CATEGORIES: OpraCategory[] = [
  {
    id: 'board-admin',
    name: 'Board Administrative Records',
    description: 'Meeting minutes, agendas, recordings, training materials, correspondence, annual reports',
    required: true,
  },
  {
    id: 'rules-regulations',
    name: 'Rules and Regulations',
    description: 'Promulgated rules, drafts, public comments, amendments, legal opinions, procedural manuals',
    required: true,
  },
  {
    id: 'info-assistance',
    name: 'Information and Assistance Materials',
    description: 'Brochures, compliance guides, FAQs, templates, educational materials',
    required: false,
  },
  {
    id: 'compliance-enforcement',
    name: 'Compliance and Enforcement Records',
    description: 'Certifications, inspection reports, violations, tax verifications, remediation',
    required: true,
  },
  {
    id: 'service-reduction',
    name: 'Service Reduction Complaints',
    description: 'Tenant appeals, deficiency reports, repair requests, rent reduction orders',
    required: false,
  },
  {
    id: 'loss-of-use',
    name: 'Loss of Use Calculations',
    description: 'Impact assessments, percentage reductions, retroactive adjustments',
    required: false,
  },
  {
    id: 'info-requests',
    name: 'Information Request Records',
    description: 'Board requests to landlords, responses, non-compliance notices',
    required: false,
  },
  {
    id: 'tenant-complaints',
    name: 'Tenant Complaint Records',
    description: 'Complaint forms, documentation, landlord responses, determinations, appeals',
    required: false,
  },
  {
    id: 'violations-penalties',
    name: 'Violation and Penalty Records',
    description: 'Municipal court complaints, citations, fine records, enforcement tracking',
    required: false,
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'Service contracts, expert agreements, invoices, legal services, audits',
    required: false,
  },
  {
    id: 'general-admin',
    name: 'General Administrative Records',
    description: 'Correspondence, emails, inquiries, memoranda, legal opinions, tracking systems',
    required: true,
  },
  {
    id: 'statistics-reporting',
    name: 'Statistical and Reporting Records',
    description: 'Annual statistics, complaint reports, coverage analyses, trend reports',
    required: false,
  },
  {
    id: 'policy-planning',
    name: 'Policy and Planning Documents',
    description: 'Policy memoranda, strategic plans, budgets, staffing analyses, evaluations',
    required: false,
  },
];

export interface OrdinanceSection {
  number: string;
  title: string;
  content: string;
  relevantCategories: string[]; // OPRA category IDs
}