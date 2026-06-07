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

  // show name in navbar
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    document.getElementById('welcomeUser').textContent = `👋 ${userDoc.data().name}`;
  }

  initRooms();
  listenToRooms();
});

async function initRooms() {
  for (const room of rooms) {
    const ref  = doc(db, "rooms", room.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // beds: array of 4 booleans (true = occupied)
      await setDoc(ref, { available: true, floor: room.floor, beds: [false, false, false, false] });
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
      const data      = snap.data();
      const available = data?.available ?? true;
      // support both old boolean model and new beds-array model
      const beds      = data?.beds ?? (available ? [false,false,false,false] : [true,true,true,true]);
      const vacantCount = beds.filter(b => !b).length;

      card.className = `room-card ${available ? 'available' : 'full'}`;

      const dots = beds.map(occupied =>
        `<div class="bed-dot ${occupied ? 'occupied' : 'vacant'}"></div>`
      ).join('');

      card.innerHTML = `
        <div class="room-number">Room ${room.id}</div>
        <div class="room-floor">${room.floor}</div>
        <div class="bed-dots">${dots}</div>
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:6px;">
          ${beds.filter(b=>b).length}/4 beds occupied
        </div>
        <span class="room-status ${available ? 'status-available' : 'status-full'}">
          ${available ? `🟢 ${vacantCount} Vacant` : '🔴 Full'}
        </span>
      `;

      updateSummary();
    });
  });
}

function updateSummary() {
  const total     = rooms.length;
  const available = document.querySelectorAll('.room-card.available').length;
  const full      = total - available;

  document.getElementById('totalRooms').textContent     = total;
  document.getElementById('availableRooms').textContent = available;
  document.getElementById('occupiedRooms').textContent  = full;
}

window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
};
