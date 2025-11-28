import subprocess
import json
import hashlib
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import os
import sys
import platform

class SearchCache:
    """MD5-keyed cache with TTL."""
    
    def __init__(self, cache_dir: str = ".cache/gemini-searches", ttl: int = 3600):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = ttl
    
    def _get_key(self, query: str, model: str) -> str:
        """Generate MD5 cache key."""
        return hashlib.md5(f"{query}:{model}".encode()).hexdigest()
    
    def get(self, query: str, model: str) -> Optional[Dict]:
        """Retrieve cached result if valid."""
        key = self._get_key(query, model)
        cache_file = self.cache_dir / f"{key}.json"
        
        if not cache_file.exists():
            return None
        
        with open(cache_file) as f:
            cached = json.load(f)
        
        # Check TTL
        cached_time = datetime.fromisoformat(cached["timestamp"])
        if datetime.now() - cached_time > timedelta(seconds=self.ttl):
            cache_file.unlink()
            return None
        
        return cached["result"]
    
    def set(self, query: str, model: str, result: Dict):
        """Cache search result."""
        key = self._get_key(query, model)
        cache_file = self.cache_dir / f"{key}.json"
        
        with open(cache_file, 'w') as f:
            json.dump({
                "query": query,
                "model": model,
                "timestamp": datetime.now().isoformat(),
                "result": result
            }, f, indent=2)
    
    def clear(self):
        """Clear all cached results."""
        for cache_file in self.cache_dir.glob("*.json"):
            cache_file.unlink()


class ResultValidator:
    """Validates and scores search results."""
    
    @staticmethod
    def extract_citations(result: Dict) -> List[Dict]:
        """Extract citations from grounding metadata."""
        citations = []
        
        if "grounding_metadata" in result:
            for chunk in result["grounding_metadata"].get("grounding_chunks", []):
                if "web" in chunk:
                    citations.append({
                        "url": chunk["web"].get("uri"),
                        "title": chunk["web"].get("title"),
                        "snippet": chunk.get("snippet")
                    })
        
        return citations
    
    @staticmethod
    def calculate_relevance(query: str, result: Dict) -> float:
        """Calculate relevance score based on query match."""
        text = result.get("text", "").lower()
        query_terms = query.lower().split()
        
        # Count query term matches
        matches = sum(1 for term in query_terms if term in text)
        relevance = matches / len(query_terms) if query_terms else 0
        
        return min(relevance, 1.0)
    
    @staticmethod
    def score_quality(result: Dict, citations: List[Dict], query: str) -> float:
        """Multi-factor quality score (0-1)."""
        score = 0.0
        
        # Citation count (max 0.3)
        citation_score = min(len(citations) * 0.1, 0.3)
        score += citation_score
        
        # Content length (max 0.2)
        text = result.get("text", "")
        length_score = min(len(text) / 1000, 0.2)
        score += length_score
        
        # Grounding metadata (0.2)
        if result.get("grounding_metadata"):
            score += 0.2
        
        # Relevance to query (0.3)
        relevance = ResultValidator.calculate_relevance(query, result)
        score += relevance * 0.3
        
        return min(score, 1.0)
    
    @staticmethod
    def validate(result: Dict, query: str, min_quality: float = 0.6,
                 min_citations: int = 2, min_relevance: float = 0.5) -> Tuple[bool, float, str]:
        """Validate search result with false positive detection."""
        citations = ResultValidator.extract_citations(result)
        quality = ResultValidator.score_quality(result, citations, query)
        relevance = ResultValidator.calculate_relevance(query, result)
        
        if quality < min_quality:
            return False, quality, f"Quality {quality:.2f} below threshold {min_quality}"
        
        if len(citations) < min_citations:
            return False, quality, f"Only {len(citations)} citations (need {min_citations})"
        
        if relevance < min_relevance:
            return False, quality, f"Low relevance {relevance:.2f} (threshold {min_relevance})"
        
        return True, quality, "Valid"


