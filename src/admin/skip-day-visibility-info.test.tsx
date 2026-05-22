import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { SkipDayVisibility } from '../types/chore-types';
import { SkipDayVisibilityInfo } from './skip-day-visibility-info';

describe('SkipDayVisibilityInfo', () => {
  it('renders hide description', async () => {
    render(() => <SkipDayVisibilityInfo value={SkipDayVisibility.HIDE} />);
    await expect.element(page.getByText(/disappears completely/)).toBeVisible();
  });

  it('renders show always description', async () => {
    render(() => <SkipDayVisibilityInfo value={SkipDayVisibility.SHOW_ALWAYS} />);
    await expect.element(page.getByText(/grace day/)).toBeVisible();
  });

  it('renders show if overdue description', async () => {
    render(() => <SkipDayVisibilityInfo value={SkipDayVisibility.SHOW_IF_OVERDUE} />);
    await expect.element(page.getByText(/catch up/)).toBeVisible();
  });
});
