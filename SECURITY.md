# Security Policy

## Supported Versions

We take security seriously and will address security vulnerabilities in a timely
manner. The following table outlines which versions of our project are currently
supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We appreciate your efforts to responsibly disclose security vulnerabilities. If
you discover a security issue, please follow the guidelines below:

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email security vulnerabilities to:
   [security@novelist.ai](mailto:security@novelist.ai)
3. Include detailed information about the vulnerability
4. Provide steps to reproduce the issue
5. Allow us time to investigate and respond before public disclosure

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### Response Timeline

- **Initial Response**: Within 48 hours
- **Investigation**: Within 7 days
- **Resolution**: Within 30 days for critical issues
- **Public Disclosure**: After fixes are available

### Security Measures

Our security measures include:

1. **Code Scanning**: Automated security scanning with CodeQL
2. **Dependency Auditing**: Regular dependency vulnerability checks
3. **Fuzzing**: Continuous fuzzing testing
4. **License Compliance**: Automated license compliance checking
5. **Vulnerability Disclosure**: Coordinated vulnerability disclosure

### Supported Security Features

#### CodeQL Analysis

- Static application security testing (SAST)
- Custom security queries for JavaScript/TypeScript
- Automated vulnerability detection
- Integration with GitHub Security Advisories

#### Dependency Scanning

- npm audit integration
- CVE vulnerability detection
- Automated dependency updates
- License compatibility checking

#### Fuzzing Testing

- Coverage-guided fuzzing
- Property-based testing
- Mutation testing
- Continuous security testing

#### Security Headers

- Content Security Policy (CSP)
- HTTPS enforcement
- XSS protection
- CSRF protection

### Security Best Practices

1. **Input Validation**: All user inputs are validated and sanitized
2. **Authentication**: Strong authentication mechanisms
3. **Authorization**: Proper access controls
4. **Encryption**: Data encrypted in transit and at rest
5. **Secure Headers**: Security headers properly configured

### Incident Response

In case of a security incident:

1. Immediate assessment and containment
2. Investigation and root cause analysis
3. Notification to affected users
4. Implementation of fixes
5. Post-incident review and improvements

### Contact Information

For security-related questions or concerns:

- Email: security@novelist.ai
- GitHub Security: Use the "Report a vulnerability" option
- Emergency: Contact the security team directly

### Acknowledgments

We maintain a list of security researchers who have responsibly disclosed
vulnerabilities:

- [Security Researcher Hall of Fame](SECURITY_RESEARCHERS.md)

Thank you for helping keep our project and community safe!
