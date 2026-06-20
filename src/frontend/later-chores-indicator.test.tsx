import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { LaterChoresIndicator } from './later-chores-indicator';

describe('LaterChoresIndicator', () => {
  it('renders the indicator for a single hidden chore', async () => {
    render(() => <LaterChoresIndicator count={1} />);

    await expect.element(page.getByTestId('later-chores-indicator')).toBeVisible();
    await expect.element(page.getByText('1 more chore starts later')).toBeVisible();
  });

  it('renders the indicator for multiple hidden chores', async () => {
    render(() => <LaterChoresIndicator count={3} />);

    await expect.element(page.getByTestId('later-chores-indicator')).toBeVisible();
    await expect.element(page.getByText('3 more chores start later')).toBeVisible();
  });
});
