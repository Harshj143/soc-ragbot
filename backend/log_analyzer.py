import json
import os
from collections import Counter
from datetime import datetime

class LogAnalyzer:
    def __init__(self, log_path: str = "../data/raw_logs/logs.json"):
        self.log_path = os.path.join(os.path.dirname(__file__), log_path)

    def analyze_brute_force(self, threshold: int = 50):
        """
        Analyzes the log file for brute force signatures.
        Returns a summary of top offending IPs and targeted users.
        """
        if not os.path.exists(self.log_path):
            return f"Log file not found at {self.log_path}"

        try:
            with open(self.log_path, 'r', encoding='utf-8-sig') as f:
                logs = json.load(f)
        except Exception as e:
            return f"Error loading logs: {str(e)}"

        ip_counts = Counter()
        user_counts = Counter()
        ip_user_mapping = {}

        for entry in logs:
            ip = entry.get('foreign_ip', 'unknown')
            user = entry.get('username', 'unknown')
            passwords = entry.get('passwords', [])
            
            # Count failed attempts based on password list length or just entry existence
            # In this dataset, each entry seems to represent a session with multiple password attempts
            attempts = len(passwords) if passwords else 1
            
            ip_counts[ip] += attempts
            user_counts[user] += attempts
            
            if ip not in ip_user_mapping:
                ip_user_mapping[ip] = set()
            ip_user_mapping[ip].add(user)

        # Filter by threshold
        offenders = {ip: count for ip, count in ip_counts.items() if count >= threshold}
        sorted_offenders = sorted(offenders.items(), key=lambda x: x[1], reverse=True)

        # Generate report
        report = "--- Log Analysis Summary: Brute Force Detection ---\n"
        report += f"Total Login Attempts Processed: {sum(ip_counts.values())}\n"
        report += f"Unique Source IPs: {len(ip_counts)}\n\n"
        
        report += "Top Offending IPs (Failed Attempts > Threshold):\n"
        for ip, count in sorted_offenders[:10]:
            users = ", ".join(list(ip_user_mapping[ip])[:5])
            report += f"- IP: {ip} | Attempts: {count} | Targeted Users: {users}\n"
            
        report += "\nMost Targeted User Accounts:\n"
        for user, count in user_counts.most_common(5):
            report += f"- User: {user} | Total Attempts: {count}\n"

        return report

if __name__ == "__main__":
    analyzer = LogAnalyzer()
    print(analyzer.analyze_brute_force())
