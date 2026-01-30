#!/usr/bin/env node
/**
 * Ingests OpenAPI YAML into Supabase KB tables
 * 
 * Reads docs/gamelayer.yaml, parses it, and upserts:
 * - Tags into kb_openapi_tags
 * - Endpoints into kb_openapi_endpoints
 * 
 * Usage: node scripts/ingest-openapi.mjs
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY env vars
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const REST_URL = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  'apikey': SUPABASE_SERVICE_ROLE_KEY,
  'authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'content-type': 'application/json',
  'prefer': 'resolution=merge-duplicates'
};

/**
 * Upsert tags into kb_openapi_tags
 */
async function upsertTags(tags) {
  if (!tags || !Array.isArray(tags)) {
    return 0;
  }

  const tagRecords = tags
    .filter(tag => tag.name)
    .map(tag => ({
      name: tag.name,
      description: tag.description || null,
      source: 'docs/gamelayer.yaml'
    }));

  if (tagRecords.length === 0) {
    return 0;
  }

  try {
    const response = await fetch(`${REST_URL}/kb_openapi_tags`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(tagRecords)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to upsert tags: ${response.status} ${text}`);
    }

    return tagRecords.length;
  } catch (error) {
    console.error('Error upserting tags:', error);
    throw error;
  }
}

/**
 * Extract security info (high-level, no secrets)
 */
function extractSecurity(operation, globalSecurity) {
  if (!operation.security && !globalSecurity) {
    return null;
  }

  const security = operation.security || globalSecurity;
  if (!Array.isArray(security) || security.length === 0) {
    return null;
  }

  // Extract security scheme names (not actual keys)
  const schemes = security
    .flatMap(s => Object.keys(s))
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  return schemes.length > 0 ? JSON.stringify(schemes) : null;
}

/**
 * Extract endpoints from OpenAPI spec
 */
function extractEndpoints(openApiSpec) {
  const endpoints = [];
  const paths = openApiSpec.paths || {};
  const globalSecurity = openApiSpec.security;

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    // OpenAPI methods
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') {
        continue;
      }

      // Extract operation details
      const endpoint = {
        method: method.toUpperCase(),
        path: path,
        operation_id: operation.operationId || null,
        tags: Array.isArray(operation.tags) ? operation.tags : [],
        summary: operation.summary || null,
        description: operation.description || null,
        deprecated: operation.deprecated === true,
        security: extractSecurity(operation, globalSecurity),
        source: 'docs/gamelayer.yaml'
      };

      endpoints.push(endpoint);
    }
  }

  return endpoints;
}

/**
 * Upsert endpoints in batches
 */
async function upsertEndpoints(endpoints) {
  if (endpoints.length === 0) {
    return 0;
  }

  // Upsert in batches of 50 to avoid payload size issues
  const BATCH_SIZE = 50;
  let upserted = 0;
  let skipped = 0;

  for (let i = 0; i < endpoints.length; i += BATCH_SIZE) {
    const batch = endpoints.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(`${REST_URL}/kb_openapi_endpoints`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${response.status} ${text}`);
        skipped += batch.length;
        continue;
      }

      upserted += batch.length;
    } catch (error) {
      console.error(`Error upserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
      skipped += batch.length;
    }
  }

  if (skipped > 0) {
    console.warn(`Warning: ${skipped} endpoints were skipped due to errors`);
  }

  return upserted;
}

/**
 * Main ingestion function
 */
async function main() {
  console.log('Starting OpenAPI ingestion...\n');

  // Read and parse YAML
  const yamlPath = join(projectRoot, 'docs', 'gamelayer.yaml');
  console.log(`Reading: ${yamlPath}`);

  let openApiSpec;
  try {
    const yamlContent = readFileSync(yamlPath, 'utf-8');
    openApiSpec = yaml.parse(yamlContent);
  } catch (error) {
    console.error(`Error reading/parsing YAML: ${error.message}`);
    process.exit(1);
  }

  if (!openApiSpec) {
    console.error('Error: Failed to parse OpenAPI spec');
    process.exit(1);
  }

  console.log('✓ YAML parsed successfully\n');

  // Extract and upsert tags
  console.log('Processing tags...');
  const tags = openApiSpec.tags || [];
  const tagsCount = await upsertTags(tags);
  console.log(`✓ Upserted ${tagsCount} tags\n`);

  // Extract endpoints
  console.log('Extracting endpoints...');
  const endpoints = extractEndpoints(openApiSpec);
  console.log(`✓ Extracted ${endpoints.length} endpoints\n`);

  // Upsert endpoints
  console.log('Upserting endpoints...');
  const endpointsCount = await upsertEndpoints(endpoints);
  console.log(`✓ Upserted ${endpointsCount} endpoints\n`);

  // Summary
  console.log('='.repeat(50));
  console.log('Ingestion Summary:');
  console.log(`  Tags: ${tagsCount}`);
  console.log(`  Endpoints: ${endpointsCount}`);
  if (endpoints.length > endpointsCount) {
    console.log(`  Skipped: ${endpoints.length - endpointsCount}`);
  }
  console.log('='.repeat(50));
  console.log('\n✓ Ingestion complete!');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});








