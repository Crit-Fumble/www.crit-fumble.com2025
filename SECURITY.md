# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

We take the security of Crit-Fumble seriously. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

### Where to Report

Please report security vulnerabilities to:
- **Email**: security@crit-fumble.com
- **Subject Line**: `[SECURITY] Brief description of the vulnerability`

### What to Include

When reporting a vulnerability, please include:

1. **Description**: A clear and concise description of the vulnerability
2. **Impact**: What an attacker could achieve by exploiting this vulnerability
3. **Steps to Reproduce**: Detailed steps to reproduce the vulnerability
4. **Proof of Concept**: If applicable, provide PoC code or screenshots
5. **Suggested Fix**: If you have suggestions for how to fix the issue
6. **Your Information**: How we can contact you for follow-up

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Updates**: We will send you regular updates about our progress
- **Timeline**: We aim to validate and fix critical vulnerabilities within 7-14 days
- **Credit**: We will publicly credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

### For Self-Hosted Deployments

If you're self-hosting Crit-Fumble, please ensure:

1. **Environment Variables**: Never commit `.env` files or expose API keys
2. **HTTPS Only**: Always use HTTPS in production (enable `HSTS` header)
3. **Database Security**: Use strong passwords and enable SSL for database connections
4. **Regular Updates**: Keep all dependencies up to date with `npm audit fix`
5. **Firewall**: Restrict access to your database and Redis instances
6. **Backups**: Maintain regular encrypted backups of your database

### For Contributors

When contributing code:

1. **No Secrets**: Never commit API keys, tokens, or sensitive data
2. **Dependency Review**: Run `npm audit` before submitting PRs
3. **Input Validation**: Always validate and sanitize user input
4. **SQL Injection**: Use Prisma's parameterized queries (never raw SQL with user input)
5. **XSS Prevention**: Sanitize HTML output and use React's built-in XSS protection
6. **CSRF Protection**: Use NextAuth's built-in CSRF tokens
7. **Rate Limiting**: All new API routes should include rate limiting

## Known Security Features

### Authentication & Authorization

- **Session-Based Auth**: Using NextAuth with secure session cookies
- **Rate Limiting**: All API routes protected with rate limiting (100-200 req/min)
- **Owner-Only Routes**: High-value operations restricted to platform owners
- **User-Owned Data**: Users can only access their own game data

### API Security

- **Owner-Only AI Routes**: Prevents API cost abuse ($40k/month potential savings)
- **Owner-Only Foundry Routes**: Prevents infrastructure abuse
- **Rate Limiting**: Prevents DoS attacks on all routes
- **Input Validation**: All API inputs validated with Zod schemas

### Infrastructure Security

- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **HTTPS Enforcement**: Strict-Transport-Security with preload
- **Secure Cookies**: httpOnly, secure, sameSite cookies
- **Environment Isolation**: Separate staging and production environments

### Data Protection

- **Encryption at Rest**: Database encrypted by Vercel/Neon
- **Encryption in Transit**: All connections use TLS 1.3
- **Token Encryption**: API tokens encrypted with AES-256
- **Password Hashing**: Bcrypt with salt rounds (via NextAuth)

## Vulnerability Disclosure Timeline

We follow this responsible disclosure timeline:

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: We acknowledge and begin investigation
3. **Day 3-7**: We validate and develop a fix
4. **Day 7-14**: We deploy the fix to production
5. **Day 14+**: Public disclosure (if appropriate)

For critical vulnerabilities (RCE, data breach, etc.), we may accelerate this timeline.

## Security Hall of Fame

We recognize security researchers who help us keep Crit-Fumble secure:

<!-- Security researchers will be listed here after responsible disclosure -->

*Thank you to all security researchers who help keep Crit-Fumble safe!*

## Security Contacts

- **Email**: security@crit-fumble.com
- **GitHub**: Open a **private security advisory** (not a public issue)
- **Response Time**: Within 48 hours

## Bug Bounty Program

We do not currently offer a paid bug bounty program, but we deeply appreciate responsible security disclosures and will:

- Publicly credit you (unless you prefer anonymity)
- Provide swag/credits on our platform
- Feature you in our Security Hall of Fame

## Compliance

Crit-Fumble follows industry-standard security practices:

- **OWASP Top 10**: We actively mitigate all OWASP Top 10 vulnerabilities
- **CWE Top 25**: We address the CWE Top 25 most dangerous software weaknesses
- **GDPR Compliance**: User data handling complies with GDPR requirements
- **SOC 2 Type II**: Our infrastructure providers (Vercel, Neon) are SOC 2 certified

## Security Audit History

| Date | Type | Findings | Status |
|------|------|----------|--------|
| 2025-11-24 | Internal Security Audit | 63 unsecured routes | Fixed (Phases 1-3) |
| 2025-11-24 | npm audit | 6 vulnerabilities | 5 fixed, 1 dev-only |

## Additional Resources

- [Security Best Practices](docs/agent/SECURITY_BEST_PRACTICES.md) - Developer security guide
- [Production Security Checklist](docs/agent/PRODUCTION_SECURITY_CHECKLIST.md) - Pre-deployment checklist
- [Phase 1-3 Security Report](docs/agent/SECURITY_OVERALL_PROGRESS.md) - Latest security improvements

---

**Last Updated**: November 24, 2025

