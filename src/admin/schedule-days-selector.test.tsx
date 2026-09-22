import { render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { DayOfWeek } from '../types/chore-types';
import { ScheduleDaysSelector } from './schedule-days-selector';

describe('ScheduleDaysSelector', () => {
  const renderSelector = (initialSkipDays: DayOfWeek[] = []) => {
    const [skipDays, setSkipDays] = createSignal(initialSkipDays);
    render(() => <ScheduleDaysSelector skipDays={skipDays} setSkipDays={setSkipDays} />);
    return { skipDays };
  };

  it('defaults to selecting days to skip', async () => {
    const { skipDays } = renderSelector([DayOfWeek.TUESDAY]);

    await expect
      .element(page.getByRole('tab', { name: 'Every day except' }))
      .toHaveAttribute('aria-selected', 'true');
    await expect.element(page.getByLabelText('Tuesday')).toBeChecked();
    await expect.element(page.getByLabelText('Monday')).not.toBeChecked();
    await expect
      .element(page.getByTestId('schedule-summary'))
      .toHaveTextContent('This chore is active on Sunday, Monday, Wednesday');
    expect(skipDays()).toEqual([DayOfWeek.TUESDAY]);
  });

  it('defaults to active-day mode when more than three days are skipped', async () => {
    const { skipDays } = renderSelector([
      DayOfWeek.SUNDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.FRIDAY,
    ]);

    await expect
      .element(page.getByRole('tab', { name: 'Only on selected days' }))
      .toHaveAttribute('aria-selected', 'true');
    await expect.element(page.getByLabelText('Monday')).toBeChecked();
    await expect.element(page.getByLabelText('Thursday')).toBeChecked();
    await expect.element(page.getByLabelText('Saturday')).toBeChecked();
    await expect.element(page.getByLabelText('Tuesday')).not.toBeChecked();
    expect(skipDays()).toEqual([
      DayOfWeek.SUNDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.FRIDAY,
    ]);
  });

  it('stores unselected active days as skip days', async () => {
    const { skipDays } = renderSelector();
    await page.getByRole('tab', { name: 'Only on selected days' }).click();

    await page.getByLabelText('Tuesday').click();

    expect(skipDays()).toEqual([DayOfWeek.TUESDAY]);
    await expect.element(page.getByLabelText('Tuesday')).not.toBeChecked();
    await expect
      .element(page.getByTestId('schedule-summary'))
      .toHaveTextContent('Days not selected are skip days');
  });
});
