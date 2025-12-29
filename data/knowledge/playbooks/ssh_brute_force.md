# Playbook: SSH Brute Force Detection and Mitigation

## Overview
This playbook outlines the steps to investigate and mitigate an SSH brute force attack.

## Detection
- Multiple failed login attempts for a single user or multiple users from a single IP address.
- Logs: `/var/log/auth.log` or `/var/log/secure`.

## Investigation
1. Identify the source IP address.
2. Check if the IP is known for malicious activity (e.g., via Threat Intel).
3. Determine which accounts were targeted.
4. Verify if any login attempts were successful.

## Mitigation
1. Block the source IP in the firewall or using Fail2Ban.
2. Disable password-based SSH login and use SSH keys.
3. Change passwords for targeted accounts if necessary.
