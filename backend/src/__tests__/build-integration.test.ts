/**
 * Integration Test: TypeScript Build Process
 * 
 * Feature: Backend build process should work without TypeScript errors
 * Scenario: Building the backend project
 * 
 * Given: The backend has a properly configured tsconfig.json
 * When: The build process runs
 * Then: TypeScript compilation should succeed
 * And: All source files should be compiled to the dist directory
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Build Integration Test', () => {
  const backendDir = path.resolve(__dirname, '..', '..');
  const distDir = path.join(backendDir, 'dist');

  it('should build successfully without TypeScript errors', () => {
    // Given: The backend project exists
    expect(fs.existsSync(backendDir)).toBe(true);
    
    // When: We run the build command
    const buildCommand = 'npm run build';
    
    // Then: It should not throw any errors
    expect(() => {
      execSync(buildCommand, { 
        cwd: backendDir, 
        stdio: 'pipe',
        encoding: 'utf8'
      });
    }).not.toThrow();
  });

  it('should generate compiled files in dist directory', () => {
    // Given: The build has completed
    expect(fs.existsSync(distDir)).toBe(true);
    
    // When: We check the dist directory
    const expectedFiles = [
      'index.js',
      'index.d.ts',
      'healthcheck.js',
      'healthcheck.d.ts'
    ];
    
    // Then: All expected files should exist
    expectedFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have correct source maps', () => {
    // Given: The build generates source maps
    const sourceMapFiles = [
      'index.js.map',
      'healthcheck.js.map'
    ];
    
    // When: We check for source map files
    sourceMapFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      
      // Then: Source maps should exist
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});