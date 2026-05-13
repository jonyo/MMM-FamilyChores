// API base URL
const API_BASE = '/MMM-FamilyChores';

// State
let choreData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
});

// Load data from API
async function loadData() {
  try {
    const response = await fetch(`${API_BASE}/data`);
    if (!response.ok) throw new Error('Failed to load data');
    choreData = await response.json();
    renderPeople();
    renderChores();
    renderSystemState();
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Failed to load data. Please refresh the page.');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Add person
  document.getElementById('addPersonBtn').addEventListener('click', () => {
    openPersonModal();
  });

  // Add chore
  document.getElementById('addChoreBtn').addEventListener('click', () => {
    openChoreModal();
  });

  // Person form
  document.getElementById('personForm').addEventListener('submit', handlePersonSubmit);

  // Chore form
  document.getElementById('choreForm').addEventListener('submit', handleChoreSubmit);

  // Chore type change
  document.getElementById('choreType').addEventListener('change', handleChoreTypeChange);

  // Cancel buttons
  document.querySelectorAll('.cancel-btn').forEach((btn) => {
    btn.addEventListener('click', closeModals);
  });

  // Modal close on outside click
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModals();
    });
  });

  // Backup
  document.getElementById('backupBtn').addEventListener('click', downloadBackup);

  // Restore
  document.getElementById('restoreFile').addEventListener('change', handleRestore);

  // Force daily reset
  document.getElementById('resetDailyBtn').addEventListener('click', handleForceReset);

  // Info icon tooltips
  document.querySelectorAll('.info-icon').forEach((icon) => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle visibility on click
      const isVisible = icon.style.getPropertyValue('--tooltip-visible') === 'true';
      icon.style.setProperty('--tooltip-visible', isVisible ? 'false' : 'true');
    });
  });

  // Close tooltips when clicking elsewhere
  document.addEventListener('click', () => {
    document.querySelectorAll('.info-icon').forEach((icon) => {
      icon.style.setProperty('--tooltip-visible', 'false');
    });
  });
}

