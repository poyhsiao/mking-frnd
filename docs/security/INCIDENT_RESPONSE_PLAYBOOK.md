# Incident Response Playbook

**Document Metadata:**

- **Version**: 1.0
- **Last Updated**: December 2024
- **Next Review**: June 2025
- **Document Owner**: Security Team Lead
- **Approved By**: Chief Information Security Officer (CISO)
- **Approval Date**: December 2024

## 1. Overview

### 1.1 Purpose

This Incident Response Playbook provides detailed procedures for detecting,
analyzing, containing, eradicating, and recovering from security incidents. It
serves as a comprehensive guide for the incident response team and stakeholders
during security events.

### 1.2 Scope

This playbook covers:

- Security incident classification and prioritization
- Response procedures for different incident types
- Communication protocols and escalation procedures
- Evidence collection and preservation
- Recovery and post-incident activities

### 1.3 Incident Response Team Roles and Responsibilities

**Core Team Roles:**

- **Incident Commander**: Security Team Lead
- **Technical Lead**: Senior Developer/DevOps Engineer
- **Communication Coordinator**: CTO or designated spokesperson
  - Duties: Internal and external communications, stakeholder notifications,
    media relations
- **Legal Advisor**: Legal counsel (when required)
- **Management Liaison**: Executive representative
  - Responsibilities: Executive decision making, resource allocation, business
    impact assessment

**Extended Team:**

- Subject matter experts
- External security consultants
- Vendor representatives
- Law enforcement liaisons

## 2. Incident Classification

### 2.1 Severity Levels

**Critical (P0)**

- Active data breach with confirmed data exfiltration
- Complete system compromise affecting core business operations
- Ransomware with significant business impact
- Public disclosure of sensitive information
- **Response Time**: Immediate (within 15 minutes)
- **Escalation**: CTO, all senior leadership

**High (P1)**

- Suspected data breach or unauthorized access
- Malware infection on critical systems
- Significant service disruption
- Compliance violation with regulatory impact
- **Response Time**: Within 1 hour
- **Escalation**: Security Team Lead, CTO

**Medium (P2)**

- Security control failures
- Suspicious network activity
- Minor service disruptions
- Policy violations with security implications
- **Response Time**: Within 4 hours
- **Escalation**: Security Team Lead

**Low (P3)**

- Security awareness violations
- Minor configuration issues
- Informational security alerts
- **Response Time**: Within 24 hours
- **Escalation**: Security team member

### 2.2 Incident Types

**Data Breach**

- Unauthorized access to sensitive data
- Data exfiltration or theft
- Accidental data exposure

**Malware Infection**

- Virus, worm, or trojan detection
- Ransomware attacks
- Advanced persistent threats (APT)

**Unauthorized Access**

- Account compromise
- Privilege escalation
- Insider threats

**Denial of Service**

- DDoS attacks
- Resource exhaustion
- Service availability issues

**Physical Security**

- Unauthorized facility access
- Equipment theft
- Social engineering attempts

## 3. Incident Response Process

### 3.1 Phase 1: Preparation

**Pre-Incident Activities:**

1. **Team Readiness**
   - Maintain updated contact lists
   - Conduct regular training exercises
   - Review and update procedures
   - Ensure tool availability and access

2. **Documentation Preparation**
   - Incident response forms
   - Evidence collection templates
   - Communication templates
   - Legal and regulatory requirements

3. **Technical Preparation**
   - Monitoring and detection tools
   - Forensic analysis capabilities
   - Backup and recovery systems
   - Isolation and containment procedures

### 3.2 Phase 2: Detection and Analysis

**Detection Sources:**

- Security monitoring tools (SIEM, IDS/IPS)
- User reports and complaints
- System administrators
- External notifications (vendors, partners)
- Threat intelligence feeds

**Initial Response Steps:**

1. **Incident Identification** (0-15 minutes)

   ```
   □ Receive and log incident report
   □ Assign unique incident ID
   □ Perform initial triage
   □ Determine incident severity
   □ Notify Incident Commander
   ```

2. **Team Activation** (15-30 minutes)

   ```
   □ Activate incident response team
   □ Establish communication channels
   □ Set up incident war room (physical/virtual)
   □ Begin incident documentation
   □ Notify stakeholders per escalation matrix
   ```

