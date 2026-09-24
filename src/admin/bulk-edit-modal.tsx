import type { Component } from 'solid-js';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { updateChore } from '../api';
import type {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  Chore,
  DayOfWeek,
  NotCaughtUpDisplay,
  Person,
  SkipDayVisibility,
} from '../types/chore-types';
import {
  AfterDeadlineVisibility as AfterDeadlineVisibilityEnum,
  BeforeStartTimeVisibility as BeforeStartTimeVisibilityEnum,
  ChoreType,
  NotCaughtUpDisplay as NotCaughtUpDisplayEnum,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';
import type { UpdateChoreRequest } from '../types/request-types';
import { formatTime } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { triggerBackupDownload } from './backup-actions';
import { Button } from './button';
import { InfoBox } from './info-box';
import { PinField } from './pin-field';
import { ScheduleDaysSelector } from './schedule-days-selector';
import { TimeSelect } from './time-select';
import { Tooltip } from './tooltip';

/** Props for the BulkEditModal component */
interface BulkEditModalProps {
  /** Which chore type this run applies to; the modal is always scoped to one type */
  choreType: ChoreType;
  closeModal: () => void;
}

/** The single chore field that can be bulk-edited in one run of the wizard */
type EligibleField =
  | 'startTime'
  | 'deadline'
  | 'skipDays'
  | 'notCaughtUpDisplay'
  | 'beforeStartTimeVisibility'
  | 'afterDeadlineVisibility'
  | 'skipDayVisibility';

/** Value shape for the field currently being edited */
type FieldValue = string | DayOfWeek[];

type SubmitRowStatus = 'pending' | 'in-progress' | 'done' | 'failed';

const MAIN_FIELDS: EligibleField[] = ['startTime', 'deadline', 'skipDays'];
const ADVANCED_FIELDS: EligibleField[] = [
  'notCaughtUpDisplay',
  'beforeStartTimeVisibility',
  'afterDeadlineVisibility',
  'skipDayVisibility',
];

const FIELD_LABELS: Record<EligibleField, string> = {
  startTime: 'Start Time',
  deadline: 'Deadline',
  skipDays: 'Skip Days',
  notCaughtUpDisplay: 'Not Caught Up Display',
  beforeStartTimeVisibility: 'Before Start Time Visibility',
  afterDeadlineVisibility: 'After Deadline Visibility',
  skipDayVisibility: 'Skip Day Visibility',
};

const FIELD_DESCRIPTIONS: Record<EligibleField, string> = {
  startTime: 'The time each selected chore first becomes visible.',
  deadline: 'The time each selected chore is due by.',
  skipDays: 'Days of the week each selected chore does not need to be done.',
  notCaughtUpDisplay: 'Whether a chore that is not caught up is styled as overdue or normal.',
  beforeStartTimeVisibility:
    'Whether a chore that is not caught up can appear before its start time.',
  afterDeadlineVisibility: 'How a chore behaves after its deadline passes.',
  skipDayVisibility: 'How a chore behaves on its own skip days.',
};

const NOT_CAUGHT_UP_LABELS: Record<string, string> = {
  [NotCaughtUpDisplayEnum.OVERDUE]: 'Overdue styling',
  [NotCaughtUpDisplayEnum.NORMAL]: 'Normal styling',
};
const BEFORE_START_LABELS: Record<string, string> = {
  [BeforeStartTimeVisibilityEnum.HIDE]: 'Hide',
  [BeforeStartTimeVisibilityEnum.SHOW_IF_OVERDUE]: 'Show if overdue',
};
const AFTER_DEADLINE_LABELS: Record<string, string> = {
  [AfterDeadlineVisibilityEnum.SHOW_NORMAL]: 'Show normally',
  [AfterDeadlineVisibilityEnum.SHOW_OVERDUE]: 'Show as overdue',
  [AfterDeadlineVisibilityEnum.MOVE_TO_EARLIER]: 'Move to earlier chores',
};
const SKIP_DAY_VIS_LABELS: Record<string, string> = {
  [SkipDayVisibilityEnum.HIDE]: 'Hide',
  [SkipDayVisibilityEnum.SHOW_ALWAYS]: 'Always Show',
  [SkipDayVisibilityEnum.SHOW_IF_OVERDUE]: 'Show If Overdue',
};

interface RadioOption {
  value: string;
  label: string;
  description: string;
}

// Labels/descriptions copied verbatim from display-options-section.tsx so this wizard
// doesn't drift from the single-chore modal's wording.
const RADIO_OPTIONS: Partial<Record<EligibleField, RadioOption[]>> = {
  notCaughtUpDisplay: [
    {
      value: NotCaughtUpDisplayEnum.OVERDUE,
      label: 'Overdue styling',
      description:
        'If the chore is not caught up, it is styled as overdue (default style is yellow).',
    },
    {
      value: NotCaughtUpDisplayEnum.NORMAL,
      label: 'Normal styling',
      description: 'If the chore is not caught up, it is styled as normal.',
    },
  ],
  beforeStartTimeVisibility: [
    {
      value: BeforeStartTimeVisibilityEnum.HIDE,
      label: 'Hide',
      description: 'The chore stays hidden until its start time even if it is not caught up.',
    },
    {
      value: BeforeStartTimeVisibilityEnum.SHOW_IF_OVERDUE,
      label: 'Show if overdue',
      description:
        'If the chore is not caught up, it appears before its start time so it can be caught up early.',
    },
  ],
  afterDeadlineVisibility: [
    {
      value: AfterDeadlineVisibilityEnum.SHOW_NORMAL,
      label: 'Show normally',
      description: 'Stays in the main list after the deadline until completed.',
    },
    {
      value: AfterDeadlineVisibilityEnum.SHOW_OVERDUE,
      label: 'Show as overdue',
      description: 'Stays in the main list and turns yellow after the deadline until completed.',
    },
    {
      value: AfterDeadlineVisibilityEnum.MOVE_TO_EARLIER,
      label: 'Move to earlier chores',
      description:
        'Moves to the "Earlier chores" section after the deadline whether complete or not.',
    },
  ],
  skipDayVisibility: [
    {
      value: SkipDayVisibilityEnum.HIDE,
      label: 'Hide',
      description: "The chore disappears completely on skip days. It's a true day off.",
    },
    {
      value: SkipDayVisibilityEnum.SHOW_ALWAYS,
      label: 'Always Show',
      description: 'The chore stays visible on skip days (a grace day if already caught up).',
    },
    {
      value: SkipDayVisibilityEnum.SHOW_IF_OVERDUE,
      label: 'Show If Overdue',
      description: 'The chore appears on skip days only if it is not caught up.',
    },
  ],
};

const isFieldEligibleForChore = (field: EligibleField, chore: Chore): boolean => {
  switch (field) {
    case 'beforeStartTimeVisibility':
      return !!chore.startTime;
    case 'afterDeadlineVisibility':
      return !!chore.deadline;
    case 'skipDayVisibility':
      return chore.skipDays.length > 0;
    default:
      return true;
  }
};

const ineligibleReason = (field: EligibleField): string => {
  switch (field) {
    case 'beforeStartTimeVisibility':
      return 'This setting has no effect until the chore has a start time.';
    case 'afterDeadlineVisibility':
      return 'This setting has no effect until the chore has a deadline.';
    case 'skipDayVisibility':
      return 'This setting has no effect until the chore has skip days configured.';
    default:
      return '';
  }
};

const defaultValueForField = (field: EligibleField): FieldValue => {
  switch (field) {
    case 'startTime':
    case 'deadline':
      return '';
    case 'skipDays':
      return [];
    case 'notCaughtUpDisplay':
      return NotCaughtUpDisplayEnum.OVERDUE;
    case 'beforeStartTimeVisibility':
      return BeforeStartTimeVisibilityEnum.HIDE;
    case 'afterDeadlineVisibility':
      return AfterDeadlineVisibilityEnum.SHOW_OVERDUE;
    case 'skipDayVisibility':
      return SkipDayVisibilityEnum.HIDE;
  }
};

const getChoreValue = (chore: Chore, field: EligibleField): FieldValue => {
  switch (field) {
    case 'startTime':
      return chore.startTime ?? '';
    case 'deadline':
      return chore.deadline ?? '';
    case 'skipDays':
      return chore.skipDays;
    case 'notCaughtUpDisplay':
      return chore.notCaughtUpDisplay;
    case 'beforeStartTimeVisibility':
      return chore.beforeStartTimeVisibility;
    case 'afterDeadlineVisibility':
      return chore.afterDeadlineVisibility;
    case 'skipDayVisibility':
      return chore.skipDayVisibility;
  }
};

const formatSkipDays = (days: DayOfWeek[]): string => {
  if (!days || days.length === 0) return 'None';
  return days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
};

const formatFieldValue = (field: EligibleField, value: FieldValue, timeFormat: string): string => {
  switch (field) {
    case 'startTime':
    case 'deadline':
      return value ? formatTime(value as string, timeFormat) : 'Not set';
    case 'skipDays':
      return formatSkipDays(value as DayOfWeek[]);
    case 'notCaughtUpDisplay':
      return NOT_CAUGHT_UP_LABELS[value as string] ?? String(value);
    case 'beforeStartTimeVisibility':
      return BEFORE_START_LABELS[value as string] ?? String(value);
    case 'afterDeadlineVisibility':
      return AFTER_DEADLINE_LABELS[value as string] ?? String(value);
    case 'skipDayVisibility':
      return SKIP_DAY_VIS_LABELS[value as string] ?? String(value);
  }
};

const valueMatchesChore = (field: EligibleField, expected: FieldValue, chore: Chore): boolean => {
  const actual = getChoreValue(chore, field);
  if (field === 'skipDays') {
    const actualDays = actual as DayOfWeek[];
    const expectedDays = expected as DayOfWeek[];
    return (
      actualDays.length === expectedDays.length && expectedDays.every((d) => actualDays.includes(d))
    );
  }
  if (field === 'startTime' || field === 'deadline') {
    return (actual || '') === (expected || '');
  }
  return actual === expected;
};

const buildFieldPayload = (
  field: EligibleField,
  value: FieldValue
): Partial<UpdateChoreRequest> => {
  switch (field) {
    case 'startTime':
      return { startTime: (value as string) === '' ? null : (value as string) };
    case 'deadline':
      return { deadline: (value as string) === '' ? null : (value as string) };
    case 'skipDays':
      return { skipDays: value as DayOfWeek[] };
    case 'notCaughtUpDisplay':
      return { notCaughtUpDisplay: value as NotCaughtUpDisplay };
    case 'beforeStartTimeVisibility':
      return { beforeStartTimeVisibility: value as BeforeStartTimeVisibility };
    case 'afterDeadlineVisibility':
      return { afterDeadlineVisibility: value as AfterDeadlineVisibility };
    case 'skipDayVisibility':
      return { skipDayVisibility: value as SkipDayVisibility };
  }
};

const statusLabel = (status: SubmitRowStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in-progress':
      return '…';
    case 'done':
      return '✓ Done';
    case 'failed':
      return '✗ Failed';
  }
};

