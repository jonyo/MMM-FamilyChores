import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { SystemActionsTab } from './system-actions-tab';

describe('SystemActionsTab', () => {
  it('renders system action buttons', async () => {
    render(() => <SystemActionsTab onAdvanceRotations={vi.fn()} onResetCaughtUp={vi.fn()} />);

    await expect.element(page.getByTestId('advance-rotations-btn')).toBeVisible();
    await expect.element(page.getByTestId('reset-caught-up-btn')).toBeVisible();
  });

  it('calls onAdvanceRotations when the button is clicked', async () => {
    const onAdvanceRotations = vi.fn();

    render(() => (
      <SystemActionsTab onAdvanceRotations={onAdvanceRotations} onResetCaughtUp={vi.fn()} />
    ));

    await page.getByTestId('advance-rotations-btn').click();
    expect(onAdvanceRotations).toHaveBeenCalled();
  });

  it('calls onResetCaughtUp when the button is clicked', async () => {
    const onResetCaughtUp = vi.fn();

    render(() => (
      <SystemActionsTab onAdvanceRotations={vi.fn()} onResetCaughtUp={onResetCaughtUp} />
    ));

    await page.getByTestId('reset-caught-up-btn').click();
    expect(onResetCaughtUp).toHaveBeenCalled();
  });
});
