import os
import json
import sqlite3
import numpy as np
from typing import Optional, Dict, Any
from langchain_openai import OpenAIEmbeddings

class CacheManager:
    def __init__(self, db_path: str = "../data/cache.db"):
        self.db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), db_path))
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.embeddings = OpenAIEmbeddings()
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS semantic_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT UNIQUE,
                    query_vector BLOB,
                    response TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def _cosine_similarity(self, v1: np.ndarray, v2: np.ndarray) -> float:
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    def get(self, query: str, threshold: float = 0.90) -> Optional[Dict[str, Any]]:
        """Retrieves a cached response if a semantically similar query exists."""
        try:
            query_vector = np.array(self.embeddings.embed_query(query))
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT query, query_vector, response FROM semantic_cache")
                rows = cursor.fetchall()

            best_match = None
            max_sim = -1
            best_query = ""

            for cached_query, cached_vector_blob, response_json in rows:
                cached_vector = np.frombuffer(cached_vector_blob, dtype=np.float64)
                sim = self._cosine_similarity(query_vector, cached_vector)
                
                if sim > max_sim:
                    max_sim = sim
                    best_match = response_json
                    best_query = cached_query

            if max_sim >= threshold:
                print(f"DEBUG: Semantic cache hit! Similarity with '{best_query}': {max_sim:.4f}")
                return json.loads(best_match)
            
            print(f"DEBUG: Cache miss. Best match ('{best_query}') similarity: {max_sim:.4f}")
            return None
        except Exception as e:
            print(f"DEBUG: Cache lookup error: {e}")
            return None

    def set(self, query: str, response: Dict[str, Any]):
        """Caches a query and its response."""
        try:
            query_vector = np.array(self.embeddings.embed_query(query))
            response_json = json.dumps(response)
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO semantic_cache (query, query_vector, response) VALUES (?, ?, ?)",
                    (query, query_vector.tobytes(), response_json)
                )
                conn.commit()
        except Exception as e:
            print(f"DEBUG: Cache save error: {e}")

if __name__ == "__main__":
    # Quick test
    cm = CacheManager()
    test_query = "how to handle ransomware"
    test_response = {"report": "test report", "classification": "Ransomware", "sources": []}
    
    cm.set(test_query, test_response)
    hit = cm.get("ransomware handling steps")
    print(f"Result for similar query: {hit}")
