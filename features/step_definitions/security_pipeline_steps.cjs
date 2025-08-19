const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Load security workflow configuration
Given('the security workflow file exists', function () {
  const workflowPath = '.github/workflows/security.yml';
  assert(fs.existsSync(workflowPath), 'Security workflow file should exist');
  
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  this.securityWorkflow = yaml.load(workflowContent);
  assert(this.securityWorkflow, 'Security workflow should be valid YAML');
});

Given('the workflow has proper permissions configured', function () {
  assert(this.securityWorkflow.permissions, 'Workflow should have permissions configured');
  assert(
    this.securityWorkflow.permissions.contents === 'read',
    'Top-level permissions should be read-only for contents'
  );
});

// Secret detection validation
When('I check the secret-scan job configuration', function () {
  this.secretScanJob = this.securityWorkflow.jobs['secret-scan'];
  assert(this.secretScanJob, 'secret-scan job should exist');
});

Then('it should include Gitleaks scanner', function () {
  const gitleaksStep = this.secretScanJob.steps.find(step => 
    step.uses && step.uses.includes('gitleaks/gitleaks-action')
  );
  assert(gitleaksStep, 'Should include Gitleaks scanner step');
});

Then('it should include TruffleHog scanner', function () {
  const trufflehogStep = this.secretScanJob.steps.find(step => 
    step.uses && step.uses.includes('trufflesecurity/trufflehog')
  );
  assert(trufflehogStep, 'Should include TruffleHog scanner step');
  
  // Check for SARIF output configuration
  const hasSarifOutput = trufflehogStep.with && 
    trufflehogStep.with.extra_args && 
    trufflehogStep.with.extra_args.includes('--format=sarif');
  assert(hasSarifOutput, 'TruffleHog should output SARIF format');
});

Then('it should upload SARIF results to GitHub Security tab', function () {
  // Check the current job context for SARIF uploads
  const currentJob = this.secretScanJob || this.dependencyScanJob || 
                     this.sastScanJob || this.containerScanJob || 
                     this.infrastructureScanJob;
  
  if (currentJob) {
    const sarifUploadSteps = currentJob.steps.filter(step => 
      step.uses && step.uses.includes('github/codeql-action/upload-sarif')
    );
    assert(sarifUploadSteps.length > 0, 'Should upload SARIF results');
  }
});

Then('it should have proper security-events write permissions', function () {
  assert(
    this.secretScanJob.permissions && 
    this.secretScanJob.permissions['security-events'] === 'write',
    'Should have security-events write permission'
  );
});

// Dependency scan validation
When('I check the dependency-scan job configuration', function () {
  this.dependencyScanJob = this.securityWorkflow.jobs['dependency-scan'];
  assert(this.dependencyScanJob, 'dependency-scan job should exist');
});

Then('it should scan both backend and frontend directories', function () {
  const strategy = this.dependencyScanJob.strategy;
  assert(strategy && strategy.matrix, 'Should have matrix strategy');
  assert(
    strategy.matrix.directory.includes('backend') && 
    strategy.matrix.directory.includes('frontend'),
    'Should scan both backend and frontend directories'
  );
});

Then('it should use pnpm audit with moderate severity threshold', function () {
  const auditStep = this.dependencyScanJob.steps.find(step => 
    step.name && step.name.includes('pnpm audit')
  );
  assert(auditStep, 'Should include pnpm audit step');
  assert(
    auditStep.run && auditStep.run.includes('--audit-level=moderate'),
    'Should use moderate severity threshold'
  );
});

Then('it should use Snyk security scanner', function () {
  const snykStep = this.dependencyScanJob.steps.find(step => 
    step.uses && step.uses.includes('snyk/actions/node')
  );
  assert(snykStep, 'Should include Snyk scanner step');
  
  // Check for SARIF output
  const hasSarifOutput = snykStep.with && 
    snykStep.with.args && 
    snykStep.with.args.includes('--sarif-file-output');
  assert(hasSarifOutput, 'Snyk should output SARIF format');
});

