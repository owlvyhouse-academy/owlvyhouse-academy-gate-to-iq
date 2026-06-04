// 1. ดึงฟังก์ชันการใช้งานจากคลังระบบ Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. รหัสระบุตัวตนโปรเจกต์ของ Teacher Owlvy
const firebaseConfig = {
  apiKey: "AIzaSyCFSnmzWAJOjf9Asb-nYYPAq8jYFgj1hDo",
  authDomain: "owlvyhouseacademy-gate.firebaseapp.com",
  projectId: "owlvyhouseacademy-gate",
  storageBucket: "owlvyhouseacademy-gate.firebasestorage.app",
  messagingSenderId: "724477316254",
  appId: "1:724477316254:web:0ddd4fe36ee3b028e73f8f"
};

// 3. เริ่มต้นระบบงาน
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ดึงการเชื่อมต่อแท็กแสดงผลบนหน้าจอ
const loginSection = document.getElementById('login-section');
const formSection = document.getElementById('form-section');
const welcomeSection = document.getElementById('welcome-section');
const userNameSpan = document.getElementById('user-name');

let currentUser = null;

// 🌟 [เพิ่มเข้ามาใหม่] ดักจับผลลัพธ์ทันทีหลังจากกระโดดกลับมาจากหน้าล็อกอิน Google (แก้ปัญหาวนลูปบนมือถือ)
async function checkRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            // ถ้าระบบตรวจพบตั๋วล็อกอินที่ติดกลับมา ให้เรียกฟังก์ชันจัดการข้อมูลเด็กทันที
            await handleUserStatus(result.user);
        }
    } catch (error) {
        console.error("Error catching redirect result:", error);
    }
}
checkRedirectResult();

// 4. ระบบกดปุ่มล็อกอิน
document.getElementById('btn-login').addEventListener('click', () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // มือถือ ➡️ ย้ายหน้าจอหลบ In-App Browser บล็อก
        signInWithRedirect(auth, provider).catch((error) => console.error("Redirect login failed:", error));
    } else {
        // คอมพิวเตอร์ PC ➡️ เปิดป๊อปอัปเด้งซ้อนตามปกติ
        signInWithPopup(auth, provider).catch((error) => console.error("Popup login failed:", error));
    }
});

// 5. ตัวตรวจจับสถานะล็อกอินปกติ
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await handleUserStatus(user);
    } else {
        // ถ้าไม่ได้ล็อกอิน ➡️ ให้แสดงปุ่มเข้าสู่ระบบ
        loginSection.classList.remove('hidden');
        formSection.classList.add('hidden');
        welcomeSection.classList.add('hidden');
    }
});

// 🌟 ฟังก์ชันหลักแยกออกมารวบรวมขั้นตอนจัดการข้อมูลของนักเรียน
async function handleUserStatus(user) {
    currentUser = user;
    loginSection.classList.add('hidden'); // ซ่อนปุ่มล็อกอินหลัก
    
    // สำรวจข้อมูลประวัติเด็กใน Cloud Firestore
    const userDocRef = doc(db, "registered_students", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        // เด็กเก่าที่ลงทะเบียนแล้ว ➡️ ปล่อยผ่านไปรับลิงก์ Gem ได้ทันที
        showWelcomePage();
    } else {
        // เด็กใหม่ ➡️ แสดงฟอร์มกรอกชื่อสถาบันและชั้นเรียน
        userNameSpan.innerText = user.displayName;
        formSection.classList.remove('hidden');
        welcomeSection.classList.add('hidden'); // ซ่อนส่วนลิงก์ไว้ก่อนจนกว่าจะเซฟ
    }
}

// 6. ระบบกดบันทึกข้อมูลฟอร์ม
document.getElementById('btn-save').addEventListener('click', async () => {
    const schoolName = document.getElementById('school-name').value.trim();
    const eduLevel = document.getElementById('education-level').value;

    if (!schoolName || !eduLevel) {
        alert("กรุณากรอกชื่อโรงเรียนและเลือกชั้นเรียนก่อนกดรับสิทธิ์เข้าสอบนะคะ 😊");
        return;
    }

    if (currentUser) {
        // เขียนข้อมูลบันทึกลงคลาวด์ฐานข้อมูลสิงคโปร์
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
}
