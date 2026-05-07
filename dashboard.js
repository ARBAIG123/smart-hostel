import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const slots = ["7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM"];

let currentUser = null;
let selectedSlot = null;
let slotData = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  currentUser = user;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    document.getElementById('welcomeUser').textContent = `👋 ${userDoc.data().name}`;
    
    const data = userDoc.data();
    const today = new Date().toDateString();
    
    // If slot was booked on a previous day, reset it
    if (data.selectedSlot && data.slotDate !== today) {
      await updateDoc(doc(db, "users", user.uid), { 
        selectedSlot: null, 
        slotDate: null 
      });
    } else if (data.selectedSlot && data.slotDate === today) {
      showLockedSlot(data.selectedSlot);
      return;
    }
  }
  initSlots();
  listenToSlots();
});
function showLockedSlot(slot) {
  initSlots();
  listenToSlots();
  const msg = document.getElementById('dashMessage');
  msg.style.color = '#4ade80';
  msg.textContent = `✅ You have already booked: ${slot}. Slot cannot be changed.`;
  document.getElementById('confirmBox').style.display = 'none';
  
  // Disable all slot cards
  setTimeout(() => {
    document.querySelectorAll('.slot-card').forEach(card => {
      card.style.cursor = 'not-allowed';
      card.style.opacity = '0.5';
      card.onclick = null;
    });
  }, 2000);
}
async function initSlots() {
  for (const slot of slots) {
    const ref = doc(db, "slots", slot);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { count: 0, users: [] });
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
  if (count <= 5) { level = 'low'; badge = `🟢 Low`; }
  else if (count <= 10) { level = 'medium'; badge = `🟡 Medium`; }
  else { level = 'high'; badge = `🔴 Overcrowded`; }

  card.innerHTML = `
    <div class="slot-time">${slot}</div>
    <div class="slot-count">${count} users</div>
    <span class="crowd-badge crowd-${level}">${badge}</span>
  `;
}

function updateBestTime() {
  if (Object.keys(slotData).length === 0) return;
  const best = Object.entries(slotData).reduce((a, b) => a[1] <= b[1] ? a : b);
  document.getElementById('bestTimeText').textContent = `${best[0]} (${best[1]} users)`;
}

window.selectSlot = (slot) => {
  selectedSlot = slot;
  document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('selected'));
  const id = `slot-${slot.replace(/\s|:/g, '-')}`;
  document.getElementById(id)?.classList.add('selected');
  document.getElementById('selectedSlotText').textContent = slot;
  document.getElementById('confirmBox').style.display = 'block';
}

window.confirmSlot = async () => {
  if (!selectedSlot || !currentUser) return;
  const msg = document.getElementById('dashMessage');
  try {
    await updateDoc(doc(db, "slots", selectedSlot), { count: increment(1) });
    await updateDoc(doc(db, "users", currentUser.uid), { 
      selectedSlot: selectedSlot,
      slotDate: new Date().toDateString()
    });
    msg.style.color = '#4ade80';
    msg.textContent = `✅ Checked in for ${selectedSlot}!`;
    document.getElementById('confirmBox').style.display = 'none';
    showLockedSlot(selectedSlot);
  } catch(e) {
    msg.textContent = e.message;
  }
}

window.cancelSlot = () => {
  selectedSlot = null;
  document.getElementById('confirmBox').style.display = 'none';
  document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('selected'));
}

window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
}