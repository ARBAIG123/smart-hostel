import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { collection, onSnapshot, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  initRooms();
  listenToRooms();
});

async function initRooms() {
  for (const room of rooms) {
    const ref = doc(db, "rooms", room.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { available: true, floor: room.floor });
    }
  }
}

function listenToRooms() {
  const grid = document.getElementById('roomsGrid');
  grid.innerHTML = '';

  rooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.id = `room-${room.id}`;
    grid.appendChild(card);

    onSnapshot(doc(db, "rooms", room.id), (snap) => {
      const data = snap.data();
      const available = data?.available ?? true;
      card.className = `room-card ${available ? 'available' : 'full'}`;
      card.innerHTML = `
        <div class="room-number">Room ${room.id}</div>
        <div class="room-floor">${room.floor}</div>
        <span class="room-status ${available ? 'status-available' : 'status-full'}">
          ${available ? '🟢 Available' : '🔴 Full'}
        </span>
      `;
      updateSummary();
    });
  });
}

function updateSummary() {
  const cards = document.querySelectorAll('.room-card');
  const total = cards.length;
  const available = document.querySelectorAll('.room-card.available').length;
  const occupied = total - available;
  document.getElementById('totalBeds').textContent = total;
  document.getElementById('availableBeds').textContent = available;
  document.getElementById('occupiedBeds').textContent = occupied;
}

window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
}