class SearchAnalytics:
    """Tracks search analytics."""
    
    def __init__(self, log_file: str = "search_analytics.json"):
        self.log_file = Path(log_file)
        self.stats = self._load()
    
    def _load(self) -> Dict:
        if self.log_file.exists():
            with open(self.log_file) as f:
                return json.load(f)
        return {
            "total_searches": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "avg_latency_ms": 0,
            "quality_scores": [],
            "failed_validations": 0,
            "queries": []
        }
    
    def _save(self):
        with open(self.log_file, 'w') as f:
            json.dump(self.stats, f, indent=2)
    
    def log_search(self, query: str, cached: bool, latency_ms: float,
                   quality: Optional[float] = None, valid: bool = True):
        self.stats["total_searches"] += 1
        
        if cached:
            self.stats["cache_hits"] += 1
        else:
            self.stats["cache_misses"] += 1
        
        # Update average latency
        total = self.stats["total_searches"]
        current_avg = self.stats["avg_latency_ms"]
        self.stats["avg_latency_ms"] = (current_avg * (total - 1) + latency_ms) / total
        
        if quality is not None:
            self.stats["quality_scores"].append(quality)
        
        if not valid:
            self.stats["failed_validations"] += 1
        
        self.stats["queries"].append({
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "cached": cached,
            "latency_ms": latency_ms,
            "quality": quality,
            "valid": valid
        })
        
        self._save()
    
    def get_cache_hit_rate(self) -> float:
        total = self.stats["total_searches"]
        return self.stats["cache_hits"] / total if total > 0 else 0.0
    
    def get_avg_quality(self) -> float:
        scores = self.stats["quality_scores"]
        return sum(scores) / len(scores) if scores else 0.0


def get_gemini_command() -> List[str]:
    """
    Get the correct command to invoke Gemini CLI based on the OS.

    Returns a list of command arguments that can be used with subprocess.run.
    """
    system = platform.system()

    if system == "Windows":
        try:
            gemini_path = subprocess.check_output(
                ["where", "gemini"],
                stderr=subprocess.DEVNULL,
                text=True
            ).strip().split('\n')[0]

            if not gemini_path or not Path(gemini_path).exists():
                raise FileNotFoundError("gemini not found in PATH")

            if gemini_path.endswith('.cmd') or gemini_path.endswith('.bat'):
                return [gemini_path]

            node_modules_path = str(Path(gemini_path).parent / "node_modules" / "@google" / "gemini-cli" / "dist" / "index.js")
            if Path(node_modules_path).exists():
                return ["node", node_modules_path]

            return ["bash", gemini_path] if Path(gemini_path).exists() else ["node", node_modules_path]

        except (subprocess.CalledProcessError, FileNotFoundError):
            try:
                npm_prefix = subprocess.check_output(
                    ["npm", "config", "get", "prefix"],
                    stderr=subprocess.DEVNULL,
                    text=True
                ).strip()

                node_path = Path(npm_prefix) / "node_modules" / "@google" / "gemini-cli" / "dist" / "index.js"
                if node_path.exists():
                    return ["node", str(node_path)]
            except:
                pass

            raise FileNotFoundError("Could not find gemini CLI. Please install it with: npm install -g @google/gemini-cli")
    else:
        try:
            result = subprocess.run(
                ["which", "gemini"],
                capture_output=True,
                check=True,
                text=True
            )
            return [result.stdout.strip()]
        except subprocess.CalledProcessError:
            raise FileNotFoundError("Could not find gemini CLI. Please install it with: npm install -g @google/gemini-cli")


