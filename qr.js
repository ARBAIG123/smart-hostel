import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return;

  const data = userDoc.data();
  document.getElementById('qrName').textContent = data.name;
  document.getElementById('qrRoll').textContent = `Roll: ${data.roll}`;

  const qrData = JSON.stringify({
    uid: user.uid,
    name: data.name,
    roll: data.roll,
    email: data.email
  });

  new QRCode(document.getElementById('qrCode'), {
    text: qrData,
    width: 220,
    height: 220,
    colorDark: "#1a2f5a",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
});

window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
}