// 1. ดึงฟังก์ชันการใช้งานจากคลังระบบ Firebase SDK ผ่านช่องทางออนไลน์ (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. รหัสบ้านพักโปรเจกต์ระบุตัวตนของคุณครูบนระบบ Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFSnmzWAJOjf9Asb-nYYPAq8jYFgj1hDo",
  authDomain: "owlvyhouseacademy-gate.firebaseapp.com",
  projectId: "owlvyhouseacademy-gate",
  storageBucket: "owlvyhouseacademy-gate.firebasestorage.app",
  messagingSenderId: "724477316254",
  appId: "1:724477316254:web:0ddd4fe36ee3b028e73f8f"
};

// 3. เริ่มต้นสั่งการทำงานเบื้องหลังระบบ
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ดึงการเชื่อมต่อแท็กแสดงผลบนหน้าต่างเว็บไซต์
const loginSection = document.getElementById('login-section');
const formSection = document.getElementById('form-section');
const welcomeSection = document.getElementById('welcome-section');
const userNameSpan = document.getElementById('user-name');

let currentUser = null;

// 4. ลอจิกระบบกดปุ่มเพื่อขอล็อกอินบัญชี Google
document.getElementById('btn-login').addEventListener('click', () => {
    // ฟังก์ชันตรวจสัญญานอินเทอร์เน็ตว่าเด็กๆ เปิดผ่านหน้าจอมือถือ/แท็บเล็ตอยู่หรือไม่?
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // หากเล่นบนมือถือ ➡️ ใช้วิธีย้ายหน้าจอไปหน้าล็อกอินตรง (Redirect) เพื่อแก้อาการ In-App บล็อก
        signInWithRedirect(auth, provider).catch((error) => console.error("Redirect login failed:", error));
    } else {
        // หากเล่นบนคอมพิวเตอร์ PC ➡️ เปิดหน้าต่างเล็กป๊อปอัปเด้งซ้อนขึ้นมาตามปกติ (Popup)
        signInWithPopup(auth, provider).catch((error) => console.error("Popup login failed:", error));
    }
});

// 5. ตัวตรวจจับความเคลื่อนไหวสถานะการล็อกอิน (คอยตรวจเช็กว่าเด็กคนนี้ลงทะเบียนไปแล้วหรือยัง)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loginSection.classList.add('hidden'); // ซ่อนปุ่มกดล็อกอินทิ้งไปเมื่อเข้ามาสำเร็จ
        
        // เข้าไปสำรวจในตาราง Cloud Firestore ว่ามีประวัติข้อมูลของคนนี้อยู่ไหม
        const userDocRef = doc(db, "registered_students", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            // กรณีเป็นเด็กเก่าที่ลงทะเบียนไว้เสร็จสรรพแล้ว ➡️ ข้ามไปหน้าแจกลิงก์ข้อสอบได้เลย
            showWelcomePage();
        } else {
            // กรณีเพิ่งเคยเข้ามาครั้งแรก ➡️ โชว์ชื่อ และเปิดสวิตช์ฟอร์มให้กรอกชื่อสถาบันกับระดับชั้น
            userNameSpan.innerText = user.displayName;
            formSection.classList.remove('hidden');
        }
    } else {
        // กรณีไม่ได้ล็อกอิน หรือมีสัญญาณหลุด ➡️ ย้อนคืนค่ากลับไปหน้าโชว์ปุ่มแรกสุด
        loginSection.classList.remove('hidden');
        formSection.classList.add('hidden');
        welcomeSection.classList.add('hidden');
    }
});

// 6. ลอจิกระบบเมื่อนักเรียนกดปุ่มบันทึกข้อมูลเพื่อส่งเข้าคลาวด์คิว
document.getElementById('btn-save').addEventListener('click', async () => {
    const schoolName = document.getElementById('school-name').value.trim();
    const eduLevel = document.getElementById('education-level').value;

    // ระบบแจ้งตักเตือนกรณีเด็กกรอกข้อมูลไม่ครบถ้วน
    if (!schoolName || !eduLevel) {
        alert("กรุณากรอกชื่อโรงเรียนและเลือกชั้นเรียนก่อนกดรับสิทธิ์เข้าสอบนะคะคุณครูรออยู่ค่ะ 😊");
        return;
    }

    if (currentUser) {
        // สั่งสร้างตารางบันทึกข้อมูลเรียงเป็นคอลัมน์ส่งไปยัง Cloud Firestore (สิงคโปร์)
        await setDoc(doc(db, "registered_students", currentUser.uid), {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            school: schoolName,
            grade: eduLevel,
            registeredAt: new Date() // ประทับเวลาที่ลงทะเบียนสำเร็จแบบวินาทีต่อวินาที
        });

        // ซ่อนฟอร์มกรอกข้อมูลและเลื่อนโชว์หน้าแจกลิงก์
        formSection.classList.add('hidden');
        showWelcomePage();
    }
});

// ฟังก์ชันเปิดแสดงหน้าต่างแจกลิงก์ควิซ Gem ของคุณครู
function showWelcomePage() {
    welcomeSection.classList.remove('hidden');
}
