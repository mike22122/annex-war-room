// Annex War Room emergency pick-entry fix.
// Captures Draft/Gone button clicks even if the inline onclick attribute is malformed.
document.addEventListener('click', function (event) {
  const btn = event.target.closest('button.smallbtn');
  if (!btn) return;
  const label = (btn.textContent || '').trim();
  if (label !== 'Draft' && label !== 'Gone') return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const row = btn.closest('tr');
  const nameEl = row ? row.querySelector('.player') : null;
  const playerName = nameEl ? nameEl.textContent.trim() : '';
  if (!playerName) {
    alert('Could not identify this player.');
    return;
  }

  try {
    const mine = label === 'Draft';
    if (typeof window.recordPick === 'function') {
      window.recordPick(playerName, mine, btn);
    } else if (typeof window.draft === 'function') {
      window.draft(playerName, mine);
    } else {
      throw new Error('Draft function is unavailable');
    }
  } catch (err) {
    console.error(err);
    alert('Could not record pick: ' + err.message);
  }
}, true);
