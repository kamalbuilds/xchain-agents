/**
 * Extract Market ID from Polymarket URL
 * Production-ready script to get condition_id from Polymarket URLs
 * 
 * Usage: node extract-market-id-from-url.js "https://polymarket.com/event/new-york-city-mayoral-election"
 */

const https = require('https');
const http = require('http');

/**
 * Make HTTP request with promise
 */
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Polymarket-Extractor/1.0)',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            error: null
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: `JSON parse error: ${error.message}`
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        status: 0,
        data: null,
        error: error.message
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Extract slug from Polymarket URL
 */
function extractSlugFromUrl(url) {
  try {
    const patterns = [
      /polymarket\.com\/event\/([^/?#]+)/,  // Event URL pattern
      /polymarket\.com\/market\/([^/?#]+)/, // Market URL pattern
      /polymarket\.com\/([^/?#]+)$/         // Direct slug pattern
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log(`✓ Extracted slug: ${match[1]}`);
        return match[1];
      }
    }
    
    console.log(`✗ Could not extract slug from URL: ${url}`);
    return null;
  } catch (error) {
    console.log(`✗ Error extracting slug: ${error.message}`);
    return null;
  }
}

/**
 * Search for market by slug in Gamma API
 */
async function findMarketBySlug(slug) {
  try {
    console.log(`🔍 Searching for market with slug: ${slug}`);
    
    // Method 1: Search with slug parameter (if supported)
    let url = `https://gamma-api.polymarket.com/markets?slug=${encodeURIComponent(slug)}`;
    console.log(`Trying URL: ${url}`);
    
    let response = await makeHttpRequest(url);
    
    if (response.error) {
      console.log(`❌ Gamma API error: ${response.error}`);
    } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log(`✓ Found ${response.data.length} results with slug parameter`);
      return parseMarketResults(response.data, slug);
    }
    
    // Method 2: Get recent markets and search manually
    console.log(`\n🔍 Searching through recent markets manually...`);
    url = `https://gamma-api.polymarket.com/markets?offset=0`;
    
    response = await makeHttpRequest(url);
    
    if (response.error) {
      console.log(`❌ Gamma API error: ${response.error}`);
      return null;
    }
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`✓ Retrieved ${response.data.length} markets to search through`);
      return parseMarketResults(response.data, slug);
    }
    
    console.log(`❌ No valid data returned from Gamma API`);
    return null;
    
  } catch (error) {
    console.log(`❌ Error finding market by slug: ${error.message}`);
    return null;
  }
}

/**
 * Parse market results and find matching slug
 */
function parseMarketResults(events, targetSlug) {
  console.log(`\n📋 Parsing ${events.length} events for slug: ${targetSlug}`);
  
  const results = [];
  
  for (const event of events) {
    // Check event slug
    if (event.slug === targetSlug) {
      console.log(`✅ Found matching EVENT slug: ${event.slug}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Title: ${event.title}`);
      
      if (event.markets && event.markets.length > 0) {
        for (const market of event.markets) {
          results.push({
            type: 'event_market',
            event_id: event.id,
            event_slug: event.slug,
            event_title: event.title,
            market_id: market.id,
            market_slug: market.slug,
            condition_id: market.conditionId,
            question: market.question,
            active: market.active,
            closed: market.closed,
            volume: market.volume || market.volumeClob || 0
          });
        }
      }
    }
    
    // Check individual market slugs within events
    if (event.markets && Array.isArray(event.markets)) {
      for (const market of event.markets) {
        if (market.slug === targetSlug) {
          console.log(`✅ Found matching MARKET slug: ${market.slug}`);
          console.log(`   Market ID: ${market.id}`);
          console.log(`   Question: ${market.question}`);
          
          results.push({
            type: 'individual_market',
            event_id: event.id,
            event_slug: event.slug,
            event_title: event.title,
            market_id: market.id,
            market_slug: market.slug,
            condition_id: market.conditionId,
            question: market.question,
            active: market.active,
            closed: market.closed,
            volume: market.volume || market.volumeClob || 0
          });
        }
      }
    }
    
    // Fuzzy matching for similar slugs
    if (event.slug && event.slug.includes(targetSlug.split('-')[0])) {
      console.log(`🔍 Similar event slug found: ${event.slug}`);
    }
  }
  
  return results;
}

/**
 * Get market data using CLOB API
 */
async function getMarketFromCLOB(conditionId) {
  try {
    console.log(`\n🔍 Getting market data from CLOB API for condition: ${conditionId}`);
    
    const url = `https://clob.polymarket.com/markets?condition_id=${conditionId}`;
    const response = await makeHttpRequest(url);
    
    if (response.error) {
      console.log(`❌ CLOB API error: ${response.error}`);
      return null;
    }
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const market = response.data[0];
      console.log(`✅ Found market in CLOB API:`);
      console.log(`   Condition ID: ${market.condition_id}`);
      console.log(`   Question: ${market.question}`);
      console.log(`   Active: ${market.active}`);
      console.log(`   Closed: ${market.closed}`);
      
      return {
        type: 'clob_market',
        condition_id: market.condition_id,
        question: market.question,
        market_slug: market.market_slug,
        active: market.active,
        closed: market.closed,
        tokens: market.tokens,
        category: market.category,
        end_date: market.end_date_iso
      };
    }
    
    console.log(`❌ No market found with condition ID: ${conditionId}`);
    return null;
    
  } catch (error) {
    console.log(`❌ Error getting market from CLOB: ${error.message}`);
    return null;
  }
}

/**
 * Main extraction function
 */
async function extractMarketId(identifier) {
  console.log(`\n🚀 Starting market ID extraction for: ${identifier}`);
  console.log(`==========================================`);
  
  try {
    let results = [];
    
    // Step 1: Handle URL input
    if (identifier.includes('polymarket.com')) {
      console.log(`\n📍 Step 1: Extracting slug from URL...`);
      const slug = extractSlugFromUrl(identifier);
      
      if (slug) {
        const marketResults = await findMarketBySlug(slug);
        if (marketResults && marketResults.length > 0) {
          results = results.concat(marketResults);
        }
      }
    }
    // Step 2: Handle direct slug input
    else if (!identifier.startsWith('0x')) {
      console.log(`\n📍 Step 1: Treating input as direct slug...`);
      const marketResults = await findMarketBySlug(identifier);
      if (marketResults && marketResults.length > 0) {
        results = results.concat(marketResults);
      }
    }
    // Step 3: Handle condition ID input
    else if (identifier.startsWith('0x')) {
      console.log(`\n📍 Step 1: Treating input as condition ID...`);
      const marketResult = await getMarketFromCLOB(identifier);
      if (marketResult) {
        results.push(marketResult);
      }
    }
    
    // Display results
    console.log(`\n📊 RESULTS`);
    console.log(`==========================================`);
    
    if (results.length === 0) {
      console.log(`❌ No markets found for identifier: ${identifier}`);
      
      // Suggest alternatives
      console.log(`\n💡 Suggestions:`);
      console.log(`   - Check if the URL is correct`);
      console.log(`   - Try using just the slug part (e.g., "new-york-city-mayoral-election")`);
      console.log(`   - Check if the market exists and is active`);
      
      return { success: false, results: [] };
    }
    
    console.log(`✅ Found ${results.length} market(s):`);
    
    results.forEach((result, index) => {
      console.log(`\n--- Market ${index + 1} ---`);
      console.log(`Type: ${result.type}`);
      console.log(`Condition ID: ${result.condition_id}`);
      console.log(`Question: ${result.question}`);
      
      if (result.event_title) {
        console.log(`Event: ${result.event_title}`);
      }
      
      if (result.market_slug) {
        console.log(`Market Slug: ${result.market_slug}`);
      }
      
      console.log(`Active: ${result.active}`);
      console.log(`Closed: ${result.closed}`);
      
      if (result.volume) {
        console.log(`Volume: ${result.volume}`);
      }
    });
    
    // Return the first/best result
    const bestResult = results[0];
    console.log(`\n🎯 RECOMMENDED RESULT:`);
    console.log(`Condition ID: ${bestResult.condition_id}`);
    console.log(`Type: ${bestResult.type}`);
    console.log(`Status: ${bestResult.active ? 'Active' : 'Inactive'} / ${bestResult.closed ? 'Closed' : 'Open'}`);
    
    return {
      success: true,
      results: results,
      recommended: bestResult
    };
    
  } catch (error) {
    console.log(`💥 Critical error: ${error.message}`);
    return { success: false, error: error.message, results: [] };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`Usage: node extract-market-id-from-url.js "<URL_OR_SLUG_OR_CONDITION_ID>"`);
    console.log(`\nExamples:`);
    console.log(`  node extract-market-id-from-url.js "https://polymarket.com/event/new-york-city-mayoral-election"`);
    console.log(`  node extract-market-id-from-url.js "new-york-city-mayoral-election"`);
    console.log(`  node extract-market-id-from-url.js "0x1234567890abcdef..."`);
    process.exit(1);
  }
  
  const identifier = args[0];
  
  extractMarketId(identifier)
    .then(result => {
      if (result.success) {
        console.log(`\n✅ SUCCESS: Found market ID!`);
        process.exit(0);
      } else {
        console.log(`\n❌ FAILED: Could not extract market ID`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.log(`\n💥 FATAL ERROR: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  extractMarketId,
  extractSlugFromUrl,
  findMarketBySlug,
  getMarketFromCLOB
}; 