3. **Initial Assessment** (30-60 minutes)
   ```
   □ Gather additional information
   □ Identify affected systems and data
   □ Assess potential impact
   □ Determine incident scope
   □ Validate incident classification
   ```

**Evidence Collection:**

1. **Digital Evidence**

   ```bash
   # System information
   uname -a > system_info.txt
   date >> system_info.txt

   # Network connections
   netstat -an > network_connections.txt
   ss -tuln >> network_connections.txt

   # Running processes
   ps aux > running_processes.txt

   # System logs
   cp /var/log/syslog evidence/
   cp /var/log/auth.log evidence/

   # Memory dump (if required)
   dd if=/dev/mem of=memory_dump.img
   ```

2. **Log Analysis**

   ```bash
   # Web server logs
   grep -i "suspicious_pattern" /var/log/apache2/access.log

   # Authentication logs
   grep "Failed password" /var/log/auth.log

   # System events
   journalctl --since "2024-01-01 00:00:00" --until "2024-01-01 23:59:59"
   ```

3. **Network Traffic**

   ```bash
   # Capture network traffic
   tcpdump -i eth0 -w incident_traffic.pcap

   # Analyze existing captures
   wireshark incident_traffic.pcap
   ```

### 3.3 Phase 3: Containment

**Short-term Containment:**

1. **Immediate Actions**

   ```
   □ Isolate affected systems
   □ Disable compromised accounts
   □ Block malicious IP addresses
   □ Preserve evidence
   □ Prevent further damage
   ```

2. **System Isolation**

   ```bash
   # Network isolation
   iptables -A INPUT -j DROP
   iptables -A OUTPUT -j DROP

   # Service shutdown
   systemctl stop apache2
   systemctl stop mysql

   # Account lockout
   passwd -l compromised_user
   ```

3. **Evidence Preservation**

   ```bash
   # Create forensic images
   dd if=/dev/sda of=/mnt/evidence/disk_image.dd bs=4096

   # Calculate checksums
   md5sum /mnt/evidence/disk_image.dd > checksums.md5
   sha256sum /mnt/evidence/disk_image.dd > checksums.sha256
   ```

**Long-term Containment:**

1. **System Hardening**

   ```
   □ Apply security patches
   □ Update security configurations
   □ Implement additional monitoring
   □ Enhance access controls
   □ Deploy compensating controls
   ```

2. **Monitoring Enhancement**

   ```bash
   # Enhanced logging
   echo "*.* /var/log/incident.log" >> /etc/rsyslog.conf

   # File integrity monitoring
   aide --init
   aide --check
   ```

### 3.4 Phase 4: Eradication

**Threat Removal:**

1. **Malware Removal**

   ```bash
   # Antivirus scan
   clamscan -r --infected --remove /

   # Rootkit detection
   rkhunter --check
   chkrootkit

   # Manual cleanup
   rm -f /tmp/malicious_file
   crontab -r -u compromised_user
   ```

2. **Vulnerability Remediation**

   ```bash
   # System updates
   apt update && apt upgrade -y

   # Configuration fixes
   sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
   systemctl restart sshd
   ```

3. **Account Cleanup**

   ```bash
   # Remove unauthorized accounts
   userdel malicious_user

   # Reset passwords
   passwd username

   # Review sudo access
   visudo
   ```

### 3.5 Phase 5: Recovery

**System Restoration:**

1. **Service Restoration**

   ```bash
   # Restore from clean backups
   rsync -av /backup/clean/ /var/www/html/

   # Restart services
   systemctl start apache2
   systemctl start mysql

   # Verify functionality
   curl -I http://localhost
   ```

2. **Monitoring and Validation**

   ```bash
   # Monitor system behavior
   tail -f /var/log/syslog

   # Check for indicators of compromise
   grep -r "suspicious_pattern" /var/log/

   # Validate security controls
   nmap -sS localhost
   ```

3. **Gradual Service Restoration**
   ```
   □ Restore non-critical services first
   □ Monitor for 24-48 hours
   □ Gradually restore critical services
   □ Implement additional monitoring
   □ Conduct security validation
   ```

### 3.6 Phase 6: Post-Incident Activities

**Documentation and Reporting:**

