import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, getDoc, onSnapshot, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const rooms = [
  { id: "101", floor: "Floor 1" },
  { id: "102", floor: "Floor 1" },
  { id: "103", floor: "Floor 1" },
  { id: "104", floor: "Floor 1" },
  { id: "201", floor: "Floor 2" },
  { id: "202", floor: "Floor 2" },
  { id: "203", floor: "Floor 2" },
  { id: "204", floor: "Floor 2" },
  { id: "301", floor: "Floor 3" },
  { id: "302", floor: "Floor 3" },
  { id: "303", floor: "Floor 3" },
  { id: "304", floor: "Floor 3" },
];

const slots = ["7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM"];

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }
  loadAdminRooms();
  loadAdminSlots();
});

function loadAdminRooms() {
  const grid = document.getElementById('adminRoomsGrid');
  grid.innerHTML = '';
  rooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'admin-room-card';
    card.id = `admin-room-${room.id}`;
    grid.appendChild(card);
    onSnapshot(doc(db, "rooms", room.id), (snap) => {
      const available = snap.data()?.available ?? true;
      card.className = `admin-room-card ${available ? 'available' : 'full'}`;
      card.innerHTML = `
        <div class="room-number">Room ${room.id}</div>
        <div class="room-floor">${room.floor}</div>
        <span class="room-status ${available ? 'status-available' : 'status-full'}">
          ${available ? '🟢 Available' : '🔴 Full'}
        </span><br/>
        <button class="toggle-btn ${available ? 'mark-full' : 'mark-available'}"
          onclick="toggleRoom('${room.id}', ${available})">
          ${available ? 'Mark as Full' : 'Mark as Available'}
        </button>
      `;
    });
  });
}

function loadAdminSlots() {
  const grid = document.getElementById('adminSlotsGrid');
  grid.innerHTML = '';
  slots.forEach(slot => {
    const card = document.createElement('div');
    card.className = 'admin-slot-card';
    grid.appendChild(card);
    onSnapshot(doc(db, "slots", slot), (snap) => {
      const count = snap.data()?.count || 0;
      let badge = count <= 5 ? '🟢' : count <= 10 ? '🟡' : '🔴';
      card.innerHTML = `
        <div class="slot-time">${slot}</div>
        <div class="slot-count">${badge} ${count} users</div>
      `;
    });
  });
}

window.toggleRoom = async (roomId, currentStatus) => {
  const msg = document.getElementById('adminMessage');
  try {
    await updateDoc(doc(db, "rooms", roomId), { available: !currentStatus });
    msg.style.color = 'var(--green)';
    msg.textContent = `Room ${roomId} updated!`;
    setTimeout(() => msg.textContent = '', 2000);
  } catch(e) {
    msg.style.color = 'var(--red)';
    msg.textContent = e.message;
  }
};

window.resetAllSlots = async () => {
  const msg = document.getElementById('adminMessage');
  try {
    const batch = writeBatch(db);
    slots.forEach(slot => {
      batch.update(doc(db, "slots", slot), { count: 0 });
    });
    await batch.commit();
    msg.style.color = 'var(--green)';
    msg.textContent = '✅ All slot counts reset!';
    setTimeout(() => msg.textContent = '', 2000);
  } catch(e) {
    msg.style.color = 'var(--red)';
    msg.textContent = e.message;
  }
};

window.showTab = (tab) => {
  document.getElementById('bedsTab').style.display  = tab === 'beds'  ? 'block' : 'none';
  document.getElementById('queueTab').style.display = tab === 'queue' ? 'block' : 'none';
  document.querySelectorAll('.admin-tabs .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'beds') || (i === 1 && tab === 'queue'));
  });
};

window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
};
