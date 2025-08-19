/**
 * BDD Test: TypeScript Configuration RootDir Fix
 *
 * Feature: Backend TypeScript compilation should work correctly
 * Scenario: When building the backend, TypeScript should compile without rootDir errors
 *
 * Given: The backend has its own tsconfig.json that extends the root config
 * When: The TypeScript compiler runs on the backend
 * Then: It should not throw rootDir mismatch errors
 * And: All source files should be correctly included in compilation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('TypeScript Configuration - RootDir Fix', () => {
  const backendDir = path.resolve(__dirname, '..', '..');
  const tsconfigPath = path.join(backendDir, 'tsconfig.json');

  it('should have a valid tsconfig.json with correct rootDir', () => {
    // Given: The backend tsconfig.json exists
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    // When: We read the tsconfig.json
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8')) as {
      compilerOptions?: { rootDir?: string };
    };

    // Then: It should have the correct rootDir override
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions?.rootDir).toBe('./src');
  });

  it('should compile TypeScript without rootDir errors', () => {
    // Given: The backend has TypeScript source files
    const srcDir = path.join(backendDir, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);

    // When: We run TypeScript compilation
    const tscCommand = 'npx tsc --noEmit';

    // Then: It should not throw rootDir errors
    expect(() => {
      execSync(tscCommand, {
        cwd: backendDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    }).not.toThrow();
  });

  it('should include all source files in the correct rootDir scope', () => {
    // Given: The backend has source files in src directory
    const srcFiles = ['index.ts', 'healthcheck.ts'];

    // When: We check if files exist in the expected location
    srcFiles.forEach(file => {
      const filePath = path.join(backendDir, 'src', file);

      // Then: Each file should exist and be within the rootDir scope
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should be self-contained without extending parent tsconfig', () => {
    // Given: We read the backend tsconfig
    const backendTsconfig = JSON.parse(
      fs.readFileSync(tsconfigPath, 'utf8')
    ) as {
      extends?: string;
      compilerOptions?: {
        rootDir?: string;
        baseUrl?: string;
        paths?: Record<string, string[]>;
      };
    };

    // Then: Backend tsconfig should be self-contained
    expect(backendTsconfig.extends).toBeUndefined(); // Should not extend any parent config
    expect(backendTsconfig.compilerOptions?.rootDir).toBe('./src'); // Should have its own rootDir
    expect(backendTsconfig.compilerOptions?.baseUrl).toBe('.'); // Should have baseUrl for path resolution
    expect(backendTsconfig.compilerOptions?.paths).toBeDefined(); // Should have path mappings

    // Should have essential path mappings for backend
    expect(backendTsconfig.compilerOptions?.paths?.['@/*']).toEqual([
      './src/*',
    ]);
    expect(backendTsconfig.compilerOptions?.paths?.['@backend/*']).toEqual([
      './src/*',
    ]);
  });
});
