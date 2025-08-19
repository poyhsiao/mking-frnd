Feature: PNPM Version Consistency Across Project and GitHub Actions
  As a DevOps engineer
  I want to ensure consistent PNPM versions across package.json and GitHub Actions workflows
  So that I can prevent "Multiple versions of pnpm specified" errors and ensure reliable CI/CD pipelines

  Background:
    Given the project uses pnpm as the package manager
    And GitHub Actions workflows are configured for CI/CD
    And the project has multiple workflow files

  @critical @version-consistency
  Scenario: Fix multiple PNPM versions specified error
    Given the package.json specifies "packageManager": "pnpm@8.15.0"
    And the GitHub Actions workflow specifies PNPM version "9.15.0"
    And the workflow uses "pnpm/action-setup@v4"
    When the GitHub Actions workflow runs
    Then it should fail with "Multiple versions of pnpm specified" error
    And the error should mention version conflict between package.json and GitHub Action config
    When I update the package.json packageManager to "pnpm@9.15.0"
    And I ensure all workflows use consistent PNPM version "9.15.0"
    Then the GitHub Actions workflow should run successfully
    And there should be no version mismatch errors

  @configuration @validation
  Scenario: Validate PNPM version consistency across all workflow files
    Given multiple GitHub Actions workflow files exist
    When I check the PNPM version configuration in each workflow
    Then all workflows should use the same PNPM version
    And all workflows should use compatible pnpm/action-setup versions
    And the package.json packageManager should match the workflow versions

  @upgrade @compatibility
  Scenario: Upgrade from pnpm/action-setup@v2 to v4 with version consistency
    Given a workflow file uses "pnpm/action-setup@v2"
    And the workflow specifies an older PNPM version
    When I upgrade to "pnpm/action-setup@v4"
    And I update the PNPM version to "9.15.0"
    And I update the package.json to match
    Then the workflow should use the latest action setup version
    And the PNPM version should be consistent across all configurations
    And the workflow should run without version conflicts

  @engines @requirements
  Scenario: Update package.json engines field for PNPM version requirements
    Given the package.json engines field specifies "pnpm": ">=8.0.0"
    And the project now uses PNPM version "9.15.0"
    When I update the engines field to "pnpm": ">=9.0.0"
    Then the package.json should reflect the correct minimum PNPM version
    And the engines field should be consistent with the packageManager field

  @prevention @monitoring
  Scenario: Implement checks to prevent future version mismatches
    Given PNPM version consistency has been established
    When I create validation scripts for version consistency
    Then the scripts should check package.json packageManager version
    And the scripts should check all workflow PNPM versions
    And the scripts should report any version mismatches
    And the scripts should be integrated into the CI/CD pipeline

  @rollback @safety
  Scenario: Rollback capability for PNPM version changes
    Given PNPM versions have been updated across the project
    And the original versions are documented
    When unexpected issues occur with the new versions
    Then I should be able to rollback package.json changes
    And I should be able to rollback workflow file changes
    And the rollback should restore working functionality
    And the rollback process should be documented

  @documentation @knowledge-sharing
  Scenario: Document PNPM version management best practices
    Given PNPM version consistency has been achieved
    When I create documentation for version management
    Then the documentation should explain the version mismatch error
    And the documentation should provide step-by-step fix instructions
    And the documentation should include prevention strategies
    And the documentation should be accessible to all team members

  @testing @validation
  Scenario: Comprehensive testing of PNPM version consistency
    Given all PNPM versions have been updated and synchronized
    When I run the complete test suite
    Then all unit tests should pass
    And all integration tests should pass
    And all GitHub Actions workflows should complete successfully
    And no version-related errors should occur
    And the CI/CD pipeline should be stable and reliable