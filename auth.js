import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// ── helpers ──
function showMsg(text, isError = true) {
  const msg = document.getElementById('authMessage');
  msg.textContent = text;
  msg.style.color = isError ? 'var(--red)' : 'var(--green)';
  msg.classList.remove('shake');
  void msg.offsetWidth; // reflow to retrigger animation
  if (isError) msg.classList.add('shake');
}

// ── register ──
window.registerUser = async () => {
  const name     = document.getElementById('signupName').value.trim();
  const roll     = document.getElementById('signupRoll').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  // get selected role from chip
  const roleChip = document.querySelector('.role-chip.selected');
  const role = roleChip ? roleChip.dataset.role : 'student';

  if (!name || !roll || !email || !password) {
    showMsg('Please fill in all fields.'); return;
  }
  if (password.length < 8) {
    showMsg('Password must be at least 8 characters.'); return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), { name, roll, email, role });
    showMsg('✅ Account created! Redirecting...', false);
    setTimeout(() => {
      window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
    }, 1500);
  } catch (e) {
    showMsg(e.message);
  }
};

// ── login ──
window.loginUser = async () => {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showMsg('Please enter your email and password.'); return;
  }

  try {
    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    const role    = userDoc.data()?.role || 'student';
    showMsg('✅ Login successful! Redirecting...', false);
    setTimeout(() => {
      window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
    }, 1200);
  } catch (e) {
    showMsg(e.message);
  }
};
