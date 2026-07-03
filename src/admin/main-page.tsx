import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { deleteChore, deletePerson, downloadBackup } from '../api';
import type { Chore, Person, PersonalChore, RotatingChore } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { useAdminContext } from './admin-context';
import { AdvanceRotationsModal } from './advance-rotations-modal';
import { Button } from './button';
import { ChoreHistoryModal } from './chore-history-modal';
import { CopyChoresModal } from './copy-chores-modal';
import { PeopleTab } from './people-tab';
import { PersonModal } from './person-modal';
import { PersonalChoreModal } from './personal-chore-modal';
import { PinPromptModal } from './pin-prompt-modal';
import { ResetCaughtUpModal } from './reset-caught-up-modal';
import { RotatingChoreModal } from './rotating-chore-modal';
import { RotatingChoresTab } from './rotating-chores-tab';
import { SettingsModal } from './settings-modal';
import { SystemActionsTab } from './system-actions-tab';

// API base URL
const API_BASE = '/MMM-FamilyChores';

export const MainPage: Component = () => {
  const { choreData, loadData, pinRequired, setCachedPin, cachedPin } = useAdminContext();

  // PIN prompt modal state
  const [pinPromptOpen, setPinPromptOpen] = createSignal(false);
  const [pinPromptTitle, setPinPromptTitle] = createSignal('');
  const [pinPromptMessage, setPinPromptMessage] = createSignal('');

  let pinPromiseResolve: ((value: { pin: string | null; remember: boolean }) => void) | null = null;

  const requestPin = (
    title: string,
    message: string
  ): Promise<{ pin: string | null; remember: boolean }> => {
    return new Promise((resolve) => {
      pinPromiseResolve = resolve;
      setPinPromptTitle(title);
      setPinPromptMessage(message);
      setPinPromptOpen(true);
    });
  };

  const handlePinConfirm = (pin: string, remember: boolean) => {
    setPinPromptOpen(false);
    pinPromiseResolve?.({ pin, remember });
    pinPromiseResolve = null;
  };

  const handlePinCancel = () => {
    setPinPromptOpen(false);
    pinPromiseResolve?.({ pin: null, remember: false });
    pinPromiseResolve = null;
  };

  const [advanceRotationsModalOpen, setAdvanceRotationsModalOpen] = createSignal(false);
  const [resetCaughtUpModalOpen, setResetCaughtUpModalOpen] = createSignal(false);
  const [personModalOpen, setPersonModalOpen] = createSignal(false);
  const [personalChoreModalOpen, setPersonalChoreModalOpen] = createSignal(false);
  const [rotatingChoreModalOpen, setRotatingChoreModalOpen] = createSignal(false);
  const [copyChoresModalOpen, setCopyChoresModalOpen] = createSignal(false);
  const [settingsModalOpen, setSettingsModalOpen] = createSignal(false);
  const [editingPerson, setEditingPerson] = createSignal<Person | null>(null);
  const [editingChore, setEditingChore] = createSignal<Chore | null>(null);
  const [editingChorePerson, setEditingChorePerson] = createSignal<Person | null>(null);
  const [copyChoresFromPerson, setCopyChoresFromPerson] = createSignal<Person | null>(null);
  const [historyPerson, setHistoryPerson] = createSignal<Person | null>(null);

  const closeAdvanceRotationsModal = async () => {
    setAdvanceRotationsModalOpen(false);
    await loadData();
  };

  // System action handlers
  const handleAdvanceRotations = () => {
    setAdvanceRotationsModalOpen(true);
  };

  const getOverdueChores = () => choreData().chores.filter((c) => !c.caughtUp);

  const handleResetCaughtUp = () => {
    setResetCaughtUpModalOpen(true);
  };

  const closeResetCaughtUpModal = async () => {
    setResetCaughtUpModalOpen(false);
    await loadData();
  };

  // Person modal handlers
  const openPersonModal = (person: Person | null = null) => {
    setEditingPerson(person);
    setPersonModalOpen(true);
  };

  const closePersonModal = async () => {
    setPersonModalOpen(false);
    setEditingPerson(null);
    await loadData();
  };

  // Chore modal handlers
  const openPersonalChoreModal = (person: Person, chore: PersonalChore | null = null) => {
    setEditingChore(chore);
    setEditingChorePerson(person);
    setPersonalChoreModalOpen(true);
  };

  const closePersonalChoreModal = async () => {
    setPersonalChoreModalOpen(false);
    setEditingChore(null);
    setEditingChorePerson(null);
    await loadData();
  };

  const openRotatingChoreModal = (chore: RotatingChore | null = null) => {
    setEditingChore(chore);
    setRotatingChoreModalOpen(true);
  };

  const closeRotatingChoreModal = async () => {
    setRotatingChoreModalOpen(false);
    setEditingChore(null);
    await loadData();
  };

  // Copy chores modal handlers
  const openCopyChoresModal = (person: Person) => {
    setCopyChoresFromPerson(person);
    setCopyChoresModalOpen(true);
  };

  const closeCopyChoresModal = async () => {
    setCopyChoresModalOpen(false);
    setCopyChoresFromPerson(null);
    await loadData();
  };

  // Settings modal handlers
  const closeSettingsModal = async () => {
    setSettingsModalOpen(false);
    await loadData();
  };

  // Backup/restore handlers
  const handleDownloadBackup = async () => {
    try {
      let pin = cachedPin();
      let rememberPin = false;
      if (pinRequired() && !pin) {
        const result = await requestPin('Download Backup', 'Enter admin PIN to download backup');
        if (!result.pin) return;
        pin = result.pin;
        rememberPin = result.remember;
      }

      const blob = await downloadBackup(pin || undefined);
      if (rememberPin) setCachedPin(pin);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-chores-backup.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert(
        `Failed to download backup: ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    }
  };

  const handleRestore = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    let pin = cachedPin();
    let rememberPin = false;
    if (pinRequired() && !pin) {
      const result = await requestPin('Restore Backup', 'Enter admin PIN to restore data');
      if (!result.pin) {
        (e.target as HTMLInputElement).value = '';
        return;
      }
      pin = result.pin;
      rememberPin = result.remember;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, unknown>;
      data.pin = pin || undefined;

      const response = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to restore data');

      if (rememberPin) setCachedPin(pin);
      alert('Data restored successfully!');
      await loadData();
    } catch (error) {
      console.error('Error restoring data:', error);
      alert('Failed to restore data. Please check the file format and try again.');
    }

    // Reset file input
    (e.target as HTMLInputElement).value = '';
  };

  // Delete handlers
  const handleDeletePerson = async (personId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this person? This will also remove all their assigned chores.'
      )
    ) {
      return;
    }

    let pin = cachedPin();
    let rememberPin = false;
    if (pinRequired() && !pin) {
      const result = await requestPin(
        'Admin PIN Required',
        'Enter admin PIN to delete this person'
      );
      if (!result.pin) return;
      pin = result.pin;
      rememberPin = result.remember;
    }

    try {
      await deletePerson(personId, pin || undefined);
      if (rememberPin) setCachedPin(pin);
      await loadData();
    } catch (error) {
      console.error('Error deleting person:', error);
      alert(`Failed to delete person: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    if (!confirm('Are you sure you want to delete this chore?')) {
      return;
    }

    let pin = cachedPin();
    let rememberPin = false;
    if (pinRequired() && !pin) {
      const result = await requestPin('Admin PIN Required', 'Enter admin PIN to delete this chore');
      if (!result.pin) return;
      pin = result.pin;
      rememberPin = result.remember;
    }

    try {
      await deleteChore(choreId, pin || undefined);
      if (rememberPin) setCachedPin(pin);
      await loadData();
    } catch (error) {
      console.error('Error deleting chore:', error);
      alert(`Failed to delete chore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get rotating chores
  const getRotatingChores = (): RotatingChore[] => {
    const data = choreData();
    return data.chores.filter((chore) => chore.type === ChoreType.ROTATING) as RotatingChore[];
  };

  const [activeTab, setActiveTab] = createSignal<'people' | 'rotating' | 'system'>('people');

  const tabs = [
    { id: 'people' as const, label: 'People' },
    { id: 'rotating' as const, label: 'Rotation Chores' },
    { id: 'system' as const, label: 'System Actions' },
  ];

  return (
    <>
      <header class="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-8 text-slate-900">
        <h1 class="text-3xl font-semibold">Family Chores Admin</h1>
        <div class="flex gap-2.5">
          <Button type="button" variant="secondary" onClick={handleDownloadBackup}>
            Download Backup
          </Button>
          <label
            for="restoreFile"
            class="cursor-pointer rounded-lg border-none bg-gray-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-gray-700 hover:shadow-md"
          >
            Restore Backup
          </label>
          <input type="file" id="restoreFile" accept=".json" hidden onInput={handleRestore} />
          <Button type="button" variant="secondary" onClick={() => setSettingsModalOpen(true)}>
            ⚙️ Settings
          </Button>
        </div>
      </header>
      <main class="p-8">
        <nav class="mb-8 border-b border-slate-200">
          <ul class="flex gap-1">
            <For each={tabs}>
              {(tab) => (
                <li>
                  <button
                    type="button"
                    class="cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-all hover:text-indigo-600"
                    classList={{
                      'border-indigo-600 text-indigo-600': activeTab() === tab.id,
                      'border-transparent text-slate-600': activeTab() !== tab.id,
                    }}
                    aria-current={activeTab() === tab.id ? 'page' : undefined}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </nav>

        <Show when={activeTab() === 'people'}>
          <PeopleTab
            people={choreData().people}
            chores={choreData().chores}
            onAddPerson={openPersonModal}
            onEditPerson={openPersonModal}
            onHistory={setHistoryPerson}
            onDeletePerson={handleDeletePerson}
            onAddChore={openPersonalChoreModal}
            onEditChore={openPersonalChoreModal}
            onDeleteChore={handleDeleteChore}
            onCopyChores={openCopyChoresModal}
          />
        </Show>

        <Show when={activeTab() === 'rotating'}>
          <RotatingChoresTab
            people={choreData().people}
            chores={choreData().chores}
            onAddRotatingChore={openRotatingChoreModal}
            onEditRotatingChore={openRotatingChoreModal}
            onDeleteChore={handleDeleteChore}
          />
        </Show>

        <Show when={activeTab() === 'system'}>
          <SystemActionsTab
            onAdvanceRotations={handleAdvanceRotations}
            onResetCaughtUp={handleResetCaughtUp}
          />
        </Show>
      </main>

      {/* Modals */}
      <Show when={personModalOpen()}>
        <PersonModal initialPerson={editingPerson() ?? undefined} closeModal={closePersonModal} />
      </Show>
      <Show when={personalChoreModalOpen()}>
        <PersonalChoreModal
          person={editingChorePerson()}
          initialChore={editingChore() as PersonalChore | undefined}
          closeModal={closePersonalChoreModal}
        />
      </Show>
      <Show when={rotatingChoreModalOpen()}>
        <RotatingChoreModal
          initialChore={editingChore() as RotatingChore | undefined}
          closeModal={closeRotatingChoreModal}
        />
      </Show>
      <Show when={copyChoresModalOpen() && copyChoresFromPerson()}>
        <CopyChoresModal
          fromPerson={copyChoresFromPerson() as Person}
          closeModal={closeCopyChoresModal}
        />
      </Show>
      <Show when={historyPerson()}>
        <ChoreHistoryModal
          person={historyPerson() as Person}
          closeModal={() => setHistoryPerson(null)}
        />
      </Show>
      <Show when={settingsModalOpen()}>
        <SettingsModal closeModal={closeSettingsModal} />
      </Show>
      <Show when={advanceRotationsModalOpen()}>
        <AdvanceRotationsModal
          rotatingChores={getRotatingChores()}
          closeModal={closeAdvanceRotationsModal}
        />
      </Show>
      <Show when={resetCaughtUpModalOpen()}>
        <ResetCaughtUpModal overdue={getOverdueChores()} closeModal={closeResetCaughtUpModal} />
      </Show>
      <Show when={pinPromptOpen()}>
        <PinPromptModal
          title={pinPromptTitle()}
          message={pinPromptMessage()}
          onConfirm={handlePinConfirm}
          onCancel={handlePinCancel}
        />
      </Show>
    </>
  );
};
