import { beforeEach } from 'vitest';

beforeEach(() => {
  // Clean up DOM between tests in browser mode
  // Browser mode with Playwright doesn't automatically clean up DOM between tests
  document.body.innerHTML = '';
});
