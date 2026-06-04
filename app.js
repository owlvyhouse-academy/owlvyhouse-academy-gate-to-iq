// ดึงไลบรารี Firebase จาก CDN ของ Google โดยตรง (ไม่ต้องติดตั้งลงคอมพิวเตอร์)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ วางก้อนข้อมูลคอนฟิกที่คุณครูก๊อปปี้มาจากหลังบ้าน Firebase ตรงนี้แทนที่ได้เลยครับ
const firebaseConfig = {
apiKey: "AIzaSyCFSnmzWAJOjf9Asb-nYYPAq8jYFgj1hDo",
authDomain: "owlvyhouseacademy-gate.firebaseapp.com",
projectId: "owlvyhouseacademy-gate",
storageBucket: "owlvyhouseacademy-gate.firebasestorage.app",
messagingSenderId: "724477316254",
appId: "1:724477316254:web:0ddd4fe36ee3b028e73f8f"
};

// เริ่มต้นเปิดระบบงาน Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ดึงองค์ประกอบหน้าเว็บมาเตรียมใช้งาน
const loginSection = document.getElementById('login-section');
const formSection = document.getElementById('form-section');
const welcomeSection = document.getElementById('welcome-section');
const userNameSpan = document.getElementById('user-name');

let currentUser = null;

// 1. ระบบกดปุ่มล็อกอินด้วย Google ด้วยป๊อปอัป
document.getElementById('btn-login').addEventListener('click', () => {
    signInWithPopup(auth, provider).catch((error) => console.error("Login failed:", error));
});

// 2. ตัวตรวจจับสถานะผู้ใช้ (คอยเฝ้าเช็กว่าเด็กคนนี้ล็อกอินค้างไว้หรือยัง)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loginSection.classList.add('hidden');
        
        // เช็กใน Firebase Firestore ว่าเด็กอีเมลล์นี้เคยลงทะเบียนกรอกชื่อโรงเรียนไว้หรือยัง?
        const userDocRef = doc(db, "registered_students", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            // ถ้าประวัติตรงกันว่าลงชื่อไว้แล้ว ➡️ ข้ามไปให้รับลิงก์ Gem ได้เลย
            showWelcomePage();
        } else {
            // ถ้าเป็นเด็กใหม่ ➡️ เปิดฟอร์มให้พิมพ์ชื่อโรงเรียนและระดับชั้น
            userNameSpan.innerText = user.displayName;
            formSection.classList.remove('hidden');
        }
    } else {
        // ถ้าไม่ได้ล็อกอิน ➡️ ย้อนกลับไปโชว์ปุ่มล็อกอินแรกสุด
        loginSection.classList.remove('hidden');
        formSection.classList.add('hidden');
        welcomeSection.classList.add('hidden');
    }
});

// 3. ระบบกดบันทึกฟอร์มลงฐานข้อมูล Firestore
document.getElementById('btn-save').addEventListener('click', async () => {
    const schoolName = document.getElementById('school-name').value.trim();
    const eduLevel = document.getElementById('education-level').value;

    if (!schoolName || !eduLevel) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วนก่อนรับลิงก์นะคะ");
        return;
    }

    if (currentUser) {
        // ทำการสร้าง/เขียนทับก้อนข้อมูลเด็กคนนี้ลงตารางฐานข้อมูลใน Firebase
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

// ฟังก์ชันเปิดหน้าแสดงลิงก์ข้อสอบ
function showWelcomePage() {
    welcomeSection.classList.remove('hidden');
}