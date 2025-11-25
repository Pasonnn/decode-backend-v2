/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
const path = require('node:path');

const STATUS_SYMBOL = {
  passed: '✅',
  failed: '❌',
  skipped: '⚪',
  pending: '⏳',
  todo: '📝',
};

class ConsoleDashboardReporter {
  constructor() {
    this.suiteStats = new Map();
  }

  onTestCaseResult(test, testCaseResult) {
    const relativePath = path.relative(process.cwd(), test.path);
    const symbol = STATUS_SYMBOL[testCaseResult.status] || '•';
    const duration = testCaseResult.duration ?? 0;

    const logLine = `${symbol} ${relativePath} › ${testCaseResult.fullName} (${duration} ms)`;
    if (
      testCaseResult.status === 'failed' &&
      testCaseResult.failureDetails.length
    ) {
      const failure = testCaseResult.failureDetails[0];
      console.log(logLine);
      console.log(`   ↳ ${failure.matcherResult?.message || failure.message}`);
    } else {
      console.log(logLine);
    }

    const stat = this.suiteStats.get(relativePath) || {
      suite: relativePath,
      passed: 0,
      failed: 0,
      skipped: 0,
      todo: 0,
      duration: 0,
    };

    stat.duration += duration;
    if (testCaseResult.status === 'passed') stat.passed += 1;
    if (testCaseResult.status === 'failed') stat.failed += 1;
    if (
      testCaseResult.status === 'skipped' ||
      testCaseResult.status === 'pending'
    ) {
      stat.skipped += 1;
    }
    if (testCaseResult.status === 'todo') stat.todo += 1;

    this.suiteStats.set(relativePath, stat);
  }

  onRunComplete(_, results) {
    if (!this.suiteStats.size) {
      return;
    }

    console.log('\nTest Dashboard');
    console.table(
      Array.from(this.suiteStats.values()).map((stat) => ({
        Suite: stat.suite,
        Passed: stat.passed,
        Failed: stat.failed,
        Skipped: stat.skipped,
        Todo: stat.todo,
        'Duration (ms)': stat.duration,
      })),
    );

    let totalDuration = 0;
    if (
      Number.isFinite(results.stopTime) &&
      Number.isFinite(results.startTime)
    ) {
      totalDuration = (results.stopTime - results.startTime) / 1000;
    } else if (Array.isArray(results.testResults)) {
      totalDuration =
        results.testResults.reduce(
          (acc, current) => acc + (current.perfStats?.runtime ?? 0),
          0,
        ) / 1000;
    }
    console.log(
      `Totals: ${results.numPassedTests} passed / ${results.numFailedTests} failed / ${results.numPendingTests} skipped in ${totalDuration.toFixed(
        2,
      )}s`,
    );
  }
}

module.exports = ConsoleDashboardReporter;
