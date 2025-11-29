---
name: gemini-websearch
description: Performs web searches using Gemini CLI headless mode with google_web_search tool. Includes intelligent caching, result validation, and analytics. Use when searching for current information, documentation, or when the user explicitly requests web search.
capabilities: ["gemini-web-search", "content-extraction", "result-validation", "caching", "analytics"]
---

# Gemini Web Search

Advanced web search using Gemini CLI in headless mode with tool restriction. All searches use Gemini's `google_web_search` tool with grounding and citations.

## Quick Start

**Basic search:**
```
python scripts/search.py "React 19 features"
```

**With validation:**
```
python scripts/search.py "TypeScript 5.4 new features" --validate
```

**Batch mode:**
```
python scripts/search.py queries.txt --batch --output results/
```

**View analytics:**
```
python scripts/search.py --show-analytics
```

## Search Workflow

Copy this checklist for research tasks:

```
Research Progress:
- [ ] Step 1: Check cache (1-hour TTL)
- [ ] Step 2: Formulate focused search query
- [ ] Step 3: Execute headless Gemini search
- [ ] Step 4: Parse JSON and extract grounding metadata
- [ ] Step 5: Validate quality and relevance
- [ ] Step 6: Review citations and sources
- [ ] Step 7: Log analytics
```

**Step 1: Check cache**
MD5-keyed cache with 1-hour TTL. Automatic cleanup on expiry. Tracks cache hit rates.

**Step 2: Formulate query**
Keep queries specific and focused. Break complex questions into multiple targeted searches.

**Step 3: Execute headless search**
```
gemini -p "/tool:googleSearch query:\"your query\" raw:true" \
  --yolo --output-format json
```

The `--yolo` flag auto-approves tool usage. Returns structured JSON with grounding metadata.

**Step 4: Parse response**
Extract search results, citations, grounding chunks, and source URLs from JSON output.

**Step 5: Validate results**
Score based on:
- Citation count and quality
- Content completeness and length
- Relevance to original query
- Source authority

False positive detection prevents low-quality results.

**Step 6: Review sources**
Check that citations are included and verify source URLs are authoritative and relevant.

**Step 7: Log analytics**
Track cache hits, latency, quality scores, validation failures, and query patterns.

## Advanced Usage

For detailed examples see [examples.md](examples.md)

**Batch searches with validation:**
```
python scripts/search.py queries.txt \
  --batch \
  --output results/ \
  --validate \
  --min-quality 0.7
```

**Research with retry logic:**
```
python scripts/search.py "complex technical query" \
  --validate \
  --min-citations 3 \
  --min-relevance 0.6 \
  --retry-on-fail \
  --max-retries 2
```

**Disable cache for fresh results:**
```
python scripts/search.py "breaking news topic" --no-cache
```

**Clear cache:**
```
python scripts/search.py --clear-cache
```

## Configuration

### Required: Tool Restriction

Create/update `.gemini/settings.json` to restrict Gemini CLI to only `google_web_search`:

```
{
  "tools": {
    "core": ["google_web_search"],
    "autoAccept": false
  },
  "security": {
    "disableYoloMode": false
  }
}
```

This ensures Gemini ONLY uses the web search tool, not other capabilities.

### Optional: Authentication

```
# Option 1: API key (optional)
export GEMINI_API_KEY="your-api-key"

# Option 2: gcloud authentication
gcloud auth login

# Option 3: Application Default Credentials
gcloud auth application-default login
```

### Environment Variables

```
export SEARCH_CACHE_DIR=".cache/gemini-searches"
export SEARCH_CACHE_TTL="3600"  # 1 hour
export ANALYTICS_LOG="search_analytics.json"
export GEMINI_MODEL="gemini-2.5-flash"
```

### Config File

Optional `~/.gemini-search/config.json`:

```
{
  "model": "gemini-2.5-flash",
  "cache_enabled": true,
  "cache_ttl": 3600,
  "validation": {
    "enabled": true,
    "min_quality": 0.6,
    "min_citations": 2,
    "min_relevance": 0.5,
    "retry_on_fail": true,
    "max_retries": 2
  },
  "analytics": {
    "enabled": true,
    "log_file": "search_analytics.json",
    "track_cache_hits": true,
    "track_latency": true,
    "track_quality": true
  }
}
```

## Command Reference

**Single search:**
```
python scripts/search.py "query" [options]
```

**Batch search:**
```
python scripts/search.py queries.txt --batch [options]
```

**Show analytics:**
```
python scripts/search.py --show-analytics
```

**Clear cache:**
```
python scripts/search.py --clear-cache
```

### Options

- `--model MODEL` - Gemini model (default: gemini-2.5-flash)
- `--no-cache` - Disable caching
- `--validate` - Enable result validation
- `--min-quality FLOAT` - Minimum quality score (0-1, default: 0.6)
- `--min-citations INT` - Minimum citation count (default: 2)
- `--min-relevance FLOAT` - Minimum relevance score (0-1, default: 0.5)
- `--retry-on-fail` - Retry if validation fails
- `--max-retries INT` - Maximum retry attempts (default: 2)
- `--output PATH` - Output file (single) or directory (batch)
- `--batch` - Batch mode: query arg is file path

## Best Practices

- Use headless mode for programmatic searches
- Restrict tools in settings.json for security
- Enable caching for repeated/related queries
- Validate critical searches before using results
- Monitor analytics to optimize query patterns
- Use batch mode for multi-query research
- Set quality thresholds based on use case
- Verify citations and source authority
