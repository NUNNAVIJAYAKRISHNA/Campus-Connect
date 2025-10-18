import { auth, db } from "./firebaseOptions.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const registrationForm = document.getElementById("registration-form");
  if (registrationForm) {
    registrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullName = document.getElementById("full-name").value;
      const email = document.getElementById("email-address").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const terms = document.getElementById("terms").checked;

      // Get role from Alpine.js data
      const role = registrationForm.__x.$data.role;
      const studentId = document.getElementById("student-id").value;
      const department = document.getElementById("department").value;

      const errorDiv = document.getElementById("error-message");
      errorDiv.textContent = ""; // Clear previous errors

      if (password !== confirmPassword) {
        errorDiv.textContent = "Passwords do not match.";
        return;
      }

      if (!terms) {
        errorDiv.textContent = "You must agree to the Terms and Conditions.";
        return;
      }

      try {
        // 1. Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        console.log("User created successfully:", user.uid);

        // 2. Create user document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userData = {
          uid: user.uid,
          fullName: fullName,
          email: email,
          role: role,
          createdAt: serverTimestamp(),
          ...(role === "student" && { studentId: studentId }),
          ...(role === "admin" && { department: department }),
        };
        await setDoc(userDocRef, userData);
        console.log("User data saved to Firestore.");

        // 3. Redirect to a welcome/dashboard page
        alert("Registration successful! Welcome to Campus Connect.");
        
        if (role === 'admin') {
          window.location.href = "admin_dashboard.html";
        } else {
          window.location.href = "user_dashboard.html";
        }
      } catch (error) {
        console.error("Registration Error:", error);
        errorDiv.textContent = error.message;
      }
    });
  }
});