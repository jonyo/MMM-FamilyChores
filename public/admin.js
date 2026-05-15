// API base URL
const API_BASE = '/MMM-FamilyChores';

function escapeHtml(raw) {
  const div = document.createElement('div');
  div.textContent = raw;
  return div.innerHTML;
}

// Generate a random light/pastel color suitable for display on a dark background
function generateRandomLightColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 55 + Math.floor(Math.random() * 20);
  const lightness = 60 + Math.floor(Math.random() * 15);

  // Convert HSL to hex
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  const hue2rgb = (p, q, t) => {
    let tVal = t;
    if (tVal < 0) tVal += 1;
    if (tVal > 1) tVal -= 1;
    if (tVal < 1 / 6) return p + (q - p) * 6 * tVal;
    if (tVal < 1 / 2) return q;
    if (tVal < 2 / 3) return p + (q - p) * (2 / 3 - tVal) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
    renderRotatingChores();
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

  // Add rotating chore
  document.getElementById('addRotatingChoreBtn').addEventListener('click', () => {
    openChoreModal('rotating');
  });

  // Person form
  document.getElementById('personForm').addEventListener('submit', handlePersonSubmit);

  // Chore form
  document.getElementById('choreForm').addEventListener('submit', handleChoreSubmit);

  // Copy form
  document.getElementById('copyForm').addEventListener('submit', handleCopySubmit);

  // Randomize color button
  document.getElementById('randomizeColorBtn').addEventListener('click', () => {
    document.getElementById('personColor').value = generateRandomLightColor();
  });

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

  // Show info icon if no people exist
  const addPersonInfo = document.getElementById('addPersonInfo');
  if (addPersonInfo) {
    addPersonInfo.style.display = choreData.people.length === 0 ? 'inline' : 'none';
  }

  // Show rotating chores section if people exist
  const rotatingChoresSection = document.getElementById('rotatingChoresSection');
  if (rotatingChoresSection) {
    rotatingChoresSection.style.display = choreData.people.length > 0 ? 'block' : 'none';
  }

  choreData.people.forEach((person) => {
    const card = document.createElement('div');
    card.className = 'item-card';

    // Get personal chores for this person
    const personalChores = choreData.chores.filter(
      (chore) => chore.type === 'personal' && chore.assignedTo === person.id
    );

    let choresHtml = '';
    choresHtml += `
      <div class="person-chores-header">
        <h4>${escapeHtml(person.name)}'s Personal Chores</h4>
        <div class="person-chores-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="openChoreModal('personal', '${person.id}')">Add Chore</button>
          ${
            personalChores.length > 0
              ? `
            <button type="button" class="btn btn-secondary btn-sm" onclick="openCopyModal('${person.id}')">Copy Chores</button>
          `
              : ''
          }
        </div>
      </div>
    `;

    if (personalChores.length > 0) {
      choresHtml += '<div class="person-chores">';
      personalChores.forEach((chore) => {
        const skipDays =
          chore.skipDays && chore.skipDays.length > 0
            ? chore.skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
            : 'None';
        choresHtml += `
          <div class="chore-item">
            <div class="chore-info">
              <h4>${escapeHtml(chore.name)}</h4>
              ${chore.deadline ? `<p class="deadline">Deadline: ${chore.deadline}</p>` : ''}
              <p class="skip-days">Skip days: ${skipDays}</p>
            </div>
            <div class="chore-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="editChore('${chore.id}')">Edit</button>
              <button type="button" class="btn btn-danger btn-sm" onclick="deleteChore('${chore.id}')">Delete</button>
            </div>
          </div>
        `;
      });
      choresHtml += '</div>';
    } else {
      choresHtml +=
        '<div class="person-chores"><p class="empty-message">No personal chores yet.</p></div>';
    }

    card.innerHTML = `
      <div class="person-header">
        <div class="item-info">
          <h3>${escapeHtml(person.name)} <span class="color-badge" style="background-color: ${person.color}"></span></h3>
          <p>ID: ${person.id}</p>
        </div>
        <div class="item-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="editPerson('${person.id}')">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deletePerson('${person.id}')">Delete</button>
        </div>
      </div>
      ${choresHtml}
    `;
    container.appendChild(card);
  });
}

