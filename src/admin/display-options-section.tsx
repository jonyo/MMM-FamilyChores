import type { Accessor, Component } from 'solid-js';
import { createMemo, createSignal, Match, Show, Switch, untrack } from 'solid-js';
import type {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import {
  AfterDeadlineVisibility as AfterDeadlineVisibilityEnum,
  BeforeStartTimeVisibility as BeforeStartTimeVisibilityEnum,
  NotCaughtUpDisplay as NotCaughtUpDisplayEnum,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';
import { InfoBox } from './info-box';

interface DisplayOptionsSectionProps {
  /** Current start time value (controls whether Before Start Time option is shown) */
  startTime: Accessor<string | undefined>;
  /** Current deadline value (controls whether After Deadline option is shown) */
  deadline: Accessor<string | undefined>;
  /** Current skip days (controls whether Skip Day Visibility option is shown) */
  skipDays: Accessor<DayOfWeek[]>;
  /** Current skip-day visibility value */
  skipDayVisibility: Accessor<SkipDayVisibility>;
  /** Setter for skip-day visibility */
  setSkipDayVisibility: (value: SkipDayVisibility) => void;
  /** Current before-start-time visibility value */
  beforeStartTimeVisibility: Accessor<BeforeStartTimeVisibility>;
  /** Setter for before-start-time visibility */
  setBeforeStartTimeVisibility: (value: BeforeStartTimeVisibility) => void;
  /** Current after-deadline visibility value */
  afterDeadlineVisibility: Accessor<AfterDeadlineVisibility>;
  /** Setter for after-deadline visibility */
  setAfterDeadlineVisibility: (value: AfterDeadlineVisibility) => void;
  /** Current not-caught-up display value */
  notCaughtUpDisplay: Accessor<NotCaughtUpDisplay>;
  /** Setter for not-caught-up display */
  setNotCaughtUpDisplay: (value: NotCaughtUpDisplay) => void;
}

/**
 * Collapsible "Advanced Display Options" section shared by both chore modals.
 * Options that do not apply to the current settings are hidden.
 */
export const DisplayOptionsSection: Component<DisplayOptionsSectionProps> = (props) => {
  const hasNonDefaultValue = createMemo(() => {
    if (
      props.startTime() &&
      props.beforeStartTimeVisibility() !== BeforeStartTimeVisibilityEnum.HIDE
    ) {
      return true;
    }
    if (
      props.deadline() &&
      props.afterDeadlineVisibility() !== AfterDeadlineVisibilityEnum.SHOW_OVERDUE
    ) {
      return true;
    }
    if (props.notCaughtUpDisplay() !== NotCaughtUpDisplayEnum.OVERDUE) {
      return true;
    }
    if (props.skipDays().length > 0 && props.skipDayVisibility() !== SkipDayVisibilityEnum.HIDE) {
      return true;
    }
    return false;
  });

  const [isOpen, setIsOpen] = createSignal(untrack(() => hasNonDefaultValue()));

  const handleToggle = (e: ToggleEvent) => {
    setIsOpen(e.newState === 'open');
  };

  return (
    <details
      class="mb-5 rounded-lg border border-slate-200"
      open={isOpen()}
      on:toggle={handleToggle}
    >
      <summary class="cursor-pointer list-none p-3 font-medium text-slate-900">
        <div class="flex items-center justify-between">
          <span>Advanced Display Options</span>
          <div class="flex items-center gap-2">
            <Show when={hasNonDefaultValue()}>
              <span class="text-xs text-indigo-600">Customized</span>
            </Show>
            <span class="text-lg leading-none">{isOpen() ? '−' : '+'}</span>
          </div>
        </div>
      </summary>
      <div class="space-y-4 p-3 pt-0">
        <InfoBox icon>
          <strong>Note:</strong> A chore is <strong>caught up</strong> when it was completed on the
          previous day it appeared (by default, the previous non-skip day). New and newly rotated
          chores start as caught up.
        </InfoBox>

        <div>
          <div class="mb-1.5 flex items-center">
            <label for="notCaughtUpDisplay" class="block font-medium text-slate-900">
              When visible and not caught up, style as:
            </label>
          </div>
          <select
            id="notCaughtUpDisplay"
            value={props.notCaughtUpDisplay()}
            onInput={(e) =>
              props.setNotCaughtUpDisplay(e.currentTarget.value as NotCaughtUpDisplay)
            }
            class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
          >
            <option value={NotCaughtUpDisplayEnum.OVERDUE}>Overdue styling</option>
            <option value={NotCaughtUpDisplayEnum.NORMAL}>Normal styling</option>
          </select>
          <InfoBox>
            <Show when={props.notCaughtUpDisplay() === NotCaughtUpDisplayEnum.OVERDUE}>
              <strong>Overdue styling:</strong> If the chore is not caught up, it is styled as
              overdue (default style is yellow).
            </Show>
            <Show when={props.notCaughtUpDisplay() === NotCaughtUpDisplayEnum.NORMAL}>
              <strong>Normal styling:</strong> If the chore is not caught up, it is styled as
              normal.
            </Show>
          </InfoBox>
        </div>

        <Show when={props.startTime()}>
          <div>
            <label for="beforeStartTimeVisibility" class="mb-1.5 block font-medium text-slate-900">
              Before start time
            </label>
            <select
              id="beforeStartTimeVisibility"
              value={props.beforeStartTimeVisibility()}
              onInput={(e) =>
                props.setBeforeStartTimeVisibility(
                  e.currentTarget.value as BeforeStartTimeVisibility
                )
              }
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            >
              <option value={BeforeStartTimeVisibilityEnum.HIDE}>Hide</option>
              <option value={BeforeStartTimeVisibilityEnum.SHOW_IF_OVERDUE}>Show if overdue</option>
            </select>
            <InfoBox>
              <Show when={props.beforeStartTimeVisibility() === BeforeStartTimeVisibilityEnum.HIDE}>
                <strong>Hide:</strong> The chore stays hidden until {props.startTime()} even if it
                is not caught up.
              </Show>
              <Show
                when={
                  props.beforeStartTimeVisibility() ===
                  BeforeStartTimeVisibilityEnum.SHOW_IF_OVERDUE
                }
              >
                <strong>Show if overdue:</strong> If the chore is caught up, it stays hidden until{' '}
                {props.startTime()}. If it is not caught up, it appears before {props.startTime()}{' '}
                so it can be caught up early.
              </Show>
            </InfoBox>
          </div>
        </Show>

        <Show when={props.deadline()}>
          <div>
            <label for="afterDeadlineVisibility" class="mb-1.5 block font-medium text-slate-900">
              After deadline
            </label>
            <select
              id="afterDeadlineVisibility"
              value={props.afterDeadlineVisibility()}
              onInput={(e) =>
                props.setAfterDeadlineVisibility(e.currentTarget.value as AfterDeadlineVisibility)
              }
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            >
              <option value={AfterDeadlineVisibilityEnum.SHOW_NORMAL}>Show normally</option>
              <option value={AfterDeadlineVisibilityEnum.SHOW_OVERDUE}>Show as overdue</option>
              <option value={AfterDeadlineVisibilityEnum.MOVE_TO_EARLIER}>
                Move to earlier chores
              </option>
            </select>
            <InfoBox>
              <Switch>
                <Match
                  when={props.afterDeadlineVisibility() === AfterDeadlineVisibilityEnum.SHOW_NORMAL}
                >
                  <strong>Show normally:</strong> If the chore is complete, it moves to the "Earlier
                  chores" section after {props.deadline()}. If it is not complete, it stays in the
                  main list after {props.deadline()} until completed.
                </Match>
                <Match
                  when={
                    props.afterDeadlineVisibility() === AfterDeadlineVisibilityEnum.SHOW_OVERDUE
                  }
                >
                  <strong>Show as overdue:</strong> If the chore is complete, it moves to the
                  "Earlier chores" section after {props.deadline()}. If it is not complete, it stays
                  in the main list and turns yellow after {props.deadline()} until completed.
                </Match>
                <Match
                  when={
                    props.afterDeadlineVisibility() === AfterDeadlineVisibilityEnum.MOVE_TO_EARLIER
                  }
                >
                  <strong>Move to earlier chores:</strong> The chore moves to the "Earlier chores"
                  section after {props.deadline()} whether complete or not. You can still mark as
                  complete after that time by expanding the "Earlier chores" section.
                </Match>
              </Switch>
            </InfoBox>
          </div>
        </Show>

        <Show when={props.skipDays().length > 0}>
          <div>
            <label for="skipDayVisibility" class="mb-1.5 block font-medium text-slate-900">
              Skip day visibility
            </label>
            <select
              id="skipDayVisibility"
              value={props.skipDayVisibility()}
              onInput={(e) =>
                props.setSkipDayVisibility(e.currentTarget.value as SkipDayVisibility)
              }
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            >
              <option value={SkipDayVisibilityEnum.HIDE}>Hide</option>
              <option value={SkipDayVisibilityEnum.SHOW_ALWAYS}>Always Show</option>
              <option value={SkipDayVisibilityEnum.SHOW_IF_OVERDUE}>Show If Overdue</option>
            </select>
            <InfoBox>
              <Switch>
                <Match when={props.skipDayVisibility() === SkipDayVisibilityEnum.HIDE}>
                  <strong>Hide:</strong> The chore disappears completely on skip days. It's a true
                  day off — no catch-up needed.
                </Match>
                <Match when={props.skipDayVisibility() === SkipDayVisibilityEnum.SHOW_ALWAYS}>
                  <strong>Always Show:</strong> The chore stays visible on skip days. If it is
                  caught up, it remains checked (a grace day). If it is not caught up, you can check
                  it off on the skip day.
                </Match>
                <Match when={props.skipDayVisibility() === SkipDayVisibilityEnum.SHOW_IF_OVERDUE}>
                  <strong>Show If Overdue:</strong> The chore appears on skip days only if it is not
                  caught up. You can check it off on the skip day to catch up.
                </Match>
              </Switch>
            </InfoBox>
          </div>
        </Show>
      </div>
    </details>
  );
};
