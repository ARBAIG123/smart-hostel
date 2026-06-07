import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const slots = [
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM"
];

let currentUser = null;
let selectedSlot = null;
let bookedSlot = null;
let slotData = {};

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = user;

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {

    const data = userDoc.data();

    document.getElementById('welcomeUser').textContent =
      `👋 ${data.name}`;

    const today = new Date().toDateString();

    // reset old slot
    if (data.selectedSlot && data.slotDate !== today) {

      await updateDoc(userRef, {
        selectedSlot: null,
        slotDate: null
      });

    } else if (data.selectedSlot) {

      bookedSlot = data.selectedSlot;

    }
  }

  await initSlots();

  listenToSlots();

  updateBookingUI();
});

async function initSlots() {

  for (const slot of slots) {

    const ref = doc(db, "slots", slot);

    const snap = await getDoc(ref);

    if (!snap.exists()) {

      await setDoc(ref, {
        count: 0,
        users: []
      });
    }
  }
}

function listenToSlots() {

  const grid = document.getElementById('slotsGrid');

  grid.innerHTML = '';

  slots.forEach(slot => {

    const card = document.createElement('div');

    card.className = 'slot-card';

    card.id = `slot-${slot.replace(/\s|:/g, '-')}`;

    card.onclick = () => selectSlot(slot);

    grid.appendChild(card);

    onSnapshot(doc(db, "slots", slot), (snap) => {

      const count = snap.data()?.count || 0;

      slotData[slot] = count;

      updateCard(card, slot, count);

      updateBestTime();
    });
  });
}

function updateCard(card, slot, count) {

  let level, badge;

  if (count <= 5) {
    level = 'low';
    badge = '🟢 Low';
  }

  else if (count <= 10) {
    level = 'medium';
    badge = '🟡 Medium';
  }

  else {
    level = 'high';
    badge = '🔴 Overcrowded';
  }

  const booked =
    bookedSlot === slot
      ? `<div class="booked-label">✅ Your Slot</div>`
      : '';

  card.innerHTML = `
    <div class="slot-time">${slot}</div>

    <div class="slot-count">${count} users</div>

    <span class="crowd-badge crowd-${level}">
      ${badge}
    </span>

    ${booked}
  `;
}

function updateBestTime() {

  if (Object.keys(slotData).length === 0) return;

  const best = Object.entries(slotData)
    .reduce((a, b) => a[1] <= b[1] ? a : b);

  document.getElementById('bestTimeText').textContent =
    `${best[0]} (${best[1]} users)`;
}

window.selectSlot = (slot) => {

  selectedSlot = slot;

  document.querySelectorAll('.slot-card')
    .forEach(c => c.classList.remove('selected'));

  document
    .getElementById(`slot-${slot.replace(/\s|:/g, '-')}`)
    ?.classList.add('selected');

  document.getElementById('selectedSlotText')
    .textContent = slot;

  document.getElementById('confirmBox')
    .style.display = 'block';

  if (bookedSlot && bookedSlot !== slot) {

    const msg = document.getElementById('dashMessage');

    msg.style.color = 'var(--amber)';

    msg.textContent =
      `⚠️ Confirm to change slot from ${bookedSlot} to ${slot}`;
  }
};

window.confirmSlot = async () => {

  if (!selectedSlot || !currentUser) return;

  const msg = document.getElementById('dashMessage');

  try {

    // decrease old slot count
    if (bookedSlot && bookedSlot !== selectedSlot) {

      await updateDoc(
        doc(db, "slots", bookedSlot),
        {
          count: increment(-1)
        }
      );
    }

    // increase new slot count
    if (bookedSlot !== selectedSlot) {

      await updateDoc(
        doc(db, "slots", selectedSlot),
        {
          count: increment(1)
        }
      );
    }

    // update user booking
    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        selectedSlot: selectedSlot,
        slotDate: new Date().toDateString()
      }
    );

    bookedSlot = selectedSlot;

    msg.style.color = 'var(--green)';

    msg.textContent =
      `✅ Slot booked for ${selectedSlot}`;

    document.getElementById('confirmBox')
      .style.display = 'none';

    updateBookingUI();

  } catch(e) {

    msg.style.color = 'var(--red)';

    msg.textContent = e.message;
  }
};

window.cancelSlot = async () => {

  const msg = document.getElementById('dashMessage');

  if (!bookedSlot) {

    msg.style.color = 'var(--amber)';

    msg.textContent = '⚠️ No booked slot to cancel';

    return;
  }

  try {

    // decrease count
    await updateDoc(
      doc(db, "slots", bookedSlot),
      {
        count: increment(-1)
      }
    );

    // clear user booking
    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        selectedSlot: null,
        slotDate: null
      }
    );

    bookedSlot = null;
    selectedSlot = null;

    document.querySelectorAll('.slot-card')
      .forEach(c => c.classList.remove('selected'));

    document.getElementById('confirmBox')
      .style.display = 'none';

    msg.style.color = 'var(--green)';

    msg.textContent =
      '✅ Slot cancelled successfully';

    updateBookingUI();

  } catch(e) {

    msg.style.color = 'var(--red)';

    msg.textContent = e.message;
  }
};

function updateBookingUI() {

  document.querySelectorAll('.slot-card')
    .forEach(card => {

      card.style.opacity = '1';

      card.style.cursor = 'pointer';
    });

  listenToSlots();

  const btn =
    document.getElementById('cancelBtn');

  if (btn) {

    btn.style.display =
      bookedSlot ? 'block' : 'none';
  }
}

window.logoutUser = async () => {

  await signOut(auth);

  window.location.href = 'index.html';
};