interface ChoreGroup {
  person: Person | null;
  chores: Chore[];
}

type SelectionState = 'all' | 'some' | 'none';

interface SelectionChipProps {
  label: string;
  state: SelectionState;
  onClick: () => void;
  dataTestId?: string;
}

/**
 * Small checkbox-style toggle chip used for the Step 3 smart-select shortcuts.
 * Shows a checkmark when every matching chore is selected, a dash when only
 * some are, and an empty box when none are — clicking toggles the whole group.
 */
const SelectionChip: Component<SelectionChipProps> = (props) => (
  <button
    type="button"
    onClick={() => props.onClick()}
    data-testid={props.dataTestId}
    class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
    classList={{
      'border-indigo-300 bg-indigo-50 text-indigo-700': props.state !== 'none',
      'border-slate-300 bg-white text-slate-600 hover:bg-slate-50': props.state === 'none',
    }}
  >
    <span
      class="flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border text-[10px] leading-none"
      classList={{
        'border-indigo-500 bg-indigo-500 text-white': props.state === 'all',
        'border-indigo-400 bg-white text-indigo-500': props.state === 'some',
        'border-slate-300 bg-white': props.state === 'none',
      }}
    >
      <Show when={props.state === 'all'}>✓</Show>
      <Show when={props.state === 'some'}>–</Show>
    </span>
    {props.label}
  </button>
);

