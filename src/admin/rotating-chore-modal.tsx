import type { Component } from 'solid-js';
import { createSignal, For } from 'solid-js';
import './buttons.css';
import './forms.css';
import './modals.css';
import { createChore, updateChore } from '../api';
import type { FamilyChoresData, RotatingChore, SkipDayVisibility } from '../types/chore-types';
import {
  ChoreType,
  DayOfWeek,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';
import type { CreateChoreRequest, UpdateChoreRequest } from '../types/request-types';

interface RotatingChoreModalProps {
  initialChore?: RotatingChore;
  choreData: FamilyChoresData;
  closeModal: () => void;
}

export const RotatingChoreModal: Component<RotatingChoreModalProps> = (props) => {
  const [name, setName] = createSignal(props.initialChore?.name ?? '');
  const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.initialChore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.initialChore?.skipDays ?? []);
  const [rotation, setRotation] = createSignal<string[]>(props.initialChore?.rotation ?? []);

  const handleSkipDayChange = (day: DayOfWeek, checked: boolean) => {
    if (checked) {
      setSkipDays([...skipDays(), day]);
    } else {
      setSkipDays(skipDays().filter((d) => d !== day));
    }
  };

  const handleRotationChange = (personId: string, checked: boolean) => {
    if (checked) {
      setRotation([...rotation(), personId]);
    } else {
      setRotation(rotation().filter((id) => id !== personId));
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      if (props.initialChore?.id) {
        const body: UpdateChoreRequest = {
          name: name(),
          type: ChoreType.ROTATING,
          rotation: rotation(),
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
        };
        await updateChore(props.initialChore.id, body);
      } else {
        const body: CreateChoreRequest = {
          name: name(),
          type: ChoreType.ROTATING,
          rotation: rotation(),
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
        };
        await createChore(body);
      }

      props.closeModal();
    } catch (error) {
      console.error('Error saving chore:', error);
      alert(`Failed to save chore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div class="modal active">
      <div class="modal-content">
        <h3>{props.initialChore ? 'Edit Rotating Chore' : 'Add Rotating Chore'}</h3>
        <form onSubmit={handleSubmit}>
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
            <div class="checkbox-list">
              <For each={props.choreData.people}>
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
              value={props.initialChore?.rotatingIndex ?? 0}
              onInput={(_e) => {
                // Store the value but don't track it in state since it's not sent to API
                // The backend calculates this based on the rotation order
              }}
            >
              <For each={rotation()}>
                {(personId, index) => {
                  const person = props.choreData.people.find((p) => p.id === personId);
                  return <option value={index()}>{person ? person.name : 'Unknown'}</option>;
                }}
              </For>
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
            <div class="checkbox-list">
              <For each={Object.values(DayOfWeek)}>
                {(day) => (
                  <label>
                    <input
                      type="checkbox"
                      value={day}
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
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {props.initialChore ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
