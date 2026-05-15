import type { Person } from '../types/chore-types';
import type { CreatePersonRequest, UpdatePersonRequest } from '../types/request-types';
import { type Component, createSignal } from 'solid-js';
import { createPerson, updatePerson } from '../api';
import { generatePastelColor } from '../utils/color';

interface PersonModalProps {
  initialPerson?: Person;
  closeModal: () => void;
}

export const PersonModal: Component<PersonModalProps> = (props) => {
  const [name, setName] = createSignal(props.initialPerson?.name ?? '');
  const [color, setColor] = createSignal(props.initialPerson?.color ?? generatePastelColor());

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      if (props.initialPerson?.id) {
        const body: UpdatePersonRequest = {
          name: name(),
          color: color(),
        };
        await updatePerson(props.initialPerson.id, body);
      } else {
        const body: CreatePersonRequest = {
          name: name(),
          color: color(),
        };
        await createPerson(body);
      }

      props.closeModal();
    } catch (error) {
      console.error('Error saving person:', error);
      alert(`Failed to save person: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div class="modal active">
      <div class="modal-content">
        <h3>{props.initialPerson ? 'Edit Person' : 'Add Person'}</h3>
        <form onSubmit={handleSubmit}>
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
            <div class="color-input-group">
              <input
                type="color"
                id="personColor"
                value={color()}
                onInput={(e) => setColor(e.currentTarget.value)}
                required
              />
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                onClick={() => setColor(generatePastelColor())}
              >
                Randomize
              </button>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {props.initialPerson ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