// Render rotating chores list
function renderRotatingChores() {
  const container = document.getElementById('rotatingChoresList');
  if (!container) return;
  container.innerHTML = '';

  const rotatingChores = choreData.chores.filter((chore) => chore.type === 'rotating');

  rotatingChores.forEach((chore) => {
    const card = document.createElement('div');
    card.className = 'item-card';

    // Get rotation list names
    const rotationNames = chore.rotation
      .map((personId) => {
        const person = choreData.people.find((p) => p.id === personId);
        return person ? escapeHtml(person.name) : 'Unknown';
      })
      .join(', ');

    // Check if rotation includes everyone
    const includesEveryone =
      chore.rotation.length === choreData.people.length &&
      chore.rotation.every((personId) => choreData.people.some((p) => p.id === personId));

    const rotationText = includesEveryone ? 'Everyone' : rotationNames;

    // Get current assignee
    const currentPersonId = chore.rotation[chore.rotatingIndex ?? 0];
    const currentPerson = choreData.people.find((p) => p.id === currentPersonId);
    const currentAssignee = currentPerson ? escapeHtml(currentPerson.name) : 'Unassigned';

    const skipDays =
      chore.skipDays && chore.skipDays.length > 0
        ? chore.skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
        : 'None';

    card.innerHTML = `
      <div class="item-info">
        <h3>${escapeHtml(chore.name)} <span class="chore-type-badge rotating">Rotating</span></h3>
        <p>Current: ${currentAssignee}</p>
        <p>Rotation: ${rotationText}</p>
        ${chore.deadline ? `<p class="deadline">Deadline: ${chore.deadline}</p>` : ''}
        <p class="skip-days">Skip days: ${skipDays}</p>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary" onclick="editChore('${chore.id}')">Edit</button>
        <button type="button" class="btn btn-danger" onclick="deleteChore('${chore.id}')">Delete</button>
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
    document.getElementById('personColor').value = generateRandomLightColor();
  }

  modal.classList.add('active');
}

// Chore modal
function openChoreModal(type = null, personId = null, chore = null) {
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
    label.innerHTML = `<input type="checkbox" value="${person.id}" class="rotation-checkbox"> ${escapeHtml(person.name)}`;
    rotationList.appendChild(label);
  });

  const assignedToGroup = document.getElementById('assignedToGroup');
  const rotationGroup = document.getElementById('rotationGroup');

  if (chore) {
    // Editing existing chore
    title.textContent = 'Edit Chore';
    document.getElementById('choreId').value = chore.id;
    document.getElementById('choreName').value = chore.name;
    document.getElementById('choreType').value = chore.type;
    document.getElementById('choreDeadline').value = chore.deadline || '';
    document.getElementById('skipDayVisibility').value =
      chore.skipDayVisibility || 'show-if-overdue';

    // Skip days
    document.querySelectorAll('.skipDay').forEach((checkbox) => {
      checkbox.checked = chore.skipDays?.includes(checkbox.value);
    });

    // Show/hide fields based on type
    if (chore.type === 'personal') {
      assignedToGroup.style.display = 'block';
      rotationGroup.style.display = 'none';
      document.getElementById('assignedTo').value = chore.assignedTo;
    } else if (chore.type === 'rotating') {
      assignedToGroup.style.display = 'none';
      rotationGroup.style.display = 'block';
      document.querySelectorAll('.rotation-checkbox').forEach((checkbox) => {
        checkbox.checked = chore.rotation?.includes(checkbox.value);
      });
    }
  } else {
    // Adding new chore with type locked
    title.textContent = type === 'personal' ? 'Add Personal Chore' : 'Add Rotating Chore';
    form.reset();
    document.getElementById('choreId').value = '';
    document.getElementById('choreType').value = type;
    document.getElementById('skipDayVisibility').value = 'show-if-overdue';

    // Show/hide fields based on locked type
    if (type === 'personal') {
      assignedToGroup.style.display = 'block';
      rotationGroup.style.display = 'none';
      if (personId) {
        document.getElementById('assignedTo').value = personId;
      }
    } else if (type === 'rotating') {
      assignedToGroup.style.display = 'none';
      rotationGroup.style.display = 'block';
    }
  }

  modal.classList.add('active');
}

// Close modals
function closeModals() {
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.classList.remove('active');
  });
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
  const deadlineRaw = document.getElementById('choreDeadline').value;
  const deadline = deadlineRaw.trim() || undefined;
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

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData?.error) {
        // specific message like a field validation error
        alert(`Problem saving chore: ${errorData.error}`);
        // early exit to avoid showing 2 error messages (one from API and one generic)
        return;
      }
      throw new Error('Failed to save chore');
    }

    closeModals();
    await loadData();
  } catch (error) {
    // Error could be a network error or JSON parsing error
    console.error('Error saving chore:', error);
    alert(`Failed to save chore. Please try again.`);
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
  if (chore) openChoreModal(null, null, chore);
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

// Copy modal
window.openCopyModal = (fromPersonId) => {
  const modal = document.getElementById('copyModal');
  const fromPerson = choreData.people.find((p) => p.id === fromPersonId);

  if (!fromPerson) return;

  // Set from person info
  document.getElementById('copyFromPersonId').value = fromPersonId;
  document.getElementById('copyFromPersonName').textContent = fromPerson.name;

  // Populate "to" dropdown (exclude from person)
  const toSelect = document.getElementById('copyToPersonId');
  toSelect.innerHTML = '';
  choreData.people
    .filter((p) => p.id !== fromPersonId)
    .forEach((person) => {
      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = person.name;
      toSelect.appendChild(option);
    });

  // Get personal chores for from person
  const personalChores = choreData.chores.filter(
    (chore) => chore.type === 'personal' && chore.assignedTo === fromPersonId
  );

  // Populate chores list with checkboxes (all checked by default)
  const choresList = document.getElementById('copyChoresList');
  choresList.innerHTML = '';
  personalChores.forEach((chore) => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${chore.id}" class="copy-chore-checkbox" checked> ${escapeHtml(chore.name)}`;
    choresList.appendChild(label);
  });

  modal.classList.add('active');
};

// Handle copy form submit
async function handleCopySubmit(e) {
  e.preventDefault();

  const fromPersonId = document.getElementById('copyFromPersonId').value;
  const toPersonId = document.getElementById('copyToPersonId').value;

  // Get selected chore IDs
  const selectedChoreIds = [];
  document.querySelectorAll('.copy-chore-checkbox:checked').forEach((checkbox) => {
    selectedChoreIds.push(checkbox.value);
  });

  if (selectedChoreIds.length === 0) {
    alert('Please select at least one chore to copy.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/copy-chores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromPersonId,
        toPersonId,
        choreIds: selectedChoreIds,
      }),
    });

    if (!response.ok) throw new Error('Failed to copy chores');

    closeModals();
    await loadData();
  } catch (error) {
    console.error('Error copying chores:', error);
    alert('Failed to copy chores. Please try again.');
  }
}
