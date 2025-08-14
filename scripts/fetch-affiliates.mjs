#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Konfigurera dotenv
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Konfiguration
const FEEDS = [
  {
    name: 'computersalg',
    url: process.env.ATTRACTION_FEED_COMPUTERSALG,
    priority: parseInt(process.env.MERCHANT_PRIORITY_COMPUTERSALG || '1'),
    merchant: 'computersalg',
  },
  {
    name: 'valostore',
    url: process.env.ATTRACTION_FEED_VALOSTORE,
    priority: parseInt(process.env.MERCHANT_PRIORITY_VALOSTORE || '2'),
    merchant: 'valostore',
  },
].filter((feed) => feed.url);

// Validera feeds
if (FEEDS.length === 0) {
  console.error('❌ Inga Adtraction feeds konfigurerade i .env.local');
  console.error(
    'Kopiera config.example till .env.local och uppdatera med dina feed URLs'
  );
  process.exit(1);
}

console.log(`🚀 Startar Adtraction integration med ${FEEDS.length} feeds`);

function normalizeName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*(se|eu|uk|us)\b/gi, '')
    .replace(/\s*\d{4}\b/g, '')
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateMatchKeys(productName) {
  const normalized = normalizeName(productName);
  const keys = [normalized];
  keys.push(normalized.replace(/-/g, ' '));
  keys.push(normalized.replace(/\s+/g, ''));
  keys.push(normalized.replace(/(\w+)\s+(\d+)/g, '$1$2'));
  keys.push(normalized.replace(/(\d+)-(\d+)/g, '$1 $2'));
  return [...new Set(keys)].filter((key) => key.length >= 3);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function findBestMatch(productName, candidates) {
  const productKeys = generateMatchKeys(productName);
  for (const candidate of candidates) {
    const candidateKeys = generateMatchKeys(candidate.name || candidate.title);
    for (const productKey of productKeys) {
      for (const candidateKey of candidateKeys) {
        if (productKey === candidateKey) {
          return {
            candidate,
            matched_on: `exact:${productKey}`,
            confidence: 1.0,
          };
        }
      }
    }
  }
  for (const candidate of candidates) {
    const candidateKeys = generateMatchKeys(candidate.name || candidate.title);
    for (const productKey of productKeys) {
      for (const candidateKey of candidateKeys) {
        if (productKey.length >= 8 && candidateKey.length >= 8) {
          if (
            productKey.includes(candidateKey) ||
            candidateKey.includes(productKey)
          ) {
            const commonLength = Math.min(
              productKey.length,
              candidateKey.length
            );
            const confidence =
              commonLength / Math.max(productKey.length, candidateKey.length);
            return {
              candidate,
              matched_on: `contains:${candidateKey}`,
              confidence,
            };
          }
        }
      }
    }
  }
  let bestMatch = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const candidateKeys = generateMatchKeys(candidate.name || candidate.title);
    for (const productKey of productKeys) {
      for (const candidateKey of candidateKeys) {
        if (productKey.length >= 8 && candidateKey.length >= 8) {
          const distance = levenshteinDistance(productKey, candidateKey);
          if (distance <= 2 && distance < bestDistance) {
            bestDistance = distance;
            bestMatch = {
              candidate,
              matched_on: `levenshtein:${candidateKey}`,
              confidence:
                1 - distance / Math.max(productKey.length, candidateKey.length),
            };
          }
        }
      }
    }
  }
  return bestMatch;
}

