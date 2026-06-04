import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFSnmzWAJOjf9Asb-nYYPAq8jYFgj1hDo",
  authDomain: "owlvyhouseacademy-gate.firebaseapp.com",
  projectId: "owlvyhouseacademy-gate",
  storageBucket: "owlvyhouseacademy-gate.firebasestorage.app",
  messagingSenderId: "724477316254",
  appId: "1:724477316254:web:0ddd4fe36ee3b028e73f8f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// กำหนดให้ระบบจำข้อมูลบัญชีไว้ในคลังของหน้าเว็บ (ป้องกันการลืมตั๋วล็อกอิน)
provider.setCustomParameters({ prompt: 'select_account' });

const loginSection = document.getElementById('login-section');
const formSection = document.getElementById('form-section');
const welcomeSection = document.getElementById('welcome-section');
const userNameSpan = document.getElementById('user-name');

let currentUser = null;
let isProcessing = false; // ตัวแปรล็อกป้องกันการวนลูปซ้ำซ้อน

// ดักจับข้อมูลหลังจากกลับมาจากหน้า Google
async function handleRedirectResponse() {
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            isProcessing = true;
            await handleUserStatus(result.user);
        }
    } catch (error) {
        console.error("Redirect Error:", error);
    }
}
handleRedirectResponse();

// ปุ่มกดล็อกอิน
document.getElementById('btn-login').addEventListener('click', () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        signInWithRedirect(auth, provider);
    } else {
        signInWithPopup(auth, provider)
            .then((result) => handleUserStatus(result.user))
            .catch((error) => console.error("Popup Error:", error));
    }
});

// ตรวจสอบสถานะล็อกอินหลัก
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (!isProcessing) {
            await handleUserStatus(user);
        }
    } else {
        loginSection.classList.remove('hidden');
        formSection.classList.add('hidden');
        welcomeSection.classList.add('hidden');
    }
});

async function handleUserStatus(user) {
    currentUser = user;
    loginSection.classList.add('hidden');
    
    const userDocRef = doc(db, "registered_students", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        showWelcomePage();
    } else {
        userNameSpan.innerText = user.displayName;
        formSection.classList.remove('hidden');
        welcomeSection.classList.add('hidden');
    }
}

document.getElementById('btn-save').addEventListener('click', async () => {
    const schoolName = document.getElementById('school-name').value.trim();
    const eduLevel = document.getElementById('education-level').value;

    if (!schoolName || !eduLevel) {
        alert("กรุณากรอกชื่อโรงเรียนและเลือกชั้นเรียนก่อนกดรับสิทธิ์เข้าสอบนะคะ 😊");
        return;
    }

    if (currentUser) {
        await setDoc(doc(db, "registered_students", currentUser.uid), {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            school: schoolName,
            grade: eduLevel,
            registeredAt: new Date()
        });

        formSection.classList.add('hidden');
        showWelcomePage();
    }
});

function showWelcomePage() {
    welcomeSection.classList.remove('hidden');
    loginSection.classList.add('hidden');
    formSection.classList.add('hidden');
}
