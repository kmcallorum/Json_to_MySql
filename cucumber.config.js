/**
 * Cucumber Configuration
 * BDD Testing Setup
 */

const common = {
  require: [
    'features/step_definitions/**/*.js',
    'features/support/**/*.js'
  ],
  requireModule: ['@babel/register'],
  format: [
    'progress-bar',
    'html:cucumber-report/index.html',
    'json:cucumber-report/cucumber-report.json',
    'junit:cucumber-report/cucumber-junit.xml',
    '@cucumber/pretty-formatter'
  ],
  formatOptions: {
    snippetInterface: 'async-await',
    colorsEnabled: true
  },
  publishQuiet: true
};

module.exports = {
  default: {
    ...common,
    parallel: 2
  },
  ci: {
    ...common,
    parallel: 4,
    retry: 2
  },
  debug: {
    ...common,
    parallel: 1,
    failFast: true
  }
};