Then('it should upload audit results as artifacts', function () {
  const artifactUploadStep = this.dependencyScanJob.steps.find(step => 
    step.uses && step.uses.includes('actions/upload-artifact')
  );
  assert(artifactUploadStep, 'Should upload audit results as artifacts');
});

// SAST scan validation
When('I check the sast-scan job configuration', function () {
  this.sastScanJob = this.securityWorkflow.jobs['sast-scan'];
  assert(this.sastScanJob, 'sast-scan job should exist');
});

Then('it should include CodeQL analysis', function () {
  const codeqlSteps = this.sastScanJob.steps.filter(step => 
    step.uses && step.uses.includes('github/codeql-action')
  );
  assert(codeqlSteps.length >= 3, 'Should include CodeQL init, autobuild, and analyze steps');
});

Then('it should include Semgrep security rules', function () {
  const semgrepStep = this.sastScanJob.steps.find(step => 
    step.uses && step.uses.includes('returntocorp/semgrep-action')
  );
  assert(semgrepStep, 'Should include Semgrep scanner step');
  
  const hasSecurityConfig = semgrepStep.with && 
    semgrepStep.with.config && 
    semgrepStep.with.config.includes('p/security-audit');
  assert(hasSecurityConfig, 'Should include security audit rules');
});

Then('it should scan JavaScript and TypeScript languages', function () {
  const initStep = this.sastScanJob.steps.find(step => 
    step.uses && step.uses.includes('github/codeql-action/init')
  );
  assert(initStep, 'Should have CodeQL init step');
  
  const languages = initStep.with && initStep.with.languages;
  assert(
    languages && languages.includes('javascript') && languages.includes('typescript'),
    'Should scan JavaScript and TypeScript languages'
  );
});

Then('it should use security-extended queries', function () {
  const initStep = this.sastScanJob.steps.find(step => 
    step.uses && step.uses.includes('github/codeql-action/init')
  );
  
  const queries = initStep.with && initStep.with.queries;
  assert(
    queries && queries.includes('security-extended'),
    'Should use security-extended queries'
  );
});

// Container scan validation
When('I check the container-scan job configuration', function () {
  this.containerScanJob = this.securityWorkflow.jobs['container-scan'];
  assert(this.containerScanJob, 'container-scan job should exist');
});

Then('it should build Docker images for backend and frontend', function () {
  const buildStep = this.containerScanJob.steps.find(step => 
    step.name && step.name.includes('Build Docker images')
  );
  assert(buildStep, 'Should include Docker build step');
  
  const buildCommands = buildStep.run;
  assert(
    buildCommands.includes('mking-backend') && buildCommands.includes('mking-frontend'),
    'Should build both backend and frontend images'
  );
});

Then('it should use Trivy vulnerability scanner', function () {
  const trivySteps = this.containerScanJob.steps.filter(step => 
    step.uses && step.uses.includes('aquasecurity/trivy-action')
  );
  assert(trivySteps.length >= 2, 'Should include Trivy scanner for both images');
});

Then('it should scan for CRITICAL, HIGH, and MEDIUM severity issues', function () {
  const trivyStep = this.containerScanJob.steps.find(step => 
    step.uses && step.uses.includes('aquasecurity/trivy-action')
  );
  
  const severity = trivyStep.with && trivyStep.with.severity;
  assert(
    severity && severity.includes('CRITICAL') && 
    severity.includes('HIGH') && severity.includes('MEDIUM'),
    'Should scan for CRITICAL, HIGH, and MEDIUM severity issues'
  );
});

Then('it should only run on push or schedule events', function () {
  const condition = this.containerScanJob.if;
  assert(
    condition && 
    condition.includes('push') && 
    condition.includes('schedule'),
    'Should only run on push or schedule events'
  );
});

// Infrastructure scan validation
When('I check the infrastructure-scan job configuration', function () {
  this.infrastructureScanJob = this.securityWorkflow.jobs['infrastructure-scan'];
  assert(this.infrastructureScanJob, 'infrastructure-scan job should exist');
});

