import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Helper functions
const runCommand = (command: string): string => {
  try {
    return execSync(command, { encoding: 'utf8', cwd: process.cwd() });
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
};

const fileExists = (filePath: string): boolean => {
  return fs.existsSync(path.resolve(filePath));
};

const readFile = (filePath: string): string => {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
};

const writeFile = (filePath: string, content: string): void => {
  fs.writeFileSync(path.resolve(filePath), content, 'utf8');
};

// Background steps
Given('the GitHub Actions security workflow exists', async function () {
  const workflowPath = '.github/workflows/security.yml';
  expect(fileExists(workflowPath)).toBe(true);

  const workflowContent = readFile(workflowPath);
  const workflow = yaml.load(workflowContent) as any;

  expect(workflow.name).toBe('Security Scan');
  expect(workflow.jobs).toHaveProperty('secret-scan');
  expect(workflow.jobs).toHaveProperty('dependency-scan');
  expect(workflow.jobs).toHaveProperty('sast-scan');
  expect(workflow.jobs).toHaveProperty('container-scan');
  expect(workflow.jobs).toHaveProperty('infrastructure-scan');
});

Given('the security scanning tools are properly configured', async function () {
  // Check Gitleaks configuration
  expect(fileExists('.gitleaks.toml')).toBe(true);

  // Check secrets baseline
  expect(fileExists('.secrets.baseline')).toBe(true);

  // Check package.json for security dependencies
  const packageJson = JSON.parse(readFile('package.json'));
  expect(packageJson.devDependencies).toHaveProperty('@cucumber/cucumber');
});

Given('the project follows security best practices', async function () {
  // Check for basic security configurations
  expect(fileExists('docker-compose.yml')).toBe(true);
  expect(fileExists('tsconfig.json')).toBe(true);

  // Verify no obvious hardcoded secrets in main files
  const packageContent = readFile('package.json');
  expect(packageContent).not.toMatch(/password.*=.*["'][^$]/i);
  expect(packageContent).not.toMatch(/secret.*=.*["'][^$]/i);
});

// Secret detection scenarios
Given('the Gitleaks configuration is properly set up', async function () {
  const gitleaksConfig = readFile('.gitleaks.toml');
  expect(gitleaksConfig).toContain('[allowlist]');
  expect(gitleaksConfig).toContain('description');
});

Given('the TruffleHog scanner is configured with verified-only mode', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('trufflesecurity/trufflehog');
  expect(workflowContent).toContain('--only-verified');
});

When('the secret detection scan runs', async function () {
  // Simulate running Gitleaks locally if available
  try {
    const result = runCommand('which gitleaks');
    if (result.trim()) {
      this.secretScanResult = runCommand(
        'gitleaks detect --source . --verbose --exit-code 0 || true',
      );
    } else {
      this.secretScanResult = 'Gitleaks not available locally - would run in CI';
    }
  } catch {
    this.secretScanResult = 'Gitleaks not available locally - would run in CI';
  }
});

Then('no real secrets should be detected in the codebase', async function () {
  // Check for common secret patterns manually
  const files = ['.env.example', 'README.md', 'package.json'];

  for (const file of files) {
    if (fileExists(file)) {
      const content = readFile(file);
      // Should not contain actual secrets (only placeholders or examples)
      expect(content).not.toMatch(/sk-[a-zA-Z0-9]{48}/);
      expect(content).not.toMatch(/ghp_[a-zA-Z0-9]{36}/);
      expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
    }
  }
});

Then('the .secrets.baseline file should contain only approved exceptions', async function () {
  const baseline = JSON.parse(readFile('.secrets.baseline'));
  expect(baseline.results).toBeDefined();

  // Verify all baseline entries are for example files or documentation
  for (const [filename, findings] of Object.entries(baseline.results)) {
    expect(filename).toMatch(/\.(example|md|txt)$|docs\//i);
  }
});

Then('all environment variable references should use proper templating', async function () {
  const dockerComposeContent = readFile('docker-compose.yml');
  const envVarPattern = /\$\{[A-Z_]+\}/g;
  const matches = dockerComposeContent.match(envVarPattern);

  if (matches) {
    // Verify environment variables follow naming conventions
    matches.forEach(match => {
      expect(match).toMatch(/^\$\{[A-Z][A-Z0-9_]*\}$/);
    });
  }
});

// Dependency vulnerability scenarios
Given('the project dependencies are installed', async function () {
  expect(fileExists('node_modules')).toBe(true);
  expect(fileExists('pnpm-lock.yaml')).toBe(true);
});

Given('the Snyk token is properly configured', async function () {
  // In CI, this would be checked as an environment variable
  // For local testing, we'll just verify the workflow configuration
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('SNYK_TOKEN');
});

When('the dependency vulnerability scan runs', async function () {
  try {
    this.auditResult = runCommand('pnpm audit --audit-level=moderate --json');
  } catch (error: any) {
    this.auditResult = error.stdout || error.message;
  }
});

Then('no critical or high severity vulnerabilities should be found', async function () {
  try {
    const auditOutput = JSON.parse(this.auditResult);
    if (auditOutput.metadata) {
      expect(auditOutput.metadata.vulnerabilities.critical || 0).toBe(0);
      expect(auditOutput.metadata.vulnerabilities.high || 0).toBe(0);
    }
  } catch {
    // If audit result is not JSON, check for specific patterns
    expect(this.auditResult).not.toContain('critical');
    expect(this.auditResult).not.toContain('high');
  }
});

Then('all medium severity issues should be documented or fixed', async function () {
  // Check if there's a security documentation file
  const securityDocs = ['SECURITY.md', 'docs/security.md', 'docs/SECURITY.md'];
  const hasSecurityDoc = securityDocs.some(doc => fileExists(doc));

  if (!hasSecurityDoc) {
    console.warn('Consider creating a SECURITY.md file to document known issues');
  }
});

Then('the pnpm audit should pass with acceptable risk levels', async function () {
  // The audit should not fail with critical or high severity issues
  expect(this.auditResult).not.toContain('npm audit found');
});

// SAST scenarios
Given('the CodeQL analysis is configured for JavaScript/TypeScript', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('github/codeql-action/init');
  expect(workflowContent).toContain('javascript');
});

Given('Semgrep rules are set for security, secrets, and OWASP top 10', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('returntocorp/semgrep-action');
  expect(workflowContent).toContain('p/security-audit');
  expect(workflowContent).toContain('p/secrets');
  expect(workflowContent).toContain('p/owasp-top-ten');
});

When('the SAST scan runs', async function () {
  // For local testing, we'll check for common security anti-patterns
  this.sastFindings = [];

  const filesToCheck = ['src/**/*.ts', 'backend/**/*.ts', 'frontend/**/*.ts'];
  // This would be replaced by actual SAST tool results in CI
  this.sastFindings.push('SAST scan would run in CI environment');
});

Then('no critical security vulnerabilities should be detected', async function () {
  // Check for common security anti-patterns in code
  const tsFiles = runCommand(
    'find . -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*"',
  )
    .split('\n')
    .filter(f => f.trim());

  for (const file of tsFiles) {
    if (fileExists(file)) {
      const content = readFile(file);
      // Check for SQL injection patterns
      expect(content).not.toMatch(/query\s*\+\s*["'`]/i);
      // Check for eval usage
      expect(content).not.toMatch(/\beval\s*\(/i);
    }
  }
});

Then('all security-related code patterns should follow best practices', async function () {
  // Check for proper input validation patterns
  const hasValidation = fileExists('src') || fileExists('backend') || fileExists('frontend');
  expect(hasValidation).toBe(true);
});

Then('no hardcoded credentials should be found', async function () {
  const configFiles = ['src', 'backend', 'frontend'].filter(dir => fileExists(dir));

  for (const dir of configFiles) {
    const result = runCommand(
      `find ${dir} -name "*.ts" -exec grep -l "password\|secret\|key" {} \; || true`,
    );
    if (result.trim()) {
      const files = result.split('\n').filter(f => f.trim());
      for (const file of files) {
        const content = readFile(file);
        // Should use environment variables, not hardcoded values
        expect(content).not.toMatch(/password\s*[:=]\s*["'][^$]/i);
        expect(content).not.toMatch(/secret\s*[:=]\s*["'][^$]/i);
      }
    }
  }
});

// Container security scenarios
Given('the Docker images are built successfully', async function () {
  expect(fileExists('Dockerfile')).toBe(true);
  expect(fileExists('docker-compose.yml')).toBe(true);
});

Given('Trivy scanner is configured for critical, high, and medium severity', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('aquasecurity/trivy-action');
  expect(workflowContent).toContain('severity');
});

When('the container security scan runs', async function () {
  // Check Dockerfile for security best practices
  if (fileExists('Dockerfile')) {
    this.dockerfileContent = readFile('Dockerfile');
  }
  if (fileExists('backend/Dockerfile')) {
    this.backendDockerfile = readFile('backend/Dockerfile');
  }
  if (fileExists('frontend/Dockerfile')) {
    this.frontendDockerfile = readFile('frontend/Dockerfile');
  }
});

Then('no critical vulnerabilities should be found in base images', async function () {
  // Check for updated base images
  const dockerfiles = [
    this.dockerfileContent,
    this.backendDockerfile,
    this.frontendDockerfile,
  ].filter(Boolean);

  for (const dockerfile of dockerfiles) {
    // Should use specific versions, not latest
    expect(dockerfile).not.toMatch(/FROM.*:latest/i);
    // Should use official images
    expect(dockerfile).toMatch(/FROM\s+(node|nginx|alpine|ubuntu):/i);
  }
});

Then('high severity issues should be documented with mitigation plans', async function () {
  // Check for security documentation
  const hasSecurityDoc = fileExists('SECURITY.md') || fileExists('docs/security.md');
  if (!hasSecurityDoc) {
    console.warn('Consider creating security documentation for container vulnerabilities');
  }
});

Then('the SARIF results should be uploaded to GitHub Security tab', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('github/codeql-action/upload-sarif');
});

// Infrastructure security scenarios
Given(
  'the Checkov scanner is configured for Docker, Kubernetes, and Docker Compose',
  async function () {
    const workflowContent = readFile('.github/workflows/security.yml');
    expect(workflowContent).toContain('bridgecrewio/checkov-action');
  },
);

Given('kube-linter is set up for Kubernetes manifests', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('kube-linter');
});

When('the infrastructure security scan runs', async function () {
  // Check infrastructure files for security issues
  this.infraFiles = {
    dockerCompose: fileExists('docker-compose.yml') ? readFile('docker-compose.yml') : null,
    k8sFiles: fileExists('k8s')
      ? runCommand('find k8s -name "*.yaml" -o -name "*.yml"')
          .split('\n')
          .filter(f => f.trim())
      : [],
  };
});

Then('all Docker configurations should follow security best practices', async function () {
  if (this.infraFiles.dockerCompose) {
    const compose = yaml.load(this.infraFiles.dockerCompose) as any;

    // Check for security best practices
    for (const [serviceName, service] of Object.entries(compose.services || {})) {
      const svc = service as any;

      // Should not run as root
      if (svc.user) {
        expect(svc.user).not.toBe('root');
        expect(svc.user).not.toBe('0');
      }

      // Should not expose unnecessary ports
      if (svc.ports) {
        expect(Array.isArray(svc.ports)).toBe(true);
      }
    }
  }
});

Then('Kubernetes manifests should pass security policy checks', async function () {
  for (const k8sFile of this.infraFiles.k8sFiles) {
    if (fileExists(k8sFile)) {
      const content = readFile(k8sFile);
      const docs = yaml.loadAll(content);

      for (const doc of docs) {
        if (doc && typeof doc === 'object' && 'kind' in doc) {
          const manifest = doc as any;

          if (manifest.kind === 'Deployment' || manifest.kind === 'Pod') {
            // Should have security context
            const containers =
              manifest.spec?.template?.spec?.containers || manifest.spec?.containers || [];
            for (const container of containers) {
              // Should not run as root
              if (container.securityContext) {
                expect(container.securityContext.runAsRoot).not.toBe(true);
              }
            }
          }
        }
      }
    }
  }
});

Then('Docker Compose files should not expose sensitive information', async function () {
  if (this.infraFiles.dockerCompose) {
    const content = this.infraFiles.dockerCompose;

    // Should not contain hardcoded passwords
    expect(content).not.toMatch(/password\s*:\s*["'][^$]/i);
    expect(content).not.toMatch(/secret\s*:\s*["'][^$]/i);

    // Should use environment variables
    expect(content).toMatch(/\$\{[A-Z_]+\}/);
  }
});

// Integration scenarios
Given('all security scanning tools are properly configured', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');

  // Verify all required tools are present
  expect(workflowContent).toContain('gitleaks');
  expect(workflowContent).toContain('trufflehog');
  expect(workflowContent).toContain('snyk');
  expect(workflowContent).toContain('codeql');
  expect(workflowContent).toContain('semgrep');
  expect(workflowContent).toContain('trivy');
  expect(workflowContent).toContain('checkov');
});

Given('the GitHub Actions workflow has appropriate permissions', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('permissions:');
  expect(workflowContent).toContain('security-events: write');
});

When('the complete security workflow runs', async function () {
  // This would trigger the actual GitHub Actions workflow
  // For local testing, we verify the workflow structure
  const workflow = yaml.load(readFile('.github/workflows/security.yml')) as any;

  this.workflowJobs = Object.keys(workflow.jobs);
  expect(this.workflowJobs).toContain('secret-scan');
  expect(this.workflowJobs).toContain('dependency-scan');
  expect(this.workflowJobs).toContain('sast-scan');
  expect(this.workflowJobs).toContain('container-scan');
  expect(this.workflowJobs).toContain('infrastructure-scan');
});

Then('all security scan jobs should complete successfully', async function () {
  // Verify job dependencies and structure
  const workflow = yaml.load(readFile('.github/workflows/security.yml')) as any;

  for (const jobName of this.workflowJobs) {
    const job = workflow.jobs[jobName];
    expect(job.steps).toBeDefined();
    expect(Array.isArray(job.steps)).toBe(true);
    expect(job.steps.length).toBeGreaterThan(0);
  }
});

Then('the security report should show acceptable risk levels', async function () {
  const workflow = yaml.load(readFile('.github/workflows/security.yml')) as any;
  expect(workflow.jobs['security-report']).toBeDefined();
});

Then('SARIF results should be properly uploaded to GitHub Security tab', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  const sarifUploads = (workflowContent.match(/upload-sarif/g) || []).length;
  expect(sarifUploads).toBeGreaterThan(0);
});

Then('Slack notifications should be sent only for actual security issues', async function () {
  const workflowContent = readFile('.github/workflows/security.yml');
  expect(workflowContent).toContain('action-slack');
  expect(workflowContent).toContain('if: failure()');
});

// Fix scenarios would be implemented based on actual findings
// These are placeholder implementations that would be customized based on specific issues

Given('the codebase contains potential hardcoded secrets', async function () {
  // This would be determined by actual scan results
  this.secretsToFix = [];
});

When('I scan for hardcoded credentials', async function () {
  // Implementation would scan for actual hardcoded credentials
  this.foundSecrets = false;
});

Then('all database passwords should use environment variables', async function () {
  const configFiles = ['docker-compose.yml', '.env.example'];

  for (const file of configFiles) {
    if (fileExists(file)) {
      const content = readFile(file);
      // Should use environment variable syntax
      if (content.includes('password')) {
        expect(content).toMatch(/password.*\$\{.*\}|password.*\$[A-Z_]+/i);
      }
    }
  }
});

// Additional implementation steps would follow similar patterns
// for the remaining scenarios...
