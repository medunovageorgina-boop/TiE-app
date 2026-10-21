let activeRP = null;
let rpDatabase = JSON.parse(localStorage.getItem('tie_rp_db') || '[]');
let trashDatabase = JSON.parse(localStorage.getItem('tie_trash_db') || '[]');
let publicBots = JSON.parse(localStorage.getItem('tie_bots_db') || '[]');

function openPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('p-' + pageId);
  if (target) target.classList.add('active');
  
  if (pageId === 'history') renderHistoryList();
  if (pageId === 'trash') renderTrashList();
  if (pageId === 'bots') renderPublicBots();
}

document.addEventListener('DOMContentLoaded', () => {
  // Навигация
  document.getElementById('btn-avatar').onclick = () => openPage('settings');
  document.getElementById('btn-nav-history').onclick = () => openPage('history');
  document.getElementById('btn-nav-new-rp').onclick = () => openPage('new-rp');
  document.getElementById('btn-nav-settings').onclick = () => openPage('settings');
  document.getElementById('btn-nav-bots').onclick = () => openPage('bots');
  document.getElementById('btn-nav-trash').onclick = () => openPage('trash');
  document.getElementById('btn-chat-to-history').onclick = () => openPage('history');
  
  document.querySelectorAll('.btn-back-home').forEach(b => {
    b.onclick = () => openPage('home');
  });

  // Действия
  document.getElementById('btn-create-rp-action').onclick = createNewRP;
  document.getElementById('btn-send-message').onclick = sendChatMessage;
  document.getElementById('chat-header-trigger').onclick = openParamsModal;
  document.getElementById('btn-save-params').onclick = saveParamsChanges;
  document.getElementById('btn-close-params').onclick = () => document.getElementById('params-modal').classList.remove('active');
  document.getElementById('btn-power-lock').onclick = () => document.getElementById('lock-modal').classList.add('active');
  document.getElementById('btn-unlock-app').onclick = unlockAppWithPin;
  document.getElementById('btn-lang-toggle').onclick = rotateLanguage;
  document.getElementById('btn-save-settings').onclick = () => alert('Настройки сохранены');
});

function createNewRP() {
  const name = document.getElementById('rp-name').value.trim() || 'Новая история';
  const desc = document.getElementById('rp-desc').value.trim() || 'Параметры не заданы';
  const isPub = document.getElementById('rp-pub').checked;
  const dateStr = new Date().toLocaleDateString('ru-RU');

  const newEntry = { id: Date.now(), name, desc, date: dateStr, msgs: [] };
  rpDatabase.push(newEntry);
  localStorage.setItem('tie_rp_db', JSON.stringify(rpDatabase));

  if (isPub) {
    publicBots.push({ name, desc, author: 'Пользователь' });
    localStorage.setItem('tie_bots_db', JSON.stringify(publicBots));
  }

  document.getElementById('rp-name').value = '';
  document.getElementById('rp-desc').value = '';
  launchChatSession(newEntry.id);
}

function renderHistoryList() {
  const box = document.getElementById('history-list');
  box.innerHTML = rpDatabase.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">Историй пока нет.</p>' : '';
  
  rpDatabase.forEach(item => {
    const card = document.createElement('div');
    card.className = 'btn-card';
    card.style.flexDirection = 'row';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    card.innerHTML = `
      <div onclick="launchChatSession(${item.id})" style="flex:1;">
        <strong>${item.name}</strong><br>
        <small style="color:var(--text-muted);">${item.date}</small>
      </div>
      <button onclick="moveToTrash(${item.id})" style="background:var(--danger); border:none; color:#fff; padding:8px 12px; border-radius:4px; cursor:pointer;">🗑</button>
    `;
    box.appendChild(card);
  });
}

function launchChatSession(id) {
  activeRP = rpDatabase.find(x => x.id === id);
  document.getElementById('chat-title-text').innerText = activeRP.name;
  renderChatMessages();
  openPage('chat');
}