Then('it should include Checkov scanner', function () {
  const checkovStep = this.infrastructureScanJob.steps.find(step => 
    step.uses && step.uses.includes('bridgecrewio/checkov-action')
  );
  assert(checkovStep, 'Should include Checkov scanner step');
});

Then('it should include kube-linter scanner', function () {
  const kubeLinterStep = this.infrastructureScanJob.steps.find(step => 
    step.name && step.name.includes('kube-linter')
  );
  assert(kubeLinterStep, 'Should include kube-linter scanner step');
  
  // Check for SARIF output
  const hasSarifOutput = kubeLinterStep.run && 
    kubeLinterStep.run.includes('--format=sarif');
  assert(hasSarifOutput, 'kube-linter should output SARIF format');
});

Then('it should include Hadolint for Dockerfile security', function () {
  const hadolintSteps = this.infrastructureScanJob.steps.filter(step => 
    step.uses && step.uses.includes('hadolint/hadolint-action')
  );
  assert(hadolintSteps.length >= 2, 'Should include Hadolint for both Dockerfiles');
});

Then('it should scan Dockerfile, Kubernetes, and Docker Compose files', function () {
  const checkovStep = this.infrastructureScanJob.steps.find(step => 
    step.uses && step.uses.includes('bridgecrewio/checkov-action')
  );
  
  const framework = checkovStep.with && checkovStep.with.framework;
  assert(
    framework && 
    framework.includes('dockerfile') && 
    framework.includes('kubernetes') && 
    framework.includes('docker_compose'),
    'Should scan Dockerfile, Kubernetes, and Docker Compose files'
  );
});

// Security report validation
When('I check the security-report job configuration', function () {
  this.securityReportJob = this.securityWorkflow.jobs['security-report'];
  assert(this.securityReportJob, 'security-report job should exist');
});

Then('it should depend on all security scan jobs', function () {
  const needs = this.securityReportJob.needs;
  assert(needs && Array.isArray(needs), 'Should have needs dependency');
  
  const expectedJobs = ['secret-scan', 'dependency-scan', 'sast-scan', 'container-scan', 'infrastructure-scan'];
  expectedJobs.forEach(job => {
    assert(needs.includes(job), `Should depend on ${job} job`);
  });
});

Then('it should generate a security scan summary', function () {
  const summaryStep = this.securityReportJob.steps.find(step => 
    step.name && step.name.includes('Security Scan Summary')
  );
  assert(summaryStep, 'Should include security scan summary step');
  
  const summaryContent = summaryStep.run;
  assert(
    summaryContent && summaryContent.includes('GITHUB_STEP_SUMMARY'),
    'Should generate GitHub step summary'
  );
});

Then('it should notify on security issues via Slack', function () {
  const slackStep = this.securityReportJob.steps.find(step => 
    step.uses && step.uses.includes('action-slack')
  );
  assert(slackStep, 'Should include Slack notification step');
});

Then('it should run even if other jobs fail', function () {
  assert(
    this.securityReportJob.if === 'always()',
    'Should run even if other jobs fail'
  );
});

// Workflow triggers validation
When('I check the workflow triggers', function () {
  this.workflowTriggers = this.securityWorkflow.on;
  assert(this.workflowTriggers, 'Workflow should have triggers configured');
});

Then('it should trigger on push to main and develop branches', function () {
  const pushTrigger = this.workflowTriggers.push;
  assert(pushTrigger && pushTrigger.branches, 'Should have push trigger with branches');
  assert(
    pushTrigger.branches.includes('main') && pushTrigger.branches.includes('develop'),
    'Should trigger on push to main and develop branches'
  );
});

Then('it should trigger on pull requests to main and develop branches', function () {
  const prTrigger = this.workflowTriggers.pull_request;
  assert(prTrigger && prTrigger.branches, 'Should have pull request trigger with branches');
  assert(
    prTrigger.branches.includes('main') && prTrigger.branches.includes('develop'),
    'Should trigger on pull requests to main and develop branches'
  );
});

