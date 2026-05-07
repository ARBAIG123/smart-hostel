import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const slots = ["7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM"];

let html5QrCode = null;
let scanning = true;

// Get nearest time slot to current time
function getNearestSlot() {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const slotMinutes = slots.map(slot => {
    const [time, period] = slot.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  });

  let nearest = 0;
  let minDiff = Infinity;
  slotMinutes.forEach((mins, i) => {
    const diff = Math.abs(mins - current);
    if (diff < minDiff) { minDiff = diff; nearest = i; }
  });

  return slots[nearest];
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }

  // Check admin
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  const currentSlot = getNearestSlot();
  document.getElementById('currentSlotText').textContent = currentSlot;

  // Start scanner
  html5QrCode = new Html5Qrcode("scannerView");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 150 } },
    async (decodedText) => {
      if (!scanning) return;
      scanning = false;
      await html5QrCode.stop();
      await processRollNumber(decodedText.trim(), currentSlot);
    },
    () => {}
  );
});

async function processRollNumber(rollNumber, slot) {
  const resultBox = document.getElementById('scanResult');
  const resultIcon = document.getElementById('resultIcon');
  const resultName = document.getElementById('resultName');
  const resultRoll = document.getElementById('resultRoll');
  const resultSlot = document.getElementById('resultSlot');
  const hint = document.getElementById('scannerHint');

  try {
    // Find student by roll number
    const q = query(collection(db, "users"), where("roll", "==", rollNumber));
    const snap = await getDocs(q);

    if (snap.empty) {
      resultIcon.textContent = '❌';
      resultName.textContent = 'Student Not Found';
      resultRoll.textContent = `Roll: ${rollNumber} — not registered`;
      resultSlot.textContent = 'Please register on the app first';
      resultSlot.style.color = '#f87171';
    } else {
      const student = snap.docs[0].data();
      await updateDoc(doc(db, "slots", slot), { count: increment(1) });

      resultIcon.textContent = '✅';
      resultName.textContent = student.name;
      resultRoll.textContent = `Roll: ${student.roll}`;
      resultSlot.textContent = `Checked in for ${slot}`;
      resultSlot.style.color = '#4ade80';
    }

    hint.style.display = 'none';
    resultBox.style.display = 'block';

  } catch(e) {
    resultIcon.textContent = '❌';
    resultName.textContent = 'Error';
    resultRoll.textContent = e.message;
    resultBox.style.display = 'block';
  }
}

window.resetScanner = async () => {
  scanning = true;
  document.getElementById('scanResult').style.display = 'none';
  document.getElementById('scannerHint').style.display = 'block';

  html5QrCode = new Html5Qrcode("scannerView");
  const currentSlot = getNearestSlot();
  document.getElementById('currentSlotText').textContent = currentSlot;

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 150 } },
    async (decodedText) => {
      if (!scanning) return;
      scanning = false;
      await html5QrCode.stop();
      await processRollNumber(decodedText.trim(), currentSlot);
    },
    () => {}
  );
}

window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
}