/**
 * Test suite for Dockerfile pnpm version pinning
 * Following TDD methodology to ensure proper pnpm version management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DOCKERFILE_PATH = path.join(__dirname, '../../backend/Dockerfile')
const PACKAGE_JSON_PATH = path.join(__dirname, '../../package.json')
const TEST_IMAGE_NAME = 'mking-frnd-backend-test'

describe('Dockerfile pnpm version pinning', () => {
  let packageJson: any
  let dockerfileContent: string

  beforeAll(() => {
    // Read package.json to get expected pnpm version
    packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'))
    dockerfileContent = fs.readFileSync(DOCKERFILE_PATH, 'utf8')
  })

  afterAll(() => {
    // Clean up test Docker image
    try {
      execSync(`docker rmi ${TEST_IMAGE_NAME}`, { stdio: 'ignore' })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('Package.json configuration', () => {
    it('should have packageManager field defined', () => {
      expect(packageJson.packageManager).toBeDefined()
      expect(packageJson.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/)
    })

    it('should specify pnpm version in engines', () => {
      expect(packageJson.engines.pnpm).toBeDefined()
      expect(packageJson.engines.pnpm).toMatch(/>=\d+\.\d+\.\d+/)
    })
  })

  describe('Dockerfile pnpm version consistency', () => {
    it('should use corepack prepare to pin pnpm version', () => {
      expect(dockerfileContent).toContain('corepack prepare')
      expect(dockerfileContent).toContain('--activate')
    })

    it('should not use npm install -g pnpm in base stages', () => {
      const baseStageContent = dockerfileContent.split('FROM node:18-alpine AS production')[0]
      expect(baseStageContent).not.toContain('npm install -g pnpm')
    })

    it('should use consistent pnpm version across all stages', () => {
      const expectedVersion = packageJson.packageManager.split('@')[1]
      expect(dockerfileContent).toContain(`pnpm@${expectedVersion}`)
    })

    it('should set PNPM_HOME environment variable', () => {
      expect(dockerfileContent).toContain('ENV PNPM_HOME=')
      expect(dockerfileContent).toContain('ENV PATH=')
    })
  })

  describe('Docker build verification', () => {
    it('should build successfully with pinned pnpm version', async () => {
      const buildCommand = `docker build -f ${DOCKERFILE_PATH} -t ${TEST_IMAGE_NAME} --target=base .`
      
      expect(() => {
        execSync(buildCommand, { 
          cwd: path.join(__dirname, '../..'),
          stdio: 'pipe'
        })
      }).not.toThrow()
    }, 60000) // 60 second timeout for Docker build

    it('should have correct pnpm version in built image', async () => {
      const versionCommand = `docker run --rm ${TEST_IMAGE_NAME} pnpm --version`
      const expectedVersion = packageJson.packageManager.split('@')[1]
      
      const actualVersion = execSync(versionCommand, { encoding: 'utf8' }).trim()
      expect(actualVersion).toBe(expectedVersion)
    }, 30000)

    it('should have pnpm available in PATH', async () => {
      const whichCommand = `docker run --rm ${TEST_IMAGE_NAME} which pnpm`
      
      expect(() => {
        execSync(whichCommand, { stdio: 'pipe' })
      }).not.toThrow()
    }, 30000)
  })

  describe('Security and best practices', () => {
    it('should not run as root in production stage', () => {
      const productionStage = dockerfileContent.split('FROM node:18-alpine AS production')[1]
      expect(productionStage).toContain('USER backend')
    })

    it('should use alpine base image for smaller size', () => {
      expect(dockerfileContent).toContain('node:18-alpine')
    })

    it('should include health check', () => {
      expect(dockerfileContent).toContain('HEALTHCHECK')
    })
  })
})