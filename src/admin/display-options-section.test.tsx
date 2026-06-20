import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { DisplayOptionsSection } from './display-options-section';

const defaultProps = {
  startTime: () => undefined,
  deadline: () => undefined,
  skipDays: () => [],
  skipDayVisibility: () => SkipDayVisibility.HIDE,
  setSkipDayVisibility: () => {},
  beforeStartTimeVisibility: () => BeforeStartTimeVisibility.HIDE,
  setBeforeStartTimeVisibility: () => {},
  afterDeadlineVisibility: () => AfterDeadlineVisibility.SHOW_OVERDUE,
  setAfterDeadlineVisibility: () => {},
  notCaughtUpDisplay: () => NotCaughtUpDisplay.OVERDUE,
  setNotCaughtUpDisplay: () => {},
};

describe('DisplayOptionsSection', () => {
  it('renders the caught up note', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect
      .element(
        page.getByText(/A chore is caught up when it was completed on the previous day it appeared/)
      )
      .toBeVisible();
  });

  it('renders before start time hide description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        startTime={() => '08:00'}
        beforeStartTimeVisibility={() => BeforeStartTimeVisibility.HIDE}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Hide:')).toBeVisible();
    expect(page.getByText('Show if overdue:').elements().length).toBe(0);
  });

  it('renders before start time show if overdue description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        startTime={() => '08:00'}
        beforeStartTimeVisibility={() => BeforeStartTimeVisibility.SHOW_IF_OVERDUE}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Show if overdue:')).toBeVisible();
    expect(page.getByText('Hide:').elements().length).toBe(0);
  });

  it('renders after deadline show normally description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        deadline={() => '20:00'}
        afterDeadlineVisibility={() => AfterDeadlineVisibility.SHOW_NORMAL}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Show normally:')).toBeVisible();
    expect(page.getByText('Show as overdue:').elements().length).toBe(0);
    expect(page.getByText('Move to earlier chores:').elements().length).toBe(0);
  });

  it('renders after deadline show as overdue description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        deadline={() => '20:00'}
        afterDeadlineVisibility={() => AfterDeadlineVisibility.SHOW_OVERDUE}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Show as overdue:')).toBeVisible();
    expect(page.getByText('Show normally:').elements().length).toBe(0);
    expect(page.getByText('Move to earlier chores:').elements().length).toBe(0);
  });

  it('renders after deadline move to earlier description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        deadline={() => '20:00'}
        afterDeadlineVisibility={() => AfterDeadlineVisibility.MOVE_TO_EARLIER}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Move to earlier chores:')).toBeVisible();
    expect(page.getByText('Show normally:').elements().length).toBe(0);
    expect(page.getByText('Show as overdue:').elements().length).toBe(0);
  });

  it('renders skip day visibility hide description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        skipDays={() => [DayOfWeek.SUNDAY]}
        skipDayVisibility={() => SkipDayVisibility.HIDE}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Hide:')).toBeVisible();
    expect(page.getByText('Always Show:').elements().length).toBe(0);
    expect(page.getByText('Show If Overdue:').elements().length).toBe(0);
  });

  it('renders skip day visibility show always description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        skipDays={() => [DayOfWeek.SUNDAY]}
        skipDayVisibility={() => SkipDayVisibility.SHOW_ALWAYS}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Always Show:')).toBeVisible();
    expect(page.getByText('Hide:').elements().length).toBe(0);
    expect(page.getByText('Show If Overdue:').elements().length).toBe(0);
  });

  it('renders skip day visibility show if overdue description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        skipDays={() => [DayOfWeek.SUNDAY]}
        skipDayVisibility={() => SkipDayVisibility.SHOW_IF_OVERDUE}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Show If Overdue:')).toBeVisible();
    expect(page.getByText('Hide:').elements().length).toBe(0);
    expect(page.getByText('Always Show:').elements().length).toBe(0);
  });

  it('hides skip day visibility when no skip days are selected', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        skipDayVisibility={() => SkipDayVisibility.SHOW_ALWAYS}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    expect(page.getByText('Skip day visibility').elements().length).toBe(0);
  });

  it('renders not caught up overdue styling description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        startTime={() => '08:00'}
        beforeStartTimeVisibility={() => BeforeStartTimeVisibility.SHOW_IF_OVERDUE}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.OVERDUE}
      />
    ));

    await expect.element(page.getByText('Overdue styling:')).toBeVisible();
    expect(page.getByText('Normal styling:').elements().length).toBe(0);
  });

  it('renders not caught up normal styling description', async () => {
    render(() => (
      <DisplayOptionsSection
        {...defaultProps}
        notCaughtUpDisplay={() => NotCaughtUpDisplay.NORMAL}
      />
    ));

    await expect.element(page.getByText('Normal styling:')).toBeVisible();
    expect(page.getByText('Overdue styling:').elements().length).toBe(0);
  });
});
