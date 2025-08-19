"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const chai_1 = require("chai");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
class DocumentationSecurityScanner {
    constructor() {
        this.scanResults = [];
        this.documentationFiles = [];
    }
    async scanDocumentationFiles() {
        const docsPattern = path.join(process.cwd(), 'docs/**/*.md');
        this.documentationFiles = glob.sync(docsPattern);
        this.scanResults = [];
        for (const file of this.documentationFiles) {
            await this.scanFile(file);
        }
    }
    async scanFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            this.checkForHardcodedPasswords(filePath, index + 1, line);
            this.checkForBase64Secrets(filePath, index + 1, line);
            this.checkForJWTSecrets(filePath, index + 1, line);
            this.checkForAWSCredentials(filePath, index + 1, line);
            this.checkForDatabaseCredentials(filePath, index + 1, line);
            this.checkForAPIKeys(filePath, index + 1, line);
        });
    }
    checkForHardcodedPasswords(file, line, content) {
        // Check for common hardcoded password patterns
        const passwordPatterns = [
            /password\s*[=:]\s*["']?(?!\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;':",./<>?]+["']?/i,
            /passwd\s*[=:]\s*["']?(?!\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;':",./<>?]+["']?/i,
            /pwd\s*[=:]\s*["']?(?!\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;':",./<>?]+["']?/i,
        ];
        passwordPatterns.forEach(pattern => {
            if (pattern.test(content) && !content.includes('${') && !content.includes('SECURITY:')) {
                this.scanResults.push({
                    file,
                    line,
                    content: content.trim(),
                    type: 'hardcoded_password',
                });
            }
        });
    }
    checkForBase64Secrets(file, line, content) {
        // Check for Base64-encoded secrets (common patterns)
        const base64Patterns = [
            /cGFzc3dvcmQ=/, // 'password' in base64
            /eW91ci1zdXBlci1zZWNyZXQtand0LWtleQ==/, // 'your-super-secret-jwt-key' in base64
            /eW91ci1hY2Nlc3Mta2V5/, // 'your-access-key' in base64
            /eW91ci1zZWNyZXQta2V5/, // 'your-secret-key' in base64
            /[A-Za-z0-9+/]{20,}={0,2}/, // General base64 pattern (20+ chars)
        ];
        base64Patterns.forEach(pattern => {
            if (pattern.test(content) &&
                !content.includes('# base64') &&
                !content.includes('SECURITY:')) {
                this.scanResults.push({
                    file,
                    line,
                    content: content.trim(),
                    type: 'base64_secret',
                });
            }
        });
    }
    checkForJWTSecrets(file, line, content) {
        const jwtPattern = /JWT_SECRET\s*[=:]\s*["']?(?!\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;':",./<>?]+["']?/i;
        if (jwtPattern.test(content) && !content.includes('${JWT_SECRET}')) {
            this.scanResults.push({
                file,
                line,
                content: content.trim(),
                type: 'jwt_secret',
            });
        }
    }
    checkForAWSCredentials(file, line, content) {
        const awsPatterns = [
            /AWS_ACCESS_KEY_ID\s*[=:]\s*["']?(?!\$\{)[A-Z0-9]{20}["']?/i,
            /AWS_SECRET_ACCESS_KEY\s*[=:]\s*["']?(?!\$\{)[A-Za-z0-9/+=]{40}["']?/i,
            /AWS_ACCESS_KEY_ID\s*[=:]\s*["']?(?!\$\{)your-access-key["']?/i,
            /AWS_SECRET_ACCESS_KEY\s*[=:]\s*["']?(?!\$\{)your-secret-key["']?/i,
        ];
        awsPatterns.forEach(pattern => {
            if (pattern.test(content) && !content.includes('${AWS_')) {
                this.scanResults.push({
                    file,
                    line,
                    content: content.trim(),
                    type: 'aws_credential',
                });
            }
        });
    }
    checkForDatabaseCredentials(file, line, content) {
        const dbPatterns = [
            /POSTGRES_PASSWORD\s*[=:]\s*["']?(?!\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;':",./<>?]+["']?/i,
            /DATABASE_URL\s*[=:]\s*["']?postgresql:\/\/[^$][^{][^}]*["']?/i,
        ];
        dbPatterns.forEach(pattern => {
            if (pattern.test(content) && !content.includes('${')) {
                this.scanResults.push({
                    file,
                    line,
                    content: content.trim(),
                    type: 'db_credential',
                });
            }
        });
    }
    checkForAPIKeys(file, line, content) {
        const apiKeyPatterns = [
            /TYPESENSE_API_KEY\s*[=:]\s*["']?(?!\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;':",./<>?]+["']?/i,
            /API_KEY\s*[=:]\s*["']?(?!\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;':",./<>?]+["']?/i,
        ];
        apiKeyPatterns.forEach(pattern => {
            if (pattern.test(content) && !content.includes('${') && !content.includes('xyz')) {
                this.scanResults.push({
                    file,
                    line,
                    content: content.trim(),
                    type: 'api_key',
                });
            }
        });
    }
    getResults() {
        return this.scanResults;
    }
    getResultsByType(type) {
        return this.scanResults.filter(result => result.type === type);
    }
    hasSecurityComments() {
        return this.documentationFiles.some(file => {
            const content = fs.readFileSync(file, 'utf8');
            return content.includes('SECURITY:') || content.includes('# SECURITY');
        });
    }
}
// Global scanner instance
let scanner;
(0, cucumber_1.Given)('the project documentation exists', async function () {
    const docsDir = path.join(process.cwd(), 'docs');
    (0, chai_1.expect)(fs.existsSync(docsDir)).to.be.true;
});
(0, cucumber_1.Given)('security scanning tools are available', function () {
    scanner = new DocumentationSecurityScanner();
    (0, chai_1.expect)(scanner).to.not.be.undefined;
});
(0, cucumber_1.Given)('I scan the documentation files for hardcoded secrets', async function () {
    await scanner.scanDocumentationFiles();
});
(0, cucumber_1.Given)('I scan the documentation files for Base64 patterns', async function () {
    await scanner.scanDocumentationFiles();
});
(0, cucumber_1.Given)('I examine JWT configuration examples', async function () {
    await scanner.scanDocumentationFiles();
});
(0, cucumber_1.Given)('I examine AWS configuration examples', async function () {
    await scanner.scanDocumentationFiles();
});
(0, cucumber_1.Given)('I examine database configuration examples', async function () {
    await scanner.scanDocumentationFiles();
});
(0, cucumber_1.Given)('I examine API configuration examples', async function () {
    await scanner.scanDocumentationFiles();
});
(0, cucumber_1.Given)('I examine configuration examples with secrets', async function () {
    await scanner.scanDocumentationFiles();
});
(0, cucumber_1.When)('I check for common password patterns', function () {
    // Scanning already done in Given step
});
(0, cucumber_1.When)('I check for encoded secrets like {string}', function (_pattern) {
    // Scanning already done in Given step
});
(0, cucumber_1.When)('I check for JWT_SECRET values', function () {
    // Scanning already done in Given step
});
(0, cucumber_1.When)('I check for AWS credential values', function () {
    // Scanning already done in Given step
});
(0, cucumber_1.When)('I check for database credential values', function () {
    // Scanning already done in Given step
});
(0, cucumber_1.When)('I check for API key values', function () {
    // Scanning already done in Given step
});
(0, cucumber_1.When)('I check for security guidance comments', function () {
    // Scanning already done in Given step
});
(0, cucumber_1.Then)('no hardcoded passwords should be found', function () {
    const passwordResults = scanner.getResultsByType('hardcoded_password');
    if (passwordResults.length > 0) {
        const details = passwordResults.map(r => `${r.file}:${r.line} - ${r.content}`).join('\n');
        throw new Error(`Found ${passwordResults.length} hardcoded passwords:\n${details}`);
    }
    (0, chai_1.expect)(passwordResults).to.have.length(0);
});
(0, cucumber_1.Then)('all password references should use environment variables', function () {
    const results = scanner.getResults();
    const passwordLines = results.filter(r => r.content.toLowerCase().includes('password'));
    passwordLines.forEach(result => {
        (0, chai_1.expect)(result.content).to.match(/\$\{.*\}|SECURITY:/);
    });
});
(0, cucumber_1.Then)('no Base64-encoded secrets should be found', function () {
    const base64Results = scanner.getResultsByType('base64_secret');
    if (base64Results.length > 0) {
        const details = base64Results.map(r => `${r.file}:${r.line} - ${r.content}`).join('\n');
        throw new Error(`Found ${base64Results.length} Base64-encoded secrets:\n${details}`);
    }
    (0, chai_1.expect)(base64Results).to.have.length(0);
});
(0, cucumber_1.Then)('all examples should use placeholder values', function () {
    // This is validated by the absence of Base64 secrets
    const base64Results = scanner.getResultsByType('base64_secret');
    (0, chai_1.expect)(base64Results).to.have.length(0);
});
(0, cucumber_1.Then)('JWT_SECRET should reference ${JWT_SECRET}', function () {
    const jwtResults = scanner.getResultsByType('jwt_secret');
    (0, chai_1.expect)(jwtResults).to.have.length(0);
});
(0, cucumber_1.Then)('no hardcoded JWT secrets should be present', function () {
    const jwtResults = scanner.getResultsByType('jwt_secret');
    (0, chai_1.expect)(jwtResults).to.have.length(0);
});
(0, cucumber_1.Then)('AWS_ACCESS_KEY_ID should reference ${AWS_ACCESS_KEY_ID}', function () {
    const awsResults = scanner.getResultsByType('aws_credential');
    const accessKeyResults = awsResults.filter(r => r.content.includes('AWS_ACCESS_KEY_ID'));
    (0, chai_1.expect)(accessKeyResults).to.have.length(0);
});
(0, cucumber_1.Then)('AWS_SECRET_ACCESS_KEY should reference ${AWS_SECRET_ACCESS_KEY}', function () {
    const awsResults = scanner.getResultsByType('aws_credential');
    const secretKeyResults = awsResults.filter(r => r.content.includes('AWS_SECRET_ACCESS_KEY'));
    (0, chai_1.expect)(secretKeyResults).to.have.length(0);
});
(0, cucumber_1.Then)('no hardcoded AWS credentials should be present', function () {
    const awsResults = scanner.getResultsByType('aws_credential');
    (0, chai_1.expect)(awsResults).to.have.length(0);
});
(0, cucumber_1.Then)('POSTGRES_PASSWORD should reference ${POSTGRES_PASSWORD}', function () {
    const dbResults = scanner.getResultsByType('db_credential');
    const postgresResults = dbResults.filter(r => r.content.includes('POSTGRES_PASSWORD'));
    (0, chai_1.expect)(postgresResults).to.have.length(0);
});
(0, cucumber_1.Then)('DATABASE_URL should use environment variable substitution', function () {
    const dbResults = scanner.getResultsByType('db_credential');
    const urlResults = dbResults.filter(r => r.content.includes('DATABASE_URL'));
    (0, chai_1.expect)(urlResults).to.have.length(0);
});
(0, cucumber_1.Then)('no hardcoded database passwords should be present', function () {
    const dbResults = scanner.getResultsByType('db_credential');
    (0, chai_1.expect)(dbResults).to.have.length(0);
});
(0, cucumber_1.Then)('TYPESENSE_API_KEY should reference ${TYPESENSE_API_KEY}', function () {
    const apiResults = scanner.getResultsByType('api_key');
    const typesenseResults = apiResults.filter(r => r.content.includes('TYPESENSE_API_KEY'));
    (0, chai_1.expect)(typesenseResults).to.have.length(0);
});
(0, cucumber_1.Then)('no hardcoded API keys should be present', function () {
    const apiResults = scanner.getResultsByType('api_key');
    (0, chai_1.expect)(apiResults).to.have.length(0);
});
(0, cucumber_1.Then)('security comments should guide proper key generation', function () {
    (0, chai_1.expect)(scanner.hasSecurityComments()).to.be.true;
});
(0, cucumber_1.Then)('each secret should have a security comment', function () {
    (0, chai_1.expect)(scanner.hasSecurityComments()).to.be.true;
});
(0, cucumber_1.Then)('comments should include generation instructions', function () {
    const docsDir = path.join(process.cwd(), 'docs');
    const deploymentGuide = path.join(docsDir, 'deployment/microservices-deployment-guide-zh.md');
    if (fs.existsSync(deploymentGuide)) {
        const content = fs.readFileSync(deploymentGuide, 'utf8');
        (0, chai_1.expect)(content).to.include('openssl rand');
    }
});
(0, cucumber_1.Then)('comments should mention security best practices', function () {
    const docsDir = path.join(process.cwd(), 'docs');
    const deploymentGuide = path.join(docsDir, 'deployment/microservices-deployment-guide-zh.md');
    if (fs.existsSync(deploymentGuide)) {
        const content = fs.readFileSync(deploymentGuide, 'utf8');
        (0, chai_1.expect)(content).to.include('SECURITY:');
    }
});
