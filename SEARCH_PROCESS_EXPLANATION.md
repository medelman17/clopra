# Ordinance Search Process Explanation

## Current Problems

### 1. **Wrong Municipality Selection**
The search is returning ordinances from wrong municipalities because:
- **No geographic validation**: Doesn't verify the content is actually from the target NJ municipality
- **Generic queries**: "Jersey City rent control" might return results from Jersey City, Missouri
- **First-result bias**: Takes the first search result without proper validation

### 2. **Search Query Structure**
Current queries are too simple:
```typescript
// Current approach
`${municipalityName} rent control ordinance`

// This returns:
// - News articles mentioning the municipality
// - Other states with similar municipality names  
// - Generic rent control information
// - Search result pages
```

## How the Process Should Work

### Step 1: Municipality Disambiguation
```typescript
// Normalize the name
"mt laurel" → "Mount Laurel"
"n brunswick" → "North Brunswick"

// Add geographic context
"Newark" → "Newark, Essex County, New Jersey"
"Princeton" → "Princeton, Mercer County, New Jersey"
```

### Step 2: Targeted Search Queries
Instead of one generic query, use multiple specific ones:
```typescript
// Official code sites
`site:ecode360.com "Mount Laurel" "Burlington County" NJ rent control`

// Government sites
`site:mountlaurel.nj.us rent control ordinance`

// Specific document searches
`"Township of Mount Laurel" "Burlington County" "New Jersey" rent control ordinance filetype:pdf`
```

### Step 3: Result Validation
For each search result:

1. **URL Scoring**
   - Is it from ecode360.com/NJ/Mount-Laurel? (+70 points)
   - Is it from mountlaurel.nj.us? (+65 points)
   - Is it from municode.com? (+40 points)
   - Does URL contain "/PA/" or "/NY/"? (-50 points)

2. **Content Validation**
   - Does it mention "Mount Laurel"? (Required)
   - Does it mention "Burlington County"? (+25 points)
   - Does it mention "New Jersey" or "NJ"? (Required)
   - Does it have legal structure? (+30 points)

3. **Municipality Verification**
   ```typescript
   // Extract and verify municipality info
   "Township of Mount Laurel, Burlington County, New Jersey"
   // Verify this matches our target
   ```

### Step 4: Intelligent Fallbacks

If initial searches fail:
1. Try different municipality types (City/Township/Borough)
2. Search for PDF documents specifically
3. Use Perplexity with explicit geographic constraints
4. Try county-level searches

## Example: Why "Jersey City" Fails

**Current Process:**
1. Searches: "Jersey City rent control ordinance"
2. Gets: First result (might be Jersey City, Missouri)
3. Validates: Has "rent control" ✓, has sections ✓
4. Returns: Wrong municipality!

**Improved Process:**
1. Searches: 
   - `site:ecode360.com "Jersey City" "Hudson County" NJ rent control`
   - `"City of Jersey City" "Hudson County" "New Jersey" rent control ordinance`
   - `site:jerseycitynj.gov rent control ordinance`
2. Validates each result:
   - Is it actually Jersey City, NJ? 
   - Does it mention Hudson County?
   - Is the URL from a NJ source?
3. Scores and ranks results
4. Returns: Correct municipality with high confidence

## Implementation Priority

1. **Add municipality validation** to ensure we're getting the right city/town
2. **Improve search queries** with county and state context
3. **Score URLs better** to prioritize official sources
4. **Validate content** includes correct geographic markers
5. **Use Perplexity** with explicit instructions about NJ municipalities

## Quick Fixes Available

1. Always include county in searches when available
2. Prioritize .gov and ecode360.com domains
3. Reject results that mention other states
4. Require "New Jersey" or "NJ" in the content
5. Use municipality type (City/Township/Borough) in queries