1. **Incident Report**

   ```
   □ Executive summary
   □ Incident timeline
   □ Impact assessment
   □ Response actions taken
   □ Lessons learned
   □ Recommendations
   ```

2. **Evidence Documentation**
   ```
   □ Chain of custody forms
   □ Evidence inventory
   □ Analysis results
   □ Forensic reports
   □ Legal documentation
   ```

**Lessons Learned:**

1. **Post-Incident Review Meeting**

   ```
   □ What happened?
   □ What went well?
   □ What could be improved?
   □ What actions should be taken?
   □ How can we prevent recurrence?
   ```

2. **Process Improvements**
   ```
   □ Update incident response procedures
   □ Enhance detection capabilities
   □ Improve response tools
   □ Additional training needs
   □ Policy updates required
   ```

## 4. Communication Protocols

### 4.1 Internal Communication

**Immediate Notification (Critical/High Incidents):**

- Incident Commander: Immediate
- CTO: Within 15 minutes
- Security Team: Within 30 minutes
- Affected Business Units: Within 1 hour

**Communication Channels:**

- Primary: Slack #incident-response
- Secondary: Email distribution list
- Emergency: Phone/SMS alerts
- War Room: Video conference bridge

**Status Updates:**

- Critical: Every 30 minutes
- High: Every 2 hours
- Medium: Every 8 hours
- Low: Daily

### 4.2 External Communication

**Customer Notification:**

```
□ Assess customer impact
□ Prepare communication message
□ Legal and compliance review
□ Executive approval
□ Multi-channel notification
□ Follow-up communications
```

**Regulatory Reporting:**

```
□ Determine reporting requirements
□ Prepare regulatory notifications
□ Legal review and approval
□ Submit within required timeframes
□ Maintain documentation
```

**Media Relations:**

```
□ Assess public interest
□ Prepare media statement
□ Designate spokesperson
□ Coordinate with PR team
□ Monitor media coverage
```

## 5. Incident-Specific Playbooks

### 5.1 Data Breach Response

**Immediate Actions:**

```
□ Identify data types involved
□ Assess number of records affected
□ Determine breach vector
□ Contain the breach
□ Preserve evidence
□ Notify legal team
```

**Investigation Steps:**

```bash
# Database access logs
grep "SELECT\|INSERT\|UPDATE\|DELETE" /var/log/mysql/query.log

# Application logs
grep -i "unauthorized\|breach\|dump" /var/log/application.log

# Network analysis
tcpdump -r capture.pcap 'port 3306'
```

**Notification Requirements:**

- GDPR: 72 hours to supervisory authority
- CCPA: Without unreasonable delay
- State laws: Varies by jurisdiction
- Customers: As required by law

### 5.2 Ransomware Response

**Immediate Actions:**

```
□ Isolate infected systems
□ Identify ransomware variant
□ Assess backup integrity
□ Do not pay ransom (policy)
□ Contact law enforcement
□ Engage cyber insurance
```

**Recovery Steps:**

```bash
# Identify encrypted files
find / -name "*.encrypted" -o -name "*.locked"

# Check for decryption tools
# Visit nomoreransom.org for free decryptors

# Restore from backups
rsync -av /backup/clean/ /data/
```

### 5.3 Account Compromise

**Immediate Actions:**

```
□ Disable compromised account
□ Reset passwords
□ Review account activity
□ Check for privilege escalation
□ Audit access logs
□ Notify account owner
```

**Investigation Commands:**

```bash
# Login history
last username
grep username /var/log/auth.log

# Sudo usage
grep sudo /var/log/auth.log | grep username

# File access
find /home/username -type f -newermt "2024-01-01"
```

### 5.4 DDoS Attack Response

**Immediate Actions:**

```
□ Confirm DDoS attack
□ Activate DDoS mitigation
□ Contact ISP/CDN provider
□ Implement rate limiting
□ Monitor attack patterns
□ Document attack details
```

**Mitigation Commands:**

```bash
# Rate limiting
iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT

# Block attack sources
iptables -A INPUT -s attacker_ip -j DROP

# Monitor connections
netstat -an | grep :80 | wc -l
```

## 6. Tools and Resources

### 6.1 Incident Response Tools

**Detection and Monitoring:**

