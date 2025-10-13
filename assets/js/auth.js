// auth.js
import { auth, db } from './firebaseOptions.js';
import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Function to handle user registration
async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await sendEmailVerification(user);
    alert("Verification email sent. Please check your inbox.");
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    document.getElementById('error-message').innerText = error.message;
  }
}

// Function to verify OTP (email verification)
async function verifyOtp(actionCode) {
  try {
    await applyActionCode(auth, actionCode);
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        emailVerified: true,
        createdAt: new Date()
      }, { merge: true });
      alert("Email verified successfully!");
      window.location.href = "index.html"; // Redirect to a logged-in page
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    document.getElementById('error-message').innerText = error.message;
  }
}

// Event listener for the registration form
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (password !== confirmPassword) {
    document.getElementById('error-message').innerText = "Passwords do not match.";
    return;
  }

  await registerUser(email, password);
});

// Event listener for the OTP verification button
document.getElementById('verify-otp').addEventListener('click', async () => {
    const otpInputs = document.querySelectorAll('fieldset input');
    let otp = '';
    otpInputs.forEach(input => {
        otp += input.value;
    });

  if (otp.length === 6) {
    // This is a simplified example. In a real app, you would get the action code from the email link.
    // For this example, we'll assume the user pastes the action code into the OTP fields.
    await verifyOtp(otp);
  } else {
    document.getElementById('error-message').innerText = "Please enter the 6-digit OTP.";
  }
});


async function handleCredentialResponse(response) {
  try {
    const credential = GoogleAuthProvider.credential(response.credential);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    console.log("✅ Logged in:", user.displayName);

    // Add or update user record in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date()
    }, { merge: true });

    alert(`Welcome ${user.displayName}!`);
  } catch (error) {
    console.error("❌ Google Sign-In Failed");
  }
}