async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Hämtar ${url} (försök ${attempt}/${maxRetries})`);
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Prylval-Adtraction-Integration/1.0' },
      });
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log(
        `✅ Hämtade ${data.length || 'okänt antal'} produkter från ${url}`
      );
      return data;
    } catch (error) {
      console.error(`❌ Försök ${attempt} misslyckades: ${error.message}`);
      if (attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Väntar ${delay}ms innan nästa försök...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function fetchAllFeeds() {
  const feedPromises = FEEDS.map(async (feed) => {
    try {
      const products = await fetchWithRetry(feed.url);
      const validProducts = products.filter(
        (product) =>
          product.image_url &&
          product.tracking_url &&
          product.tracking_url.startsWith('https://go.')
      );
      console.log(
        `📊 ${feed.name}: ${validProducts.length}/${products.length} produkter har giltiga URLs`
      );
      return { ...feed, products: validProducts };
    } catch (error) {
      console.error(`❌ Kunde inte hämta ${feed.name}: ${error.message}`);
      return { ...feed, products: [] };
    }
  });
  return await Promise.all(feedPromises);
}

function loadEditorialProducts() {
  const editorialPath = join(
    __dirname,
    '..',
    'data',
    'editorial-products.json'
  );
  if (!existsSync(editorialPath)) {
    console.error('❌ Kunde inte hitta data/editorial-products.json');
    process.exit(1);
  }
  const editorialData = JSON.parse(readFileSync(editorialPath, 'utf8'));
  const products = [];
  for (const [category, productNames] of Object.entries(editorialData)) {
    if (category.startsWith('_')) continue;
    for (const productName of productNames) {
      products.push({
        name: productName,
        category,
        editor_key: normalizeName(productName),
      });
    }
  }
  console.log(
    `📚 Laddade ${products.length} redaktionella produkter från ${
      Object.keys(editorialData).filter((k) => !k.startsWith('_')).length
    } kategorier`
  );
  return products;
}

function loadExistingAffiliateMap() {
  const mapPath = join(__dirname, '..', 'data', 'affiliate-map.json');
  if (existsSync(mapPath)) {
    try {
      const existing = JSON.parse(readFileSync(mapPath, 'utf8'));
      console.log(
        `📋 Laddade befintlig affiliate-map med ${
          Object.keys(existing).filter((k) => !k.startsWith('_')).length
        } produkter`
      );
      return existing;
    } catch (error) {
      console.warn(
        `⚠️ Kunde inte läsa befintlig affiliate-map: ${error.message}`
      );
    }
  }
  return { _schema: 1, _updated_at: new Date().toISOString() };
}

function matchProducts(editorialProducts, feeds) {
  const affiliateMap = loadExistingAffiliateMap();
  const matches = {};
  const coverage = {};
  const warnings = [];
  const sortedFeeds = feeds
    .filter((feed) => feed.products.length > 0)
    .sort((a, b) => b.priority - a.priority);
  for (const product of editorialProducts) {
    const category = product.category;
    if (!coverage[category])
      coverage[category] = { total: 0, matched: 0, merchants: {} };
    coverage[category].total++;
    const allCandidates = [];
    for (const feed of sortedFeeds) {
      allCandidates.push(
        ...feed.products.map((p) => ({
          ...p,
          merchant: feed.merchant,
          priority: feed.priority,
        }))
      );
    }
    const match = findBestMatch(product.name, allCandidates);
    if (match && match.confidence > 0.7) {
      const existingEntry = affiliateMap[product.editor_key];
      if (
        !existingEntry ||
        match.candidate.priority > (existingEntry.merchant_priority || 0) ||
        match.confidence > (existingEntry.confidence || 0)
      ) {
        matches[product.editor_key] = {
          merchant: match.candidate.merchant,
          tracking_url: match.candidate.tracking_url,
          image_url: match.candidate.image_url,
          source_product_id: match.candidate.product_id || match.candidate.id,
          matched_on: match.matched_on,
          confidence: match.confidence,
          merchant_priority: match.candidate.priority,
          updated_at: new Date().toISOString(),
        };
        coverage[category].matched++;
        if (!coverage[category].merchants[match.candidate.merchant])
          coverage[category].merchants[match.candidate.merchant] = 0;
        coverage[category].merchants[match.candidate.merchant]++;
        if (
          existingEntry &&
          existingEntry.merchant !== match.candidate.merchant
        ) {
          warnings.push(
            `⚠️ ${product.name}: Ersatte ${existingEntry.merchant} med ${match.candidate.merchant} (högre prioritet)`
          );
        }
      } else {
        matches[product.editor_key] = existingEntry;
        coverage[category].matched++;
        if (!coverage[category].merchants[existingEntry.merchant])
          coverage[category].merchants[existingEntry.merchant] = 0;
        coverage[category].merchants[existingEntry.merchant]++;
      }
    } else if (affiliateMap[product.editor_key]) {
      matches[product.editor_key] = affiliateMap[product.editor_key];
      coverage[category].matched++;
      if (
        !coverage[category].merchants[affiliateMap[product.editor_key].merchant]
      )
        coverage[category].merchants[
          affiliateMap[product.editor_key].merchant
        ] = 0;
      coverage[category].merchants[affiliateMap[product.editor_key].merchant]++;
    }
  }
  return { matches, coverage, warnings };
}

async function saveAffiliateMap(affiliateMap) {
  const mapPath = join(__dirname, '..', 'data', 'affiliate-map.json');
  const outputDir = dirname(mapPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  const output = {
    _schema: 1,
    _updated_at: new Date().toISOString(),
    _description: 'Automatiskt genererad affiliate-mappning för Prylval',
    ...affiliateMap,
  };
  writeFileSync(mapPath, JSON.stringify(output, null, 2));
  console.log(`💾 Sparade affiliate-map till ${mapPath}`);
}

function printCoverageReport(coverage) {
  console.log('\n📊 COVERAGE RAPPORT');
  console.log('==================');
  let totalProducts = 0;
  let totalMatched = 0;
  for (const [category, stats] of Object.entries(coverage)) {
    const percentage = ((stats.matched / stats.total) * 100).toFixed(1);
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Total: ${stats.total} produkter`);
    console.log(`  Matchade: ${stats.matched} (${percentage}%)`);
    if (stats.merchants) {
      console.log(`  Handlare:`);
      for (const [merchant, count] of Object.entries(stats.merchants)) {
        console.log(`    ${merchant}: ${count} produkter`);
      }
    }
    totalProducts += stats.total;
    totalMatched += stats.matched;
  }
  const overallPercentage = ((totalMatched / totalProducts) * 100).toFixed(1);
  console.log(
    `\n🎯 TOTAL COVERAGE: ${totalMatched}/${totalProducts} (${overallPercentage}%)`
  );
}

async function main() {
  try {
    console.log('🚀 Startar Adtraction produktmatchning...\n');
    const editorialProducts = loadEditorialProducts();
    const feeds = await fetchAllFeeds();
    console.log('\n🔍 Matchar produkter...');
    const { matches, coverage, warnings } = matchProducts(
      editorialProducts,
      feeds
    );
    await saveAffiliateMap(matches);
    printCoverageReport(coverage);
    if (warnings.length > 0) {
      console.log('\n⚠️ VARNINGAR:');
      warnings.forEach((warning) => console.log(warning));
    }
    console.log('\n✅ Adtraction integration slutförd!');
  } catch (error) {
    console.error('\n❌ Fatalt fel:', error.message);
    process.exit(1);
  }
}

main();
