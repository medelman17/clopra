/**
 * Municipality validation and search improvement utilities
 */

interface MunicipalityInfo {
  name: string;
  county: string;
  state: string;
  type?: string; // City, Township, Borough, etc.
}

/**
 * Common municipality name variations and their official names
 */
const MUNICIPALITY_ALIASES: Record<string, string> = {
  // Common abbreviations
  'mt laurel': 'Mount Laurel',
  'mt holly': 'Mount Holly',
  'n brunswick': 'North Brunswick',
  's brunswick': 'South Brunswick',
  'e brunswick': 'East Brunswick',
  'w windsor': 'West Windsor',
  'e windsor': 'East Windsor',
  // Common misspellings
  'summitt': 'Summit',
  'morristwon': 'Morristown',
};

/**
 * Municipality types in New Jersey
 */
const NJ_MUNICIPALITY_TYPES = [
  'City',
  'Township',
  'Borough',
  'Town',
  'Village',
];

/**
 * Build more specific search queries for a municipality
 */
export function buildMunicipalitySearchQueries(
  municipality: string,
  county?: string
): string[] {
  const queries: string[] = [];
  
  // Normalize the municipality name
  const normalizedName = MUNICIPALITY_ALIASES[municipality.toLowerCase()] || municipality;
  
  // Try different municipality type combinations
  for (const type of NJ_MUNICIPALITY_TYPES) {
    if (county) {
      // Most specific: with county and type
      queries.push(`"${normalizedName} ${type}" "${county} County" "New Jersey" rent control ordinance`);
      queries.push(`"${type} of ${normalizedName}" "${county} County" NJ rent control`);
    }
    
    // With type but no county
    queries.push(`"${normalizedName} ${type}" "New Jersey" rent control ordinance municipal code`);
  }
  
  // Add queries for official sites
  if (county) {
    queries.push(`site:ecode360.com "${normalizedName}" "${county} County" NJ rent control`);
    queries.push(`site:municode.com "${normalizedName}" "${county} County" New Jersey rent control`);
  }
  
  // Add .gov site searches
  queries.push(`site:nj.gov "${normalizedName}" rent control ordinance`);
  queries.push(`"${normalizedName}" site:*.gov rent control ordinance "New Jersey"`);
  
  // PDF-specific searches
  queries.push(`"${normalizedName}" "New Jersey" rent control ordinance filetype:pdf`);
  
  return queries;
}

/**
 * Validate if content is for the correct municipality
 */
export function validateMunicipalityMatch(
  content: string,
  targetMunicipality: string,
  county?: string
): {
  isMatch: boolean;
  confidence: number;
  issues: string[];
} {
  const lowerContent = content.toLowerCase();
  const lowerTarget = targetMunicipality.toLowerCase();
  const issues: string[] = [];
  let score = 0;
  
  // Check for municipality name
  if (!lowerContent.includes(lowerTarget)) {
    issues.push('Municipality name not found in content');
    score -= 50;
  } else {
    score += 30;
  }
  
  // Check for "New Jersey" or "NJ"
  if (!lowerContent.includes('new jersey') && !lowerContent.includes(' nj ')) {
    issues.push('No New Jersey reference found');
    score -= 30;
  } else {
    score += 20;
  }
  
  // Check for county if provided
  if (county) {
    const lowerCounty = county.toLowerCase();
    if (lowerContent.includes(lowerCounty + ' county')) {
      score += 25;
    } else {
      issues.push(`County "${county}" not found`);
      score -= 10;
    }
  }
  
  // Check for wrong state indicators
  const wrongStates = ['delaware', 'pennsylvania', 'new york', 'connecticut', 'maryland'];
  for (const state of wrongStates) {
    if (lowerContent.includes(state) && !lowerContent.includes('new jersey')) {
      issues.push(`Content appears to be for ${state}, not New Jersey`);
      score -= 100;
      break;
    }
  }
  
  // Check for municipality type
  const hasType = NJ_MUNICIPALITY_TYPES.some(type => 
    lowerContent.includes(lowerTarget + ' ' + type.toLowerCase()) ||
    lowerContent.includes(type.toLowerCase() + ' of ' + lowerTarget)
  );
  
  if (hasType) {
    score += 15;
  }
  
  return {
    isMatch: score > 0,
    confidence: Math.max(0, Math.min(100, score)),
    issues,
  };
}

/**
 * Extract municipality information from content
 */
export function extractMunicipalityInfo(content: string): MunicipalityInfo | null {
  const patterns = [
    // "City of Newark, Essex County, New Jersey"
    /(?:City|Township|Borough|Town|Village)\s+of\s+([^,]+),\s*([^,]+)\s+County,\s*New\s+Jersey/i,
    // "Newark City, Essex County, NJ"
    /([^,]+)\s+(?:City|Township|Borough|Town|Village),\s*([^,]+)\s+County,\s*(?:NJ|New\s+Jersey)/i,
    // "Township of Mount Laurel, Burlington County"
    /(Township|City|Borough|Town|Village)\s+of\s+([^,]+),\s*([^,]+)\s+County/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      // Parse based on pattern structure
      if (pattern.source.includes('of\\s+([^,]+)')) {
        return {
          name: match[1].trim(),
          county: match[2].trim(),
          state: 'NJ',
          type: match[0].split(' ')[0],
        };
      }
    }
  }
  
  return null;
}

/**
 * Score a URL for municipality relevance
 */
export function scoreMunicipalityUrl(
  url: string,
  targetMunicipality: string
): number {
  const lowerUrl = url.toLowerCase();
  const lowerTarget = targetMunicipality.toLowerCase().replace(/\s+/g, '-');
  let score = 0;
  
  // Check for municipality name in URL
  if (lowerUrl.includes(lowerTarget)) {
    score += 30;
  }
  
  // Check for official code sites
  if (lowerUrl.includes('ecode360.com')) {
    score += 40;
    // eCode360 URLs often have pattern: /NJ/municipality-name
    if (lowerUrl.includes('/nj/' + lowerTarget)) {
      score += 30;
    }
  } else if (lowerUrl.includes('municode.com')) {
    score += 40;
  } else if (lowerUrl.includes('generalcode.com')) {
    score += 35;
  }
  
  // Check for .gov domains
  if (lowerUrl.includes('.gov')) {
    score += 25;
    if (lowerUrl.includes(lowerTarget + '.nj.us')) {
      score += 40; // Official municipality website
    }
  }
  
  // Check for New Jersey indicators
  if (lowerUrl.includes('/nj/') || lowerUrl.includes('newjersey')) {
    score += 15;
  }
  
  // Penalize wrong states
  if (lowerUrl.includes('/ny/') || lowerUrl.includes('/pa/') || 
      lowerUrl.includes('/de/') || lowerUrl.includes('/ct/')) {
    score -= 50;
  }
  
  return score;
}