- SIEM: Splunk/ELK Stack
- IDS/IPS: Suricata/Snort
- Network monitoring: Wireshark/tcpdump
- Endpoint detection: CrowdStrike/Carbon Black

**Forensic Analysis:**

- Disk imaging: dd/FTK Imager
- Memory analysis: Volatility
- Network analysis: Wireshark/NetworkMiner
- Log analysis: Splunk/ELK

**Communication:**

- Incident tracking: Jira/ServiceNow
- Team communication: Slack/Microsoft Teams
- Video conferencing: Zoom/WebEx
- Documentation: Confluence/SharePoint

### 6.2 External Resources

**Government Agencies:**

- FBI Internet Crime Complaint Center (IC3)
- CISA Cybersecurity Incident Reporting
- Local law enforcement cybercrime units

**Industry Resources:**

- SANS Incident Response resources
- NIST Cybersecurity Framework
- MITRE ATT&CK Framework
- Threat intelligence feeds

**Vendor Support:**

- Security vendor emergency contacts
- Cloud provider security teams
- Managed security service providers
- Cyber insurance carriers

## 7. Legal and Regulatory Considerations

### 7.1 Evidence Handling

**Chain of Custody:**

```
□ Document evidence collection
□ Maintain custody records
□ Secure evidence storage
□ Control access to evidence
□ Prepare for legal proceedings
```

**Legal Hold:**

```
□ Identify relevant data
□ Preserve electronic records
□ Suspend deletion policies
□ Document preservation efforts
□ Coordinate with legal team
```

### 7.2 Regulatory Compliance

**Notification Timelines:**

- GDPR: 72 hours (authority), without undue delay (individuals)
- CCPA: Without unreasonable delay
- HIPAA: 60 days (individuals), 60 days (HHS)
- SOX: Immediate (material incidents)

**Documentation Requirements:**

```
□ Incident details and timeline
□ Data types and volumes affected
□ Individuals/entities impacted
□ Response actions taken
□ Mitigation measures implemented
```

## 8. Training and Exercises

### 8.1 Training Requirements

**All Team Members:**

- Annual incident response training
- Role-specific procedures
- Tool usage and access
- Communication protocols

**Specialized Training:**

- Digital forensics
- Malware analysis
- Legal and compliance
- Crisis communication

### 8.2 Exercise Program

**Tabletop Exercises:**

- Quarterly scenario discussions
- Process walkthrough
- Decision-making practice
- Communication testing

**Simulation Exercises:**

- Semi-annual technical simulations
- Full incident response activation
- Tool and procedure testing
- Performance measurement

## 9. Metrics and Reporting

### 9.1 Key Metrics

**Response Metrics:**

- Mean Time to Detection (MTTD)
- Mean Time to Response (MTTR)
- Mean Time to Recovery (MTTR)
- Incident escalation time

**Quality Metrics:**

- False positive rate
- Incident recurrence rate
- Customer satisfaction
- Compliance adherence

### 9.2 Reporting

**Incident Reports:**

- Executive summary
- Technical details
- Impact assessment
- Lessons learned
- Recommendations

**Trend Analysis:**

- Monthly incident trends
- Quarterly threat landscape
- Annual security posture
- Benchmark comparisons

## 10. Contact Information

### 10.1 Emergency Contacts

**Incident Response Team:**

- Incident Commander: +1-XXX-XXX-XXXX
- Technical Lead: +1-XXX-XXX-XXXX
- Communications Lead: +1-XXX-XXX-XXXX

**Executive Team:**

- CTO: +1-XXX-XXX-XXXX
- CEO: +1-XXX-XXX-XXXX
- Legal Counsel: +1-XXX-XXX-XXXX

### 10.2 External Contacts

**Law Enforcement:**

- FBI Cyber Division: 1-855-292-3937
- Local Police Cybercrime Unit: XXX-XXX-XXXX
- CISA: 1-888-282-0870

**Vendors and Partners:**

- Security Vendor Support: XXX-XXX-XXXX
- Cloud Provider Security: XXX-XXX-XXXX
- Cyber Insurance: XXX-XXX-XXXX

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Next Review**: $(date -d '+6 months')  
**Owner**: Security Team  
**Approved By**: CTO  
**Classification**: Confidential