/**
 * Wizard modal for changing a single chore setting across many chores of one type
 * (personal or rotating) at once. See docs/plan for the full design rationale.
 */
export const BulkEditModal: Component<BulkEditModalProps> = (props) => {
  const { choreData, pinRequired, cachedPin, setCachedPin, resolvedTimeFormat } = useAdminContext();

  const [step, setStep] = createSignal<1 | 2 | 3 | 4>(1);
  const [field, setFieldRaw] = createSignal<EligibleField | null>(null);
  const [value, setValue] = createSignal<FieldValue>('');
  const [selectedChoreIds, setSelectedChoreIds] = createSignal<string[]>([]);
  const [viewMode, setViewMode] = createSignal<'compact' | 'detailed'>('compact');
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);
  const [submitStatus, setSubmitStatus] = createSignal<Record<string, SubmitRowStatus>>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [finished, setFinished] = createSignal(false);
  const [pinError, setPinError] = createSignal(false);
  const [submitError, setSubmitError] = createSignal('');

  const pinToUse = () => cachedPin() || pin();

  // Changing the field must reset the value and clear the chore selection: chore
  // eligibility and value type both depend on which field is chosen, so leftover
  // selections/values from a previous field could otherwise reference chores or
  // shapes that no longer apply once the field changes.
  const chooseField = (newField: EligibleField) => {
    setFieldRaw(newField);
    setValue(defaultValueForField(newField));
    setSelectedChoreIds([]);
  };

  const choresForType = createMemo<Chore[]>(() =>
    choreData().chores.filter((c) => c.type === props.choreType)
  );

  // No re-sorting: personal chores are grouped by person in the same order the
  // People tab shows them, rotating chores stay a flat list in the same order the
  // Rotating Chores tab shows them.
  const groupedChores = createMemo<ChoreGroup[]>(() => {
    if (props.choreType === ChoreType.ROTATING) {
      return [{ person: null, chores: choresForType() }];
    }
    return choreData()
      .people.map((person) => ({
        person,
        chores: choresForType().filter(
          (c) => c.type === ChoreType.PERSONAL && c.assignedTo === person.id
        ),
      }))
      .filter((group) => group.chores.length > 0);
  });

  const eligibleChores = createMemo<Chore[]>(() => {
    const f = field();
    if (!f) return [];
    return choresForType().filter((c) => isFieldEligibleForChore(f, c));
  });

  interface ValueBucket {
    label: string;
    choreIds: string[];
  }

  const valueBuckets = createMemo<ValueBucket[]>(() => {
    const f = field();
    if (!f) return [];
    if (f === 'skipDays' || f === 'startTime' || f === 'deadline') {
      const hasValue: string[] = [];
      const noValue: string[] = [];
      for (const chore of eligibleChores()) {
        const v = getChoreValue(chore, f);
        const empty = Array.isArray(v) ? v.length === 0 : !v;
        (empty ? noValue : hasValue).push(chore.id);
      }
      const buckets: ValueBucket[] = [];
      const noun = f === 'skipDays' ? 'skip day' : 'value';
      if (hasValue.length > 0) {
        buckets.push({ label: `has a ${noun} set`, choreIds: hasValue });
      }
      if (noValue.length > 0) {
        buckets.push({ label: `has no ${noun} set`, choreIds: noValue });
      }
      return buckets;
    }
    const byValue = new Map<string, string[]>();
    for (const chore of eligibleChores()) {
      const key = String(getChoreValue(chore, f));
      const ids = byValue.get(key) ?? [];
      ids.push(chore.id);
      byValue.set(key, ids);
    }
    return Array.from(byValue.entries()).map(([key, ids]) => ({
      label: `is currently "${formatFieldValue(f, key, resolvedTimeFormat())}"`,
      choreIds: ids,
    }));
  });

  const toggleChore = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedChoreIds([...selectedChoreIds(), id]);
    } else {
      setSelectedChoreIds(selectedChoreIds().filter((choreId) => choreId !== id));
    }
  };

  const selectNone = () => setSelectedChoreIds([]);

  const bucketSelectionState = (ids: string[]): SelectionState => {
    if (ids.length === 0) return 'none';
    const selected = selectedChoreIds();
    const selectedCount = ids.filter((id) => selected.includes(id)).length;
    if (selectedCount === 0) return 'none';
    return selectedCount === ids.length ? 'all' : 'some';
  };

  // Clicking a shortcut chip toggles the whole group: if every chore in it is
  // already selected, clicking again deselects just that group; otherwise it
  // selects every chore in the group (on top of whatever else is selected).
  const toggleBucketSelection = (ids: string[]) => {
    if (bucketSelectionState(ids) === 'all') {
      setSelectedChoreIds(selectedChoreIds().filter((id) => !ids.includes(id)));
    } else {
      setSelectedChoreIds(Array.from(new Set([...selectedChoreIds(), ...ids])));
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const pinValue = pinToUse();
      if (pinRequired() && !pinValue) {
        alert('Enter your admin PIN below first, then click Download Backup again.');
        return;
      }
      await triggerBackupDownload(pinValue || undefined);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert(
        `Failed to download backup: ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    }
  };

  const doneCount = () => Object.values(submitStatus()).filter((s) => s === 'done').length;

  // Deliberately sequential (for...of + await), never Promise.all: this feature's
  // whole purpose is firing many chore writes at once, so it goes further than
  // "technically safe" and makes every request wait for the previous one's
  // response before starting, with the UI locked so nothing else can happen
  // mid-run. See the plan doc for the full race-condition reasoning.
  const handleApply = async () => {
    const f = field();
    if (!f) return;

    const ids = selectedChoreIds();
    const initialStatus: Record<string, SubmitRowStatus> = {};
    for (const id of ids) initialStatus[id] = 'pending';
    setSubmitStatus(initialStatus);
    setPinError(false);
    setSubmitError('');
    setIsSubmitting(true);

    const payload = buildFieldPayload(f, value());
    const expected = value();
    // Capture the PIN once at the start of the run so a mid-run cache change
    // cannot silently alter the value sent with remaining requests.
    const runPin = pinToUse();
    let stoppedEarly = false;

    for (const id of ids) {
      setSubmitStatus((prev) => ({ ...prev, [id]: 'in-progress' }));
      try {
        const pinValue = pinRequired() ? runPin || undefined : undefined;
        const updated = (await updateChore(id, { ...payload, pin: pinValue })) as Chore;
        if (!valueMatchesChore(f, expected, updated)) {
          throw new Error('Update did not apply as expected');
        }
        setSubmitStatus((prev) => ({ ...prev, [id]: 'done' }));
      } catch (error) {
        setSubmitStatus((prev) => ({ ...prev, [id]: 'failed' }));
        // Same PIN is sent with every request in this run — if it's wrong, every
        // remaining row would fail identically, so stop immediately with a
        // distinct message instead of grinding through failing each one.
        if (error instanceof Error && error.message === 'Invalid PIN') {
          setPinError(true);
          setCachedPin('');
        } else {
          setSubmitError(error instanceof Error ? error.message : 'Unknown error');
        }
        // Stop at the first failure so the user can inspect which rows succeeded/failed.
        // There is no in-wizard retry; the user should close the modal, refresh the page,
        // and run the bulk edit again if the failure was temporary.
        stoppedEarly = true;
        break;
      }
    }

    if (!stoppedEarly && !cachedPin() && rememberPin() && pin()) {
      setCachedPin(pin());
    }
    setIsSubmitting(false);
    setFinished(true);
  };

  const handleClose = () => {
    // The parent closeModal already refreshes choreData via loadData(), so the
    // modal does not need to reload before unmounting.
    props.closeModal();
  };

  const canApply = () => !(pinRequired() && !cachedPin() && !pin());

  // The Detailed table view (Step 3) has a column per chore setting and needs far
  // more horizontal room than the rest of the wizard, so the modal itself widens
  // while that view is active instead of just scrolling the table sideways.
  const isWideLayout = () => step() === 3 && viewMode() === 'detailed';

  return (
    <div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
      <div
        class="max-h-[90vh] scale-95 overflow-y-auto rounded-xl bg-white shadow-2xl transition-[transform,max-width] duration-200"
        classList={{
          'w-[90%] max-w-[720px]': !isWideLayout(),
          'w-[95%] max-w-[1600px]': isWideLayout(),
        }}
        data-testid="modal-content"
      >
        <div
          class="sticky top-0 z-10 rounded-t-xl border-b border-slate-100 bg-white px-8 pt-8 pb-4"
          data-testid="modal-header"
        >
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-2xl text-indigo-600" data-testid="modal-title">
              Bulk Edit {props.choreType === ChoreType.PERSONAL ? 'Personal' : 'Rotating'} Chore
              Settings
            </h3>
            <Show when={!isSubmitting()}>
              <button
                type="button"
                class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"
                aria-label="Close"
                onClick={() => props.closeModal()}
              >
                ×
              </button>
            </Show>
          </div>

          <div
            class="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-400"
            data-testid="wizard-breadcrumb"
          >
            <span classList={{ 'text-indigo-600': step() === 1 }}>① Field</span>
            <span>→</span>
            <span classList={{ 'text-indigo-600': step() === 2 }}>② Value</span>
            <span>→</span>
            <span classList={{ 'text-indigo-600': step() === 3 }}>③ Chores</span>
            <span>→</span>
            <span classList={{ 'text-indigo-600': step() === 4 }}>④ Confirm</span>
          </div>
        </div>

        <div class="px-8 pt-4 pb-8" data-testid="modal-body">
          <Show when={step() === 1}>
            <div data-testid="step-field">
              <InfoBox icon class="mb-4">
                <div class="flex flex-col gap-2">
                  <span>
                    <strong>Recommended:</strong> download a backup before making bulk changes, in
                    case you want to undo.
                  </span>
                  <div class="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadBackup}
                      dataTestId="backup-download-btn"
                    >
                      Download Backup
                    </Button>
                  </div>
                </div>
              </InfoBox>

              <Show when={pinRequired() && !cachedPin()}>
                <PinField
                  pin={pin()}
                  onPinChange={setPin}
                  remember={rememberPin()}
                  onRememberChange={setRememberPin}
                />
              </Show>

              <InfoBox class="mb-4">
                Because these settings can interact with each other, you can only bulk-edit one
                setting at a time. To change multiple settings, run this tool again for each one.
              </InfoBox>

              <div class="mb-4">
                <h4 class="mb-2 font-medium text-slate-900">Main Settings</h4>
                <div class="flex flex-col gap-2">
                  <For each={MAIN_FIELDS}>
                    {(f) => (
                      <div class="rounded-lg border border-slate-200 p-3">
                        <label class="flex cursor-pointer items-center gap-2" for={`field-${f}`}>
                          <input
                            type="radio"
                            id={`field-${f}`}
                            name="bulk-edit-field"
                            checked={field() === f}
                            onInput={() => chooseField(f)}
                          />
                          <span class="font-medium text-slate-900">{FIELD_LABELS[f]}</span>
                        </label>
                        <p class="mt-1 ml-6 text-sm text-slate-500">{FIELD_DESCRIPTIONS[f]}</p>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="mb-4">
                <h4 class="mb-2 font-medium text-slate-900">Advanced Display Settings</h4>
                <div class="flex flex-col gap-2">
                  <For each={ADVANCED_FIELDS}>
                    {(f) => (
                      <div class="rounded-lg border border-slate-200 p-3">
                        <label class="flex cursor-pointer items-center gap-2" for={`field-${f}`}>
                          <input
                            type="radio"
                            id={`field-${f}`}
                            name="bulk-edit-field"
                            checked={field() === f}
                            onInput={() => chooseField(f)}
                          />
                          <span class="font-medium text-slate-900">{FIELD_LABELS[f]}</span>
                        </label>
                        <p class="mt-1 ml-6 text-sm text-slate-500">{FIELD_DESCRIPTIONS[f]}</p>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="mt-6 flex justify-end gap-2.5">
                <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!field()}
                  onClick={() => setStep(2)}
                  dataTestId="next-button"
                >
                  Next
                </Button>
              </div>
            </div>
          </Show>

          <Show when={step() === 2 && field()}>
            {(f) => (
              <div data-testid="step-value">
                <h4 class="mb-3 font-medium text-slate-900">New value for {FIELD_LABELS[f()]}</h4>

                <Show when={f() === 'startTime' || f() === 'deadline'}>
                  <TimeSelect id="bulk-value-time" value={value() as string} onChange={setValue} />
                </Show>

                <Show when={f() === 'skipDays'}>
                  <ScheduleDaysSelector
                    skipDays={() => value() as DayOfWeek[]}
                    setSkipDays={setValue}
                  />
                </Show>

                <Show when={RADIO_OPTIONS[f()]}>
                  {(options) => (
                    <div class="flex flex-col gap-2">
                      <For each={options()}>
                        {(opt) => (
                          <div class="rounded-lg border border-slate-200 p-3">
                            <label
                              class="flex cursor-pointer items-center gap-2"
                              for={`value-${opt.value}`}
                            >
                              <input
                                type="radio"
                                id={`value-${opt.value}`}
                                name="bulk-edit-value"
                                checked={value() === opt.value}
                                onInput={() => setValue(opt.value)}
                              />
                              <span class="font-medium text-slate-900">{opt.label}</span>
                            </label>
                            <p class="mt-1 ml-6 text-sm text-slate-500">{opt.description}</p>
                          </div>
                        )}
                      </For>
                    </div>
                  )}
                </Show>

                <div class="mt-6 flex justify-end gap-2.5">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setStep(3)}
                    dataTestId="next-button"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Show>

          <Show when={step() === 3 && field()}>
            {(f) => (
              <div data-testid="step-chores">
                <div class="mb-4 flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm">
                  <span>
                    <strong>{FIELD_LABELS[f()]}</strong> →{' '}
                    {formatFieldValue(f(), value(), resolvedTimeFormat())}
                  </span>
                  <button
                    type="button"
                    class="text-indigo-600 underline"
                    onClick={() => setStep(1)}
                    data-testid="edit-field-link"
                  >
                    Edit
                  </button>
                </div>

                <div
                  class="mb-3 inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-sm"
                  role="tablist"
                  aria-label="Chore list view"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode() === 'compact'}
                    class="rounded-md px-3 py-1 font-medium transition-colors"
                    classList={{
                      'bg-white text-indigo-600 shadow-sm': viewMode() === 'compact',
                      'text-slate-500 hover:text-slate-700': viewMode() !== 'compact',
                    }}
                    onClick={() => setViewMode('compact')}
                    data-testid="view-mode-compact"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode() === 'detailed'}
                    class="rounded-md px-3 py-1 font-medium transition-colors"
                    classList={{
                      'bg-white text-indigo-600 shadow-sm': viewMode() === 'detailed',
                      'text-slate-500 hover:text-slate-700': viewMode() !== 'detailed',
                    }}
                    onClick={() => setViewMode('detailed')}
                    data-testid="view-mode-detailed"
                  >
                    Detailed table
                  </button>
                </div>

                <div class="mb-3 flex flex-wrap gap-2" data-testid="smart-select-shortcuts">
                  <SelectionChip
                    label="All"
                    state={bucketSelectionState(eligibleChores().map((c) => c.id))}
                    onClick={() => toggleBucketSelection(eligibleChores().map((c) => c.id))}
                    dataTestId="select-all-chip"
                  />
                  <button
                    type="button"
                    onClick={selectNone}
                    class="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
                    data-testid="select-none-chip"
                  >
                    Clear
                  </button>
                  <For each={valueBuckets()}>
                    {(bucket) => (
                      <SelectionChip
                        label={bucket.label}
                        state={bucketSelectionState(bucket.choreIds)}
                        onClick={() => toggleBucketSelection(bucket.choreIds)}
                      />
                    )}
                  </For>
                </div>

                <Show
                  when={choresForType().length > 0}
                  fallback={
                    <p class="my-4 text-slate-500 italic" data-testid="no-chores-message">
                      No chores of this type yet.
                    </p>
                  }
                >
                  <Show when={viewMode() === 'compact'}>
                    <div
                      class="rounded-lg border border-slate-200"
                      data-testid="compact-chore-list"
                    >
                      <For each={groupedChores()}>
                        {(group) => (
                          <div>
                            <Show when={group.person}>
                              {(person) => (
                                <div class="border-t border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 first:border-t-0">
                                  {person().name}
                                </div>
                              )}
                            </Show>
                            <For each={group.chores}>
                              {(chore) => {
                                const eligible = () => isFieldEligibleForChore(f(), chore);
                                return (
                                  <label
                                    class="flex items-center gap-2 border-t border-slate-100 px-3 py-2 transition-colors"
                                    classList={{
                                      'cursor-not-allowed opacity-50': !eligible(),
                                      'cursor-pointer hover:bg-slate-50': eligible(),
                                    }}
                                    data-testid={`chore-row-${chore.id}`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={!eligible()}
                                      checked={selectedChoreIds().includes(chore.id)}
                                      onInput={(e) =>
                                        toggleChore(chore.id, e.currentTarget.checked)
                                      }
                                    />
                                    <span>{chore.name}</span>
                                    <span class="text-sm text-slate-500">
                                      — currently:{' '}
                                      {formatFieldValue(
                                        f(),
                                        getChoreValue(chore, f()),
                                        resolvedTimeFormat()
                                      )}
                                    </span>
                                    <Show when={!eligible()}>
                                      <Tooltip
                                        text={ineligibleReason(f())}
                                        position="above"
                                        align="left"
                                      >
                                        <span class="text-xs text-slate-400">(why?)</span>
                                      </Tooltip>
                                    </Show>
                                  </label>
                                );
                              }}
                            </For>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={viewMode() === 'detailed'}>
                    <div
                      class="overflow-x-auto rounded-lg border border-slate-200"
                      data-testid="detailed-chore-table"
                    >
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                            <th class="p-2" />
                            <th class="p-2">Chore</th>
                            <Show when={props.choreType === ChoreType.PERSONAL}>
                              <th class="p-2">Person</th>
                            </Show>
                            <th
                              class="p-2"
                              classList={{ 'bg-indigo-100 text-indigo-700': f() === 'startTime' }}
                            >
                              Start Time
                            </th>
                            <th
                              class="p-2"
                              classList={{ 'bg-indigo-100 text-indigo-700': f() === 'deadline' }}
                            >
                              Deadline
                            </th>
                            <th
                              class="p-2"
                              classList={{ 'bg-indigo-100 text-indigo-700': f() === 'skipDays' }}
                            >
                              Skip Days
                            </th>
                            <th
                              class="p-2"
                              classList={{
                                'bg-indigo-100 text-indigo-700': f() === 'skipDayVisibility',
                              }}
                            >
                              Skip Day Visibility
                            </th>
                            <th
                              class="p-2"
                              classList={{
                                'bg-indigo-100 text-indigo-700':
                                  f() === 'beforeStartTimeVisibility',
                              }}
                            >
                              Before Start Time
                            </th>
                            <th
                              class="p-2"
                              classList={{
                                'bg-indigo-100 text-indigo-700': f() === 'afterDeadlineVisibility',
                              }}
                            >
                              After Deadline
                            </th>
                            <th
                              class="p-2"
                              classList={{
                                'bg-indigo-100 text-indigo-700': f() === 'notCaughtUpDisplay',
                              }}
                            >
                              Not Caught Up Display
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <For each={groupedChores()}>
                            {(group) => (
                              <For each={group.chores}>
                                {(chore) => {
                                  const eligible = () => isFieldEligibleForChore(f(), chore);
                                  // Clicking anywhere in the row toggles the checkbox, except
                                  // the checkbox cell itself (which already handles its own
                                  // click) — avoids double-toggling when clicking the checkbox.
                                  const handleRowClick = (e: MouseEvent) => {
                                    if (!eligible()) return;
                                    if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                    toggleChore(chore.id, !selectedChoreIds().includes(chore.id));
                                  };
                                  return (
                                    <tr
                                      classList={{
                                        'cursor-not-allowed opacity-50': !eligible(),
                                        'cursor-pointer hover:bg-slate-50': eligible(),
                                      }}
                                      onClick={handleRowClick}
                                      data-testid={`detailed-row-${chore.id}`}
                                    >
                                      <td class="border-t border-slate-100 p-2">
                                        <input
                                          type="checkbox"
                                          disabled={!eligible()}
                                          checked={selectedChoreIds().includes(chore.id)}
                                          onInput={(e) =>
                                            toggleChore(chore.id, e.currentTarget.checked)
                                          }
                                        />
                                      </td>
                                      <td class="border-t border-slate-100 p-2">{chore.name}</td>
                                      <Show when={props.choreType === ChoreType.PERSONAL}>
                                        <td class="border-t border-slate-100 p-2">
                                          {group.person?.name ?? ''}
                                        </td>
                                      </Show>
                                      <td
                                        class="border-t border-slate-100 p-2"
                                        classList={{ 'bg-indigo-50': f() === 'startTime' }}
                                      >
                                        {chore.startTime
                                          ? formatTime(chore.startTime, resolvedTimeFormat())
                                          : '—'}
                                      </td>
                                      <td
                                        class="border-t border-slate-100 p-2"
                                        classList={{ 'bg-indigo-50': f() === 'deadline' }}
                                      >
                                        {chore.deadline
                                          ? formatTime(chore.deadline, resolvedTimeFormat())
                                          : '—'}
                                      </td>
                                      <td
                                        class="border-t border-slate-100 p-2"
                                        classList={{ 'bg-indigo-50': f() === 'skipDays' }}
                                      >
                                        {formatSkipDays(chore.skipDays)}
                                      </td>
                                      <td
                                        class="border-t border-slate-100 p-2"
                                        classList={{ 'bg-indigo-50': f() === 'skipDayVisibility' }}
                                      >
                                        {SKIP_DAY_VIS_LABELS[chore.skipDayVisibility]}
                                      </td>
                                      <td
                                        class="border-t border-slate-100 p-2"
                                        classList={{
                                          'bg-indigo-50': f() === 'beforeStartTimeVisibility',
                                        }}
                                      >
                                        {BEFORE_START_LABELS[chore.beforeStartTimeVisibility]}
                                      </td>
                                      <td
                                        class="border-t border-slate-100 p-2"
                                        classList={{
                                          'bg-indigo-50': f() === 'afterDeadlineVisibility',
                                        }}
                                      >
                                        {AFTER_DEADLINE_LABELS[chore.afterDeadlineVisibility]}
                                      </td>
                                      <td
                                        class="border-t border-slate-100 p-2"
                                        classList={{ 'bg-indigo-50': f() === 'notCaughtUpDisplay' }}
                                      >
                                        {NOT_CAUGHT_UP_LABELS[chore.notCaughtUpDisplay]}
                                      </td>
                                    </tr>
                                  );
                                }}
                              </For>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                  </Show>
                </Show>

                <div class="mt-6 flex justify-end gap-2.5">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={selectedChoreIds().length === 0}
                    onClick={() => setStep(4)}
                    dataTestId="next-button"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Show>

          <Show when={step() === 4 && field()}>
            {(f) => (
              <div data-testid="step-confirm">
                <div
                  class="mb-4 overflow-hidden rounded-lg border border-slate-200"
                  data-testid="confirm-grid"
                >
                  <div class="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    <span>Chore</span>
                    <span>Current</span>
                    <span />
                    <span>New</span>
                    <span>Status</span>
                  </div>
                  <For each={groupedChores()}>
                    {(group) => {
                      const selectedInGroup = () =>
                        group.chores.filter((c) => selectedChoreIds().includes(c.id));
                      return (
                        <Show when={selectedInGroup().length > 0}>
                          <Show when={group.person}>
                            {(person) => (
                              <div class="border-t border-slate-100 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600">
                                {person().name}
                              </div>
                            )}
                          </Show>
                          <For each={selectedInGroup()}>
                            {(chore) => (
                              <div
                                class="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] items-center gap-x-3 border-t border-slate-100 px-4 py-2"
                                data-testid={`confirm-row-${chore.id}`}
                              >
                                <span class="font-medium text-slate-800">{chore.name}</span>
                                <span class="text-sm text-slate-500">
                                  {formatFieldValue(
                                    f(),
                                    getChoreValue(chore, f()),
                                    resolvedTimeFormat()
                                  )}
                                </span>
                                <span class="text-slate-400">→</span>
                                <span class="text-sm font-semibold text-indigo-600">
                                  {formatFieldValue(f(), value(), resolvedTimeFormat())}
                                </span>
                                <span data-testid={`confirm-status-${chore.id}`}>
                                  {statusLabel(submitStatus()[chore.id] ?? 'pending')}
                                </span>
                              </div>
                            )}
                          </For>
                        </Show>
                      );
                    }}
                  </For>
                </div>

                <Show when={pinError()}>
                  <InfoBox icon class="mb-4 border-red-200 bg-red-50 text-red-700">
                    Incorrect PIN — no further chores were attempted. Close this modal, refresh the
                    page, and reopen the bulk editor to try again; none of the remaining chores were
                    touched.
                  </InfoBox>
                </Show>
                <Show when={submitError() && !pinError()}>
                  <InfoBox icon class="mb-4 border-red-200 bg-red-50 text-red-700">
                    Applied to {doneCount()} of {selectedChoreIds().length} chores before failing:{' '}
                    {submitError()}. Close this modal, refresh the page, and reopen the bulk editor
                    to try again; no further chores were changed.
                  </InfoBox>
                </Show>

                <Show when={pinRequired() && !cachedPin()}>
                  <PinField
                    pin={pin()}
                    onPinChange={setPin}
                    remember={rememberPin()}
                    onRememberChange={setRememberPin}
                  />
                </Show>

                <Show when={isSubmitting()}>
                  <InfoBox icon class="mb-4 border-amber-200 bg-amber-50 text-amber-800">
                    Applying changes — please don't close or refresh this page until this finishes.
                  </InfoBox>
                </Show>

                <div class="mt-6 flex justify-end gap-2.5">
                  <Show when={!isSubmitting() && !finished()}>
                    <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                      Back
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="warning"
                      disabled={!canApply()}
                      onClick={handleApply}
                      dataTestId="apply-button"
                    >
                      Apply Changes
                    </Button>
                  </Show>
                  <Show when={finished()}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleClose}
                      dataTestId="close-button"
                    >
                      Close
                    </Button>
                  </Show>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
};
