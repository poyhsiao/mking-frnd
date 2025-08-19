module.exports = {
  default: {
    require: [
      'features/step_definitions/**/*.cjs'
    ],
    format: [
      'progress-bar',
      'json:test-results/cucumber-report.json',
      'html:test-results/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    dryRun: false,
    failFast: false,
    strict: true,
    worldParameters: {
      projectRoot: process.cwd()
    }
  }
};