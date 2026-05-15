import { createSignal, For, type JSX, Show } from 'solid-js';
import type { Person, RotatingChore, SkipDayVisibility } from '../types/chore-types';
import {
  ChoreType,
  DayOfWeek,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';

interface RotatingChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore: RotatingChore | null;
  people: Person[];
  onSave: (chore: Omit<RotatingChore, 'id'>) => void;
}

export function RotatingChoreModal(props: RotatingChoreModalProps): JSX.Element {
  const [name, setName] = createSignal(props.chore?.name ?? '');
  const [deadline, setDeadline] = createSignal(props.chore?.deadline ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.chore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.chore?.skipDays ?? []);
  const [rotation, setRotation] = createSignal<string[]>(props.chore?.rotation ?? []);
  const [rotatingIndex, setRotatingIndex] = createSignal(props.chore?.rotatingIndex ?? 0);

  function handleSkipDayChange(day: DayOfWeek, checked: boolean) {
    if (checked) {
      setSkipDays([...skipDays(), day]);
    } else {
      setSkipDays(skipDays().filter((d) => d !== day));
    }
  }

  function handleRotationChange(personId: string, checked: boolean) {
    if (checked) {
      setRotation([...rotation(), personId]);
    } else {
      setRotation(rotation().filter((id) => id !== personId));
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (rotation().length === 0) {
      alert('Please select at least one person for rotation.');
      return;
    }
    props.onSave({
      name: name(),
      type: ChoreType.ROTATING,
      rotation: rotation(),
      rotatingIndex: rotatingIndex(),
      deadline: deadline() || undefined,
      skipDays: skipDays(),
      skipDayVisibility: skipDayVisibility(),
      caughtUp: props.chore?.caughtUp ?? true,
      completedToday: props.chore?.completedToday ?? false,
    });
    props.onClose();
  }

  if (!props.isOpen) return null;

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>{props.chore ? 'Edit Rotating Chore' : 'Add Rotating Chore'}</h2>
            <button type="button" class="modal-close" onClick={props.onClose}>
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div class="modal-body">
              <div class="form-group">
                <label for="choreName">Chore Name</label>
                <input
                  type="text"
                  id="choreName"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  required
                />
              </div>
              <div class="form-group">
                <div class="form-label">Rotation (select people)</div>
                <div class="checkbox-group">
                  <For each={props.people}>
                    {(person) => (
                      <label>
                        <input
                          type="checkbox"
                          checked={rotation().includes(person.id)}
                          onInput={(e) => handleRotationChange(person.id, e.currentTarget.checked)}
                        />
                        {person.name}
                      </label>
                    )}
                  </For>
                </div>
              </div>
              <div class="form-group">
                <label for="rotatingIndex">Starting Index (current person)</label>
                <select
                  id="rotatingIndex"
                  value={rotatingIndex()}
                  onInput={(e) => setRotatingIndex(Number(e.currentTarget.value))}
                >
                  {rotation().map((personId, index) => {
                    const person = props.people.find((p) => p.id === personId);
                    return <option value={index}>{person ? person.name : 'Unknown'}</option>;
                  })}
                </select>
              </div>
              <div class="form-group">
                <label for="deadline">Deadline (optional)</label>
                <input
                  type="time"
                  id="deadline"
                  value={deadline()}
                  onInput={(e) => setDeadline(e.currentTarget.value)}
                />
              </div>
              <div class="form-group">
                <div class="form-label">Skip Days</div>
                <div class="checkbox-group">
                  <For
                    each={[
                      DayOfWeek.MONDAY,
                      DayOfWeek.TUESDAY,
                      DayOfWeek.WEDNESDAY,
                      DayOfWeek.THURSDAY,
                      DayOfWeek.FRIDAY,
                      DayOfWeek.SATURDAY,
                      DayOfWeek.SUNDAY,
                    ]}
                  >
                    {(day) => (
                      <label>
                        <input
                          type="checkbox"
                          checked={skipDays().includes(day)}
                          onInput={(e) => handleSkipDayChange(day, e.currentTarget.checked)}
                        />
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </label>
                    )}
                  </For>
                </div>
              </div>
              <div class="form-group">
                <label for="skipDayVisibility">Skip Day Visibility</label>
                <select
                  id="skipDayVisibility"
                  value={skipDayVisibility()}
                  onInput={(e) => setSkipDayVisibility(e.currentTarget.value as SkipDayVisibility)}
                >
                  <option value={SkipDayVisibilityEnum.HIDE}>Hide</option>
                  <option value={SkipDayVisibilityEnum.SHOW_ALWAYS}>Show Always</option>
                  <option value={SkipDayVisibilityEnum.SHOW_IF_OVERDUE}>Show If Overdue</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onClick={props.onClose}>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {props.chore ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}
