import { db, auth } from "./firebaseOptions.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const eventForm = document.getElementById("event-form");
  const statusMessage = document.getElementById("status-message");

  if (eventForm) {
    eventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusMessage.textContent = ""; // Clear previous messages

      // Get form values
      const eventTitle = document.getElementById("event-title").value;
      const category = document.getElementById("category").value;
      const date = document.getElementById("date").value;
      const time = document.getElementById("time").value;
      const location = document.getElementById("location").value;
      const organizer = document.getElementById("organizer").value;
      const description = document.getElementById("description").value;
      const imageUrl = document.getElementById("image-url").value;

      // Basic validation
      if (!eventTitle || !date || !time || !location || !organizer) {
        statusMessage.innerHTML = `<p class="text-red-500">Please fill out all required fields.</p>`;
        return;
      }

      try {
        // Show a loading message
        statusMessage.innerHTML = `<p class="text-blue-500">Saving event...</p>`;

        // Prepare creator metadata: prefer cached session user, otherwise try to read Firestore user doc
        let creatorUid = null;
        let creatorName = null;
        let creatorEmail = null;

        try {
          const cached = sessionStorage.getItem('user');
          if (cached) {
            const u = JSON.parse(cached);
            creatorUid = u.uid || u.id || null;
            creatorName = u.fullName || u.name || u.displayName || null;
            creatorEmail = u.email || null;
          }
        } catch (e) {
          console.warn('Failed to parse cached user', e);
        }

        if (!creatorUid) {
          // Attempt to get from current auth state
          await new Promise((resolve) => {
            const unsub = onAuthStateChanged(auth, async (user) => {
              if (user) {
                creatorUid = user.uid;
                creatorEmail = user.email || creatorEmail;
                // try read user doc for name
                try {
                  const userDoc = await getDoc(doc(db, 'users', user.uid));
                  if (userDoc.exists()) {
                    const data = userDoc.data();
                    creatorName = data.fullName || data.name || data.displayName || creatorName;
                    // cache it
                    sessionStorage.setItem('user', JSON.stringify({ ...(data), uid: user.uid }));
                  }
                } catch (err) {
                  console.warn('Failed to fetch user doc for creator metadata', err);
                }
              }
              unsub();
              resolve();
            });
          });
        }

        // Add a new document with a generated id to the "events" collection
        const docRef = await addDoc(collection(db, "events"), {
          title: eventTitle,
          category: category,
          date: date,
          time: time,
          location: location,
          organizer: organizer,
          description: description,
          imageUrl: imageUrl,
          createdAt: serverTimestamp(),
          creatorUid: creatorUid,
          creatorName: creatorName,
          creatorEmail: creatorEmail,
        });

        console.log("Document written with ID: ", docRef.id);
        statusMessage.innerHTML = `<p class="text-green-500">Event saved successfully!</p>`;

        // Optionally, clear the form
        eventForm.reset();
      } catch (error) {
        console.error("Error adding document: ", error);
        statusMessage.innerHTML = `<p class="text-red-500">Error saving event: ${error.message}</p>`;
      }
    });
  }

  document.getElementById('cancel-button')?.addEventListener('click', () => eventForm.reset());
});