Then('it should trigger on daily schedule at 2 AM UTC', function () {
  const scheduleTrigger = this.workflowTriggers.schedule;
  assert(scheduleTrigger && Array.isArray(scheduleTrigger), 'Should have schedule trigger');
  
  const cronExpression = scheduleTrigger[0] && scheduleTrigger[0].cron;
  assert(
    cronExpression === '0 2 * * *',
    'Should trigger daily at 2 AM UTC'
  );
});

// SARIF upload validation
When('I check all security scan jobs', function () {
  this.allSecurityJobs = [
    this.securityWorkflow.jobs['secret-scan'],
    this.securityWorkflow.jobs['dependency-scan'],
    this.securityWorkflow.jobs['sast-scan'],
    this.securityWorkflow.jobs['container-scan'],
    this.securityWorkflow.jobs['infrastructure-scan']
  ];
});

Then('each job should upload SARIF results', function () {
  const jobNames = ['secret-scan', 'dependency-scan', 'sast-scan', 'container-scan', 'infrastructure-scan'];
  
  this.allSecurityJobs.forEach((job, index) => {
    if (!job) return; // Skip if job doesn't exist
    
    const sarifUploadSteps = job.steps.filter(step => 
      step.uses && step.uses.includes('github/codeql-action/upload-sarif')
    );
    
    // All security jobs should have SARIF uploads
    assert(sarifUploadSteps.length > 0, `${jobNames[index]} job should upload SARIF results`);
  });
});

Then('SARIF uploads should use the latest CodeQL action', function () {
  this.allSecurityJobs.forEach(job => {
    if (!job) return;
    
    const sarifUploadSteps = job.steps.filter(step => 
      step.uses && step.uses.includes('github/codeql-action/upload-sarif')
    );
    
    sarifUploadSteps.forEach(step => {
      assert(
        step.uses.includes('@v3'),
        'SARIF uploads should use CodeQL action v3 or later'
      );
    });
  });
});

Then('SARIF uploads should run even if scans fail', function () {
  this.allSecurityJobs.forEach(job => {
    if (!job) return;
    
    const sarifUploadSteps = job.steps.filter(step => 
      step.uses && step.uses.includes('github/codeql-action/upload-sarif')
    );
    
    sarifUploadSteps.forEach(step => {
      assert(
        step.if === 'always()',
        'SARIF uploads should run even if scans fail'
      );
    });
  });
});

// Security permissions validation
When('I check workflow permissions', function () {
  // Already loaded in Given step
  assert(this.securityWorkflow.permissions, 'Workflow should have permissions');
});

Then('the top-level permissions should be read-only for contents', function () {
  assert(
    this.securityWorkflow.permissions.contents === 'read',
    'Top-level permissions should be read-only for contents'
  );
});

Then('each job should have minimal required permissions', function () {
  Object.values(this.securityWorkflow.jobs).forEach(job => {
    if (job.permissions) {
      // Check that permissions are minimal and appropriate
      const allowedPermissions = ['contents', 'security-events', 'actions'];
      Object.keys(job.permissions).forEach(permission => {
        assert(
          allowedPermissions.includes(permission),
          `Job should only have allowed permissions: ${permission}`
        );
      });
    }
  });
});

Then('security-events write permission should be granted where needed', function () {
  const jobsNeedingSecurityEvents = [
    'secret-scan', 'dependency-scan', 'sast-scan', 
    'container-scan', 'infrastructure-scan'
  ];
  
  jobsNeedingSecurityEvents.forEach(jobName => {
    const job = this.securityWorkflow.jobs[jobName];
    if (job && job.permissions) {
      assert(
        job.permissions['security-events'] === 'write',
        `${jobName} should have security-events write permission`
      );
    }
  });
});

Then('actions read permission should be granted for security-report job', function () {
  const securityReportJob = this.securityWorkflow.jobs['security-report'];
  assert(
    securityReportJob.permissions && 
    securityReportJob.permissions.actions === 'read',
    'security-report job should have actions read permission'
  );
});