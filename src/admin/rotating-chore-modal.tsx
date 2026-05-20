import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { createChore, updateChore } from '../api';
import type { RotatingChore, SkipDayVisibility } from '../types/chore-types';
import {
  ChoreType,
  DayOfWeek,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';
import type { CreateChoreRequest, UpdateChoreRequest } from '../types/request-types';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { PinField } from './pin-field';

interface RotatingChoreModalProps {
  initialChore?: RotatingChore;
  closeModal: () => void;
}

/**
 * 6-dot grab handle used as the drag initiator for person rows.
 */
const GrabHandle: Component = () => (
  <svg width="12" height="18" viewBox="0 0 12 18" class="text-slate-400">
    <title>Drag handle</title>
    <circle cx="3" cy="3" r="1.5" fill="currentColor" />
    <circle cx="9" cy="3" r="1.5" fill="currentColor" />
    <circle cx="3" cy="9" r="1.5" fill="currentColor" />
    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
    <circle cx="3" cy="15" r="1.5" fill="currentColor" />
    <circle cx="9" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

export const RotatingChoreModal: Component<RotatingChoreModalProps> = (props) => {
  const { choreData, pinRequired, setCachedPin, cachedPin } = useAdminContext();
  const [name, setName] = createSignal(props.initialChore?.name ?? '');
  const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.initialChore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.initialChore?.skipDays ?? []);
  const [rotation, setRotation] = createSignal<string[]>(props.initialChore?.rotation ?? []);
  const [activePersonId, setActivePersonId] = createSignal<string>(
    props.initialChore
      ? (props.initialChore.rotation[props.initialChore.rotatingIndex ?? 0] ?? '')
      : ''
  );
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);

  // Drag-and-drop state
  const [draggedPersonId, setDraggedPersonId] = createSignal<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = createSignal<'available' | 'rotation' | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);

  const availablePeople = () => choreData().people.filter((p) => !rotation().includes(p.id));

  const getPersonName = (id: string) =>
    choreData().people.find((p) => p.id === id)?.name ?? 'Unknown';

  const handleSkipDayChange = (day: DayOfWeek, checked: boolean) => {
    if (checked) {
      setSkipDays([...skipDays(), day]);
    } else {
      setSkipDays(skipDays().filter((d) => d !== day));
    }
  };

  const handleDragStart = (personId: string) => (e: DragEvent) => {
    setDraggedPersonId(personId);
    e.dataTransfer?.setData('text/plain', personId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnd = () => {
    setDraggedPersonId(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleColumnDragOver = (e: DragEvent, column: 'available' | 'rotation') => {
    e.preventDefault();
    setDragOverColumn(column);
    if (column === 'rotation') {
      const container = e.currentTarget as HTMLElement;
      const children = Array.from(container.querySelectorAll('[data-rotation-item]'));
      let insertIndex = children.length;
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          insertIndex = i;
          break;
        }
      }
      setDragOverIndex(insertIndex);
    } else {
      setDragOverIndex(null);
    }
  };

  const handleColumnDrop = (e: DragEvent, column: 'available' | 'rotation') => {
    e.preventDefault();
    const personId = e.dataTransfer?.getData('text/plain');
    if (!personId) return;

    const currentRotation = rotation();
    const isInRotation = currentRotation.includes(personId);

    if (column === 'rotation') {
      const container = e.currentTarget as HTMLElement;
      const children = Array.from(container.querySelectorAll('[data-rotation-item]'));
      let insertIndex = children.length;
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          insertIndex = i;
          break;
        }
      }

      if (isInRotation) {
        const oldIndex = currentRotation.indexOf(personId);
        const newRotation = currentRotation.filter((id) => id !== personId);
        if (oldIndex < insertIndex) {
          insertIndex--;
        }
        newRotation.splice(insertIndex, 0, personId);
        setRotation(newRotation);
      } else {
        const newRotation = [...currentRotation];
        newRotation.splice(insertIndex, 0, personId);
        setRotation(newRotation);
        if (!activePersonId()) {
          setActivePersonId(personId);
        }
      }
    } else if (column === 'available' && isInRotation) {
      const newRotation = currentRotation.filter((id) => id !== personId);
      setRotation(newRotation);
      if (activePersonId() === personId) {
        setActivePersonId(newRotation[0] ?? '');
      }
    }

    setDraggedPersonId(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      const pinToUse = cachedPin() || pin();
      const currentRotation = rotation();
      const rotatingIndex = activePersonId() ? currentRotation.indexOf(activePersonId()) : 0;

      if (props.initialChore?.id) {
        const body: UpdateChoreRequest = {
          name: name(),
          type: ChoreType.ROTATING,
          rotation: currentRotation,
          rotatingIndex,
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await updateChore(props.initialChore.id, body);
      } else {
        const body: CreateChoreRequest = {
          name: name(),
          type: ChoreType.ROTATING,
          rotation: currentRotation,
          rotatingIndex,
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await createChore(body);
      }

      if (!cachedPin() && rememberPin() && pin()) {
        setCachedPin(pin());
      }

      props.closeModal();
    } catch (error) {
      console.error('Error saving chore:', error);
      alert(`Failed to save chore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
      <div class="max-h-[90vh] w-[90%] max-w-[600px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-2xl text-indigo-600" data-testid="modal-title">
            {props.initialChore ? 'Edit Rotating Chore' : 'Add Rotating Chore'}
          </h3>
          <button
            type="button"
            class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"
            aria-label="Close"
            onClick={() => props.closeModal()}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="mb-5">
            <label for="choreName" class="mb-3 block font-medium text-slate-900">
              Chore Name
            </label>
            <input
              type="text"
              id="choreName"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              required
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div class="mb-5">
            <div class="mb-3 block font-medium text-slate-900">Rotation</div>
            <div class="flex gap-4">
              {/* Available People */}
              <div class="flex-1">
                <div class="mb-2 text-sm font-medium text-slate-600">Available</div>
                <ul
                  class="min-h-[120px] rounded-lg border border-slate-200 bg-slate-50 p-2"
                  classList={{
                    'border-indigo-500 bg-indigo-50': dragOverColumn() === 'available',
                  }}
                  onDragOver={(e) => handleColumnDragOver(e, 'available')}
                  onDrop={(e) => handleColumnDrop(e, 'available')}
                  data-testid="available-column"
                >
                  <For each={availablePeople()}>
                    {(person) => (
                      <li
                        class="flex cursor-grab items-center gap-2 rounded p-2 transition-opacity hover:bg-slate-100"
                        classList={{
                          'opacity-50': draggedPersonId() === person.id,
                        }}
                        draggable={true}
                        onDragStart={handleDragStart(person.id)}
                        onDragEnd={handleDragEnd}
                        data-testid={`available-person-${person.id}`}
                      >
                        <span data-drag-handle class="shrink-0">
                          <GrabHandle />
                        </span>
                        <span class="text-sm">{person.name}</span>
                      </li>
                    )}
                  </For>
                  <Show when={availablePeople().length === 0}>
                    <li class="list-none p-4 text-center text-sm text-slate-400 italic">
                      All people in rotation
                    </li>
                  </Show>
                </ul>
              </div>

              {/* In Rotation */}
              <div class="flex-1">
                <div class="mb-2 text-sm font-medium text-slate-600">In Rotation</div>
                <ul
                  class="min-h-[120px] rounded-lg border border-slate-200 bg-slate-50 p-2"
                  classList={{
                    'border-indigo-500 bg-indigo-50': dragOverColumn() === 'rotation',
                  }}
                  onDragOver={(e) => handleColumnDragOver(e, 'rotation')}
                  onDrop={(e) => handleColumnDrop(e, 'rotation')}
                  data-testid="rotation-column"
                >
                  <For each={rotation()}>
                    {(personId, index) => (
                      <li
                        class="flex items-center gap-2 rounded p-2 transition-opacity hover:bg-slate-100"
                        classList={{
                          'border-t-2 border-indigo-500':
                            dragOverColumn() === 'rotation' && dragOverIndex() === index(),
                          'border-b-2 border-indigo-500':
                            dragOverColumn() === 'rotation' &&
                            dragOverIndex() === rotation().length &&
                            index() === rotation().length - 1,
                          'opacity-50': draggedPersonId() === personId,
                        }}
                        draggable={true}
                        onDragStart={handleDragStart(personId)}
                        onDragEnd={handleDragEnd}
                        data-rotation-item
                        data-testid={`rotation-person-${personId}`}
                      >
                        <span data-drag-handle class="shrink-0 cursor-grab">
                          <GrabHandle />
                        </span>
                        <label class="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="active-person"
                            value={personId}
                            checked={activePersonId() === personId}
                            onChange={() => setActivePersonId(personId)}
                            class="size-4 cursor-pointer"
                            data-testid={`active-person-radio-${personId}`}
                          />
                          <span class="text-sm">{getPersonName(personId)}</span>
                        </label>
                      </li>
                    )}
                  </For>
                  <Show when={rotation().length === 0}>
                    <li
                      class="list-none p-4 text-center text-sm text-slate-400 italic"
                      data-testid="empty-rotation-message"
                    >
                      Drag people here
                    </li>
                  </Show>
                </ul>
              </div>
            </div>
          </div>

          <div class="mb-5">
            <label for="deadline" class="mb-3 block font-medium text-slate-900">
              Deadline (optional)
            </label>
            <input
              type="time"
              id="deadline"
              value={deadline()}
              onInput={(e) => setDeadline(e.currentTarget.value)}
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div class="mb-5">
            <div class="mb-3 block font-medium text-slate-900">Skip Days</div>
            <div
              class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              data-testid="skip-days-checkbox-list"
            >
              <For each={Object.values(DayOfWeek)}>
                {(day) => (
                  <label class="flex cursor-pointer items-center gap-2 font-normal">
                    <input
                      type="checkbox"
                      value={day}
                      checked={skipDays().includes(day)}
                      onInput={(e) => handleSkipDayChange(day, e.currentTarget.checked)}
                      class="size-4.5 cursor-pointer"
                    />
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </label>
                )}
              </For>
            </div>
          </div>
          <div class="mb-5">
            <label for="skipDayVisibility" class="mb-3 block font-medium text-slate-900">
              Skip Day Visibility
            </label>
            <select
              id="skipDayVisibility"
              value={skipDayVisibility()}
              onInput={(e) => setSkipDayVisibility(e.currentTarget.value as SkipDayVisibility)}
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            >
              <option value={SkipDayVisibilityEnum.HIDE}>Hide</option>
              <option value={SkipDayVisibilityEnum.SHOW_ALWAYS}>Show Always</option>
              <option value={SkipDayVisibilityEnum.SHOW_IF_OVERDUE}>Show If Overdue</option>
            </select>
          </div>
          <Show when={pinRequired() && !cachedPin()}>
            <PinField
              pin={pin()}
              onPinChange={setPin}
              remember={rememberPin()}
              onRememberChange={setRememberPin}
            />
          </Show>
          <div class="mt-6 flex justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {props.initialChore ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