// Render people list
function renderPeople() {
  const container = document.getElementById('peopleList');
  container.innerHTML = '';

  choreData.people.forEach((person) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-info">
        <h3>${person.name} <span class="color-badge" style="background-color: ${person.color}"></span></h3>
        <p>ID: ${person.id}</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary" onclick="editPerson('${person.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deletePerson('${person.id}')">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render chores list
function renderChores() {
  const container = document.getElementById('choresList');
  container.innerHTML = '';

  choreData.chores.forEach((chore) => {
    const card = document.createElement('div');
    card.className = 'item-card';

    let assignment = '';
    if (chore.type === 'personal') {
      const person = choreData.people.find((p) => p.id === chore.assignedTo);
      assignment = person ? `Assigned to: ${person.name}` : 'Unassigned';
    } else if (chore.type === 'rotating') {
      const currentPerson = chore.rotation[chore.rotatingIndex];
      const person = choreData.people.find((p) => p.id === currentPerson);
      assignment = person ? `Current: ${person.name}` : 'Unassigned';
    }

    const skipDays =
      chore.skipDays && chore.skipDays.length > 0
        ? chore.skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
        : 'None';

    card.innerHTML = `
      <div class="item-info">
        <h3>${chore.name} <span class="chore-type-badge ${chore.type}">${chore.type}</span></h3>
        <p>${assignment}</p>
        ${chore.deadline ? `<p class="deadline">Deadline: ${chore.deadline}</p>` : ''}
        <p class="skip-days">Skip days: ${skipDays}</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary" onclick="editChore('${chore.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteChore('${chore.id}')">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render system state
function renderSystemState() {
  document.getElementById('lastResetDate').textContent = choreData.lastResetDate || 'Never';
}

// Person modal
function openPersonModal(person = null) {
  const modal = document.getElementById('personModal');
  const title = document.getElementById('personModalTitle');
  const form = document.getElementById('personForm');

  if (person) {
    title.textContent = 'Edit Person';
    document.getElementById('personId').value = person.id;
    document.getElementById('personName').value = person.name;
    document.getElementById('personColor').value = person.color;
  } else {
    title.textContent = 'Add Person';
    form.reset();
    document.getElementById('personId').value = '';
    document.getElementById('personColor').value = '#FF6B6B';
  }

  modal.classList.add('active');
}

// Chore modal
function openChoreModal(chore = null) {
  const modal = document.getElementById('choreModal');
  const title = document.getElementById('choreModalTitle');
  const form = document.getElementById('choreForm');

  // Populate people dropdowns
  const assignedToSelect = document.getElementById('assignedTo');
  assignedToSelect.innerHTML = '';
  choreData.people.forEach((person) => {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = person.name;
    assignedToSelect.appendChild(option);
  });

  // Populate rotation checkboxes
  const rotationList = document.getElementById('rotationList');
  rotationList.innerHTML = '';
  choreData.people.forEach((person) => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${person.id}" class="rotation-checkbox"> ${person.name}`;
    rotationList.appendChild(label);
  });

  if (chore) {
    title.textContent = 'Edit Chore';
    document.getElementById('choreId').value = chore.id;
    document.getElementById('choreName').value = chore.name;
    document.getElementById('choreType').value = chore.type;
    document.getElementById('choreDeadline').value = chore.deadline || '';
    document.getElementById('skipDayVisibility').value =
      chore.skipDayVisibility || 'show_if_overdue';

    // Skip days
    document.querySelectorAll('.skipDay').forEach((checkbox) => {
      checkbox.checked = chore.skipDays?.includes(checkbox.value);
    });

    handleChoreTypeChange();

    if (chore.type === 'personal') {
      document.getElementById('assignedTo').value = chore.assignedTo;
    } else if (chore.type === 'rotating') {
      document.querySelectorAll('.rotation-checkbox').forEach((checkbox) => {
        checkbox.checked = chore.rotation?.includes(checkbox.value);
      });
    }
  } else {
    title.textContent = 'Add Chore';
    form.reset();
    document.getElementById('choreId').value = '';
    document.getElementById('choreType').value = 'personal';
    document.getElementById('skipDayVisibility').value = 'show_if_overdue';
    handleChoreTypeChange();
  }

  modal.classList.add('active');
}

// Close modals
function closeModals() {
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.classList.remove('active');
  });
}

// Handle chore type change
function handleChoreTypeChange() {
  const type = document.getElementById('choreType').value;
  const assignedToGroup = document.getElementById('assignedToGroup');
  const rotationGroup = document.getElementById('rotationGroup');

  if (type === 'personal') {
    assignedToGroup.style.display = 'block';
    rotationGroup.style.display = 'none';
  } else {
    assignedToGroup.style.display = 'none';
    rotationGroup.style.display = 'block';
  }
}

// Handle person form submit
async function handlePersonSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('personId').value;
  const name = document.getElementById('personName').value;
  const color = document.getElementById('personColor').value;

  try {
    let response;
    if (id) {
      // Update
      response = await fetch(`${API_BASE}/people/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
    } else {
      // Create
      response = await fetch(`${API_BASE}/people`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
    }

    if (!response.ok) throw new Error('Failed to save person');

    closeModals();
    await loadData();
  } catch (error) {
    console.error('Error saving person:', error);
    alert('Failed to save person. Please try again.');
  }
}

// Handle chore form submit
async function handleChoreSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('choreId').value;
  const name = document.getElementById('choreName').value;
  const type = document.getElementById('choreType').value;
  const deadline = document.getElementById('choreDeadline').value;
  const skipDayVisibility = document.getElementById('skipDayVisibility').value;

  // Skip days
  const skipDays = [];
  document.querySelectorAll('.skipDay:checked').forEach((checkbox) => {
    skipDays.push(checkbox.value);
  });

  let assignedTo = null;
  let rotation = null;

  if (type === 'personal') {
    assignedTo = document.getElementById('assignedTo').value;
  } else {
    rotation = [];
    document.querySelectorAll('.rotation-checkbox:checked').forEach((checkbox) => {
      rotation.push(checkbox.value);
    });
  }

  try {
    let response;
    if (id) {
      // Update
      response = await fetch(`${API_BASE}/chores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          assignedTo,
          rotation,
          deadline,
          skipDays,
          skipDayVisibility,
        }),
      });
    } else {
      // Create
      response = await fetch(`${API_BASE}/chores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          assignedTo,
          rotation,
          deadline,
          skipDays,
          skipDayVisibility,
        }),
      });
    }

    if (!response.ok) throw new Error('Failed to save chore');

    closeModals();
    await loadData();
  } catch (error) {
    console.error('Error saving chore:', error);
    alert('Failed to save chore. Please try again.');
  }
}

// Edit person (global function for onclick)
window.editPerson = (id) => {
  const person = choreData.people.find((p) => p.id === id);
  if (person) openPersonModal(person);
};

// Delete person (global function for onclick)
window.deletePerson = async (id) => {
  if (
    !confirm(
      'Are you sure you want to delete this person? This will also remove all their assigned chores.'
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/people/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete person');

    await loadData();
  } catch (error) {
    console.error('Error deleting person:', error);
    alert('Failed to delete person. Please try again.');
  }
};

// Edit chore (global function for onclick)
window.editChore = (id) => {
  const chore = choreData.chores.find((c) => c.id === id);
  if (chore) openChoreModal(chore);
};

// Delete chore (global function for onclick)
window.deleteChore = async (id) => {
  if (!confirm('Are you sure you want to delete this chore?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/chores/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete chore');

    await loadData();
  } catch (error) {
    console.error('Error deleting chore:', error);
    alert('Failed to delete chore. Please try again.');
  }
};

// Download backup
async function downloadBackup() {
  try {
    const response = await fetch(`${API_BASE}/backup`);
    if (!response.ok) throw new Error('Failed to create backup');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
      'family-chores-backup.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading backup:', error);
    alert('Failed to download backup. Please try again.');
  }
}

// Handle restore
async function handleRestore(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const response = await fetch(`${API_BASE}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to restore data');

    alert('Data restored successfully!');
    await loadData();
  } catch (error) {
    console.error('Error restoring data:', error);
    alert('Failed to restore data. Please check the file format and try again.');
  }

  // Reset file input
  e.target.value = '';
}

// Handle force daily reset
async function handleForceReset() {
  if (
    !confirm(
      'Are you sure you want to force a daily reset? This will reset all chore states for the new day.'
    )
  ) {
    return;
  }

  try {
    // Update lastResetDate to yesterday to trigger reset
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    choreData.lastResetDate = yesterdayStr;

    const response = await fetch(`${API_BASE}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(choreData),
    });

    if (!response.ok) throw new Error('Failed to force reset');

    alert('Daily reset triggered successfully! The data will be updated on the next sync.');
    await loadData();
  } catch (error) {
    console.error('Error forcing reset:', error);
    alert('Failed to force reset. Please try again.');
  }
}