def search_gemini(query: str, model: str = "gemini-2.5-flash",
                  use_cache: bool = True, validate: bool = False,
                  min_quality: float = 0.6, min_citations: int = 2,
                  min_relevance: float = 0.5,
                  retry_on_fail: bool = False, max_retries: int = 2) -> Dict:
    """
    Execute Gemini search using headless mode.

    Uses: gemini -p "/tool:googleSearch query:\"...\" raw:true"
          --yolo --output-format json

    """
    cache_dir = os.getenv("SEARCH_CACHE_DIR", ".cache/gemini-searches")
    cache_ttl = int(os.getenv("SEARCH_CACHE_TTL", "3600"))
    analytics_log = os.getenv("ANALYTICS_LOG", "search_analytics.json")
    
    cache = SearchCache(cache_dir, cache_ttl)
    analytics = SearchAnalytics(analytics_log)
    
    start_time = time.time()
    
    # Check cache
    if use_cache:
        cached_result = cache.get(query, model)
        if cached_result:
            latency_ms = (time.time() - start_time) * 1000
            analytics.log_search(query, True, latency_ms)
            return cached_result
    
    # Execute headless search with retry logic
    attempt = 0
    while attempt <= (max_retries if retry_on_fail else 0):
        try:
            # Get the correct gemini command for this OS
            gemini_cmd = get_gemini_command()

            # Headless mode command
            prompt = f'/tool:google_web_search query:"{query}" raw:true'

            result = subprocess.run(
                gemini_cmd + [
                    "-p", prompt,
                    "--yolo",
                    "--output-format", "json",
                    "-m", model
                ],
                capture_output=True,
                text=True,
                timeout=120,
                check=True
            )

            # Parse JSON response
            search_result = json.loads(result.stdout)
            search_result["query"] = query
            search_result["model"] = model
            search_result["success"] = True
            
            # Validate if enabled
            if validate:
                valid, quality, message = ResultValidator.validate(
                    search_result, query, min_quality, min_citations, min_relevance
                )
                search_result["validation"] = {
                    "valid": valid,
                    "quality": quality,
                    "message": message
                }
                
                if not valid and retry_on_fail and attempt < max_retries:
                    attempt += 1
                    print(f"Validation failed: {message}. Retrying ({attempt}/{max_retries})...", 
                          file=sys.stderr)
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
            else:
                quality = None
                valid = True
            
            # Cache result
            if use_cache:
                cache.set(query, model, search_result)
            
            # Log analytics
            latency_ms = (time.time() - start_time) * 1000
            analytics.log_search(query, False, latency_ms, quality, valid)
            
            return search_result
            
        except subprocess.TimeoutExpired:
            attempt += 1
            if attempt > max_retries:
                return {
                    "query": query,
                    "error": "Search timeout after 30s",
                    "success": False
                }
            time.sleep(2 ** attempt)

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            return {
                "query": query,
                "error": f"Search failed: {str(e)}",
                "success": False
            }
    
    return {
        "query": query,
        "error": "Max retries exceeded",
        "success": False
    }


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Gemini web search with caching and validation"
    )
    parser.add_argument("query", nargs="?", help="Search query")
    parser.add_argument("--model", default="gemini-2.5-flash")
    parser.add_argument("--no-cache", action="store_true", help="Disable cache")
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--min-quality", type=float, default=0.6)
    parser.add_argument("--min-citations", type=int, default=2)
    parser.add_argument("--min-relevance", type=float, default=0.5)
    parser.add_argument("--retry-on-fail", action="store_true")
    parser.add_argument("--max-retries", type=int, default=2)
    parser.add_argument("--show-analytics", action="store_true")
    parser.add_argument("--clear-cache", action="store_true")
    parser.add_argument("--output", help="Output file for results")
    
    args = parser.parse_args()
    
    if args.clear_cache:
        cache = SearchCache()
        cache.clear()
        print("Cache cleared")
        sys.exit(0)
    
    if args.show_analytics:
        analytics = SearchAnalytics()
        print(f"Total searches: {analytics.stats['total_searches']}")
        print(f"Cache hit rate: {analytics.get_cache_hit_rate():.1%}")
        print(f"Avg quality: {analytics.get_avg_quality():.2f}")
        print(f"Avg latency: {analytics.stats['avg_latency_ms']:.0f}ms")
        print(f"Failed validations: {analytics.stats['failed_validations']}")
        sys.exit(0)
    
    if not args.query:
        parser.print_help()
        sys.exit(1)
    
    result = search_gemini(
        args.query,
        model=args.model,
        use_cache=not args.no_cache,
        validate=args.validate,
        min_quality=args.min_quality,
        min_citations=args.min_citations,
        min_relevance=args.min_relevance,
        retry_on_fail=args.retry_on_fail,
        max_retries=args.max_retries
    )
    
    output = json.dumps(result, indent=2)
    
    if args.output:
        Path(args.output).write_text(output)
        print(f"Results saved to {args.output}")
    else:
        print(output)
