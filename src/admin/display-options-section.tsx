import type { Accessor, Component } from 'solid-js';
import { createMemo, createSignal, Show, untrack } from 'solid-js';
import type {
  BeforeStartTimeVisibility,
  NotCaughtUpDisplay,
  PostDeadlineVisibility,
} from '../types/chore-types';
import {
  BeforeStartTimeVisibility as BeforeStartTimeVisibilityEnum,
  NotCaughtUpDisplay as NotCaughtUpDisplayEnum,
  PostDeadlineVisibility as PostDeadlineVisibilityEnum,
} from '../types/chore-types';
import { InfoBox } from './info-box';

interface DisplayOptionsSectionProps {
  /** Current start time value (controls whether Before Start Time option is shown) */
  startTime: Accessor<string | undefined>;
  /** Current deadline value (controls whether After Deadline option is shown) */
  deadline: Accessor<string | undefined>;
  /** Current before-start-time visibility value */
  beforeStartTimeVisibility: Accessor<BeforeStartTimeVisibility>;
  /** Setter for before-start-time visibility */
  setBeforeStartTimeVisibility: (value: BeforeStartTimeVisibility) => void;
  /** Current post-deadline visibility value */
  postDeadlineVisibility: Accessor<PostDeadlineVisibility>;
  /** Setter for post-deadline visibility */
  setPostDeadlineVisibility: (value: PostDeadlineVisibility) => void;
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
      props.postDeadlineVisibility() !== PostDeadlineVisibilityEnum.SHOW_OVERDUE
    ) {
      return true;
    }
    if (props.notCaughtUpDisplay() !== NotCaughtUpDisplayEnum.OVERDUE) {
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
              <strong>Hide:</strong> The chore stays hidden until its start time even if it was
              missed previously.
              <br />
              <strong>Show if overdue:</strong> A missed chore appears before its start time so it
              can be caught up early.
            </InfoBox>
          </div>
        </Show>

        <Show when={props.deadline()}>
          <div>
            <label for="postDeadlineVisibility" class="mb-1.5 block font-medium text-slate-900">
              After deadline
            </label>
            <select
              id="postDeadlineVisibility"
              value={props.postDeadlineVisibility()}
              onInput={(e) =>
                props.setPostDeadlineVisibility(e.currentTarget.value as PostDeadlineVisibility)
              }
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            >
              <option value={PostDeadlineVisibilityEnum.SHOW_NORMAL}>Show normally</option>
              <option value={PostDeadlineVisibilityEnum.SHOW_OVERDUE}>Show as overdue</option>
              <option value={PostDeadlineVisibilityEnum.MOVE_TO_EARLIER}>
                Move to earlier chores
              </option>
            </select>
            <InfoBox>
              <strong>Show normally:</strong> The chore stays in the main list after the deadline.
              <br />
              <strong>Show as overdue:</strong> The chore stays in the main list and turns yellow
              after the deadline until completed.
              <br />
              <strong>Move to earlier chores:</strong> The chore moves to the collapsed "Earlier
              chores" section after the deadline.
            </InfoBox>
          </div>
        </Show>

        <div>
          <div class="mb-1.5 flex items-center">
            <label for="notCaughtUpDisplay" class="block font-medium text-slate-900">
              If not completed, next day show as:
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
            <option value={NotCaughtUpDisplayEnum.OVERDUE}>Overdue</option>
            <option value={NotCaughtUpDisplayEnum.NORMAL}>Normal</option>
          </select>
          <InfoBox>
            <strong>Overdue:</strong> A chore missed on the previous non-skip day starts the day as
            overdue (yellow).
            <br />
            <strong>Normal:</strong> A missed chore starts the day looking normal until its deadline
            passes.
          </InfoBox>
        </div>
      </div>
    </details>
  );
};
