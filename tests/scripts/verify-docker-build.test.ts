import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'verify-docker-build.sh');

describe('verify-docker-build.sh Script Tests', () => {

  describe('Script Content Analysis', () => {
    it('should exist and be executable', () => {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
      const stats = fs.statSync(SCRIPT_PATH);
      expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0); // Check if executable
    });

    it('should have proper shebang', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });

    it('should set error handling with set -e', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      expect(content).toContain('set -e');
    });

    it('should define expected pnpm version', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      expect(content).toContain('EXPECTED_PNPM_VERSION="8.15.0"');
    });
  });

  describe('Docker Image Creation and Cleanup', () => {
    it('should only create verify-backend and verify-frontend images', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Check that script creates verify-backend and verify-frontend
      expect(content).toContain('-t verify-backend');
      expect(content).toContain('-t verify-frontend');
      
      // Check that script does NOT create test-backend or test-frontend
      expect(content).not.toContain('-t test-backend');
      expect(content).not.toContain('-t test-frontend');
    });

    it('should only cleanup images created by this script', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // The script should only remove images it created
      const cleanupLine = content.match(/docker rmi.*/);
      expect(cleanupLine).toBeTruthy();
      
      // Should contain verify-backend and verify-frontend
      expect(cleanupLine![0]).toContain('verify-backend');
      expect(cleanupLine![0]).toContain('verify-frontend');
      
      // Should NOT contain test-backend and test-frontend (these are not created by this script)
      expect(cleanupLine![0]).not.toContain('test-backend');
      expect(cleanupLine![0]).not.toContain('test-frontend');
    });

    it('should have proper cleanup command that only removes script-created images', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // After fix, this should be the correct cleanup behavior
      const expectedCleanupPattern = /docker rmi verify-backend verify-frontend/;
      
      // The script should only remove images it created
      const hasCorrectCleanup = expectedCleanupPattern.test(content) && 
                                !content.includes('test-backend') && 
                                !content.includes('test-frontend');
      
      // This should now pass after the fix
      expect(hasCorrectCleanup).toBe(true);
    });
  });

  describe('Docker Build Process', () => {
    it('should build backend image with correct tag', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      expect(content).toContain('docker build -f backend/Dockerfile -t verify-backend');
    });

    it('should build frontend image with correct tag', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      expect(content).toContain('docker build -f frontend/Dockerfile -t verify-frontend');
    });

    it('should target base stage for both builds', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      expect(content).toContain('--target base');
      // Should appear twice (once for backend, once for frontend)
      const matches = content.match(/--target base/g);
      expect(matches).toHaveLength(2);
    });
  });

  describe('pnpm Version Verification', () => {
    it('should verify pnpm version in both backend and frontend images', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Should check pnpm version in both images
      expect(content).toContain('docker run --rm verify-backend pnpm --version');
      expect(content).toContain('docker run --rm verify-frontend pnpm --version');
    });

    it('should check pnpm availability in PATH for both images', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Should verify pnpm is in PATH
      expect(content).toContain('docker run --rm verify-backend which pnpm');
      expect(content).toContain('docker run --rm verify-frontend which pnpm');
    });

    it('should check corepack availability for both images', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Should verify corepack is available
      expect(content).toContain('docker run --rm verify-backend which corepack');
      expect(content).toContain('docker run --rm verify-frontend which corepack');
    });
  });

  describe('Error Handling and Output', () => {
    it('should have colored output functions', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      expect(content).toContain('print_status()');
      expect(content).toContain('print_warning()');
      expect(content).toContain('print_error()');
    });

    it('should check for required files', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      expect(content).toContain('pnpm-lock.yaml');
      expect(content).toContain('pnpm-workspace.yaml');
      expect(content).toContain('backend/package.json');
      expect(content).toContain('frontend/package.json');
    });

    it('should exit with error code on failures', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Should have multiple exit 1 statements for error conditions
      const exitMatches = content.match(/exit 1/g);
      expect(exitMatches).toBeTruthy();
      expect(exitMatches!.length).toBeGreaterThan(0);
    });
  });

  describe('Security and Best Practices', () => {
    it('should use --rm flag for temporary containers', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // All docker run commands should use --rm for cleanup
      const dockerRunMatches = content.match(/docker run[^\n]*/g);
      expect(dockerRunMatches).toBeTruthy();
      
      dockerRunMatches!.forEach(match => {
        expect(match).toContain('--rm');
      });
    });

    it('should handle errors gracefully in cleanup', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Cleanup should handle errors gracefully
      expect(content).toContain('2>/dev/null || true');
    });

    it('should change to correct directory', () => {
      const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
      
      // Should change to script directory parent (project root)
      expect(content).toContain('cd "$(dirname "$0")/.."');
    });
  });
});