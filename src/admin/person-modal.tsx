import { createSignal, type JSX, Show } from 'solid-js';
import type { Person } from '../types/chore-types';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onSave: (person: Omit<Person, 'id'>) => void;
}

export function PersonModal(props: PersonModalProps): JSX.Element {
  const [name, setName] = createSignal(props.person?.name ?? '');
  const [color, setColor] = createSignal(props.person?.color ?? '#FF6B6B');

  function handleSubmit(event: Event) {
    event.preventDefault();
    props.onSave({ name: name(), color: color() });
    props.onClose();
  }

  if (!props.isOpen) return null;

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>{props.person ? 'Edit Person' : 'Add Person'}</h2>
            <button type="button" class="modal-close" onClick={props.onClose}>
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div class="modal-body">
              <div class="form-group">
                <label for="personName">Name</label>
                <input
                  type="text"
                  id="personName"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  required
                />
              </div>
              <div class="form-group">
                <label for="personColor">Color</label>
                <input
                  type="color"
                  id="personColor"
                  value={color()}
                  onInput={(e) => setColor(e.currentTarget.value)}
                />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onClick={props.onClose}>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {props.person ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}