function renderChatMessages() {
  const box = document.getElementById('chat-messages-box');
  box.innerHTML = activeRP.msgs.length === 0 ? '<div class="msg-bubble bot">Привет! Начнем нашу историю без цензуры.</div>' : '';
  
  activeRP.msgs.forEach((m, idx) => {
    const isBot = m.role === 'bot';
    box.innerHTML += `
      <div class="msg-bubble ${m.role}">
        ${m.text}
        ${isBot ? `
          <div class="msg-actions">
            <button class="report-btn" onclick="reportMessage(${idx})">⚠️ Жалоба</button>
            <span style="color:var(--accent-beige)">Правки: ${m.edits || 0}/9</span>
          </div>
        ` : ''}
      </div>
    `;
  });
  box.scrollTop = box.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chat-input-field');
  const val = input.value.trim();
  if (!val) return;

  activeRP.msgs.push({ role: 'user', text: val });
  activeRP.msgs.push({ role: 'bot', text: 'Понял тебя. Продолжаем отыгрыш по твоим правилам.', edits: 0 });

  input.value = '';
  localStorage.setItem('tie_rp_db', JSON.stringify(rpDatabase));
  renderChatMessages();
}

function reportMessage(idx) {
  const msg = activeRP.msgs[idx];
  if ((msg.edits || 0) < 9) {
    msg.edits = (msg.edits || 0) + 1;
    msg.text = '[Сообщение перегенерировано по жалобе]';
    localStorage.setItem('tie_rp_db', JSON.stringify(rpDatabase));
    renderChatMessages();
  } else {
    alert('Достигнут лимит правок (9/9) для этого сообщения.');
  }
}

function openParamsModal() {
  document.getElementById('edit-params-field').value = activeRP.desc;
  document.getElementById('params-modal').classList.add('active');
}

function saveParamsChanges() {
  activeRP.desc = document.getElementById('edit-params-field').value;
  localStorage.setItem('tie_rp_db', JSON.stringify(rpDatabase));
  document.getElementById('params-modal').classList.remove('active');
  alert('Параметры успешно обновлены!');
}

function moveToTrash(id) {
  const item = rpDatabase.find(x => x.id === id);
  trashDatabase.push({ ...item, deletedAt: Date.now() });
  rpDatabase = rpDatabase.filter(x => x.id !== id);

  localStorage.setItem('tie_rp_db', JSON.stringify(rpDatabase));
  localStorage.setItem('tie_trash_db', JSON.stringify(trashDatabase));
  renderHistoryList();
}

function renderTrashList() {
  const box = document.getElementById('trash-items-box');
  box.innerHTML = trashDatabase.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">Корзина пуста.</p>' : '';
  
  const now = Date.now();
  trashDatabase.forEach(item => {
    const hoursLeft = Math.max(0, 86 - Math.floor((now - item.deletedAt) / (1000 * 60 * 60)));
    box.innerHTML += `
      <div class="btn-card">
        <strong>${item.name}</strong>
        <small style="color:var(--text-muted)">Осталось хранения: ${hoursLeft} ч.</small>
      </div>
    `;
  });
}

function renderPublicBots() {
  const box = document.getElementById('public-bots-box');
  box.innerHTML = publicBots.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">Опубликованных ботов пока нет.</p>' : '';
  
  publicBots.forEach(bot => {
    box.innerHTML += `
      <div class="btn-card">
        <strong>🤖 ${bot.name}</strong>
        <small style="color:var(--text-muted)">${bot.desc}</small>
      </div>
    `;
  });
}

function unlockAppWithPin() {
  const pin = document.getElementById('app-pin-code').value;
  const entered = document.getElementById('pin-unlock-field').value;
  if (entered === pin) {
    document.getElementById('lock-modal').classList.remove('active');
    document.getElementById('pin-unlock-field').value = '';
  } else {
    alert('Неверный PIN-код!');
  }
}

const langList = ['RU', 'EN', 'UK', 'DE', 'ZH'];
let currentLangIdx = 0;
function rotateLanguage() {
  currentLangIdx = (currentLangIdx + 1) % langList.length;
  document.getElementById('lang-indicator').innerText = langList[currentLangIdx];
}
