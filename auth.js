import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

window.showLogin = () => {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('signupTab').classList.remove('active');
}

window.showSignup = () => {
  document.getElementById('signupForm').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupTab').classList.add('active');
  document.getElementById('loginTab').classList.remove('active');
}

window.registerUser = async () => {
  const name = document.getElementById('signupName').value;
  const roll = document.getElementById('signupRoll').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const role = 'student';
  const msg = document.getElementById('authMessage');

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), { name, roll, email, role });
    msg.style.color = '#4ade80';
    msg.textContent = 'Account created! Redirecting...';
    setTimeout(() => {
      window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
    }, 1500);
  } catch (e) {
    msg.textContent = e.message;
  }
}

window.loginUser = async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('authMessage');

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    const role = userDoc.data()?.role || 'student';
    msg.style.color = '#4ade80';
    msg.textContent = 'Login successful! Redirecting...';
    setTimeout(() => {
      window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
    }, 1500);
  } catch (e) {
    msg.textContent = e.message;
  }
}
window.toggleTheme = () => {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('themeToggle');
  btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

// Remember theme on reload
window.addEventListener('load', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }
});