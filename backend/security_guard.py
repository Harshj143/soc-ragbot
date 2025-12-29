import re

class SecurityGuard:
    def __init__(self):
        # Keywords commonly used in prompt injection/jailbreaking attempts
        self.malicious_keywords = [
            r"ignore\s+(all\s+)?previous\s+instructions",
            r"system\s*prompt",
            r"you\s+are\s+now\s+an\s+evil",
            r"output\s+the\s+full\s+prompt",
            r"bypass\s+all\s+filters",
            r"dan\s+mode",
            r"jailbreak",
            r"administrator\s*mode"
        ]
    
    def sanitize_query(self, query: str) -> str:
        """Sanitizes the user query to prevent basic prompt injection."""
        if not query:
            return ""
            
        # 1. Truncate excessively long queries (e.g., > 1000 chars) to prevent payload stuffing
        sanitized = query[:1000]
        
        # 2. Strip potential markdown or control characters that could confuse the LLM
        sanitized = re.sub(r"[`#*]", "", sanitized)
        
        # 3. Neutralize common injection phrases by adding spacing/obfuscation
        # Instead of deleting, we make them "non-functional" data to the LLM
        for pattern in self.malicious_keywords:
            sanitized = re.sub(pattern, "[REDACTED_SECURITY_PATTERN]", sanitized, flags=re.IGNORECASE)
            
        return sanitized.strip()

    def is_suspicious(self, query: str) -> bool:
        """Heuristic check for suspicious patterns."""
        for pattern in self.malicious_keywords:
            if re.search(pattern, query, re.IGNORECASE):
                return True
        return False
