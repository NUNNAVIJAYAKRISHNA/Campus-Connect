import { db, auth } from "./firebaseOptions.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { uploadImageToImgBB } from "./imageUploader.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  // --- UI Elements ---
  const pageTitle = document.querySelector("h2");
  const pageSubtitle = document.querySelector("h2 + p");
  const eventTitleInput = document.getElementById("event-title");
  const categoryInput = document.getElementById("category");
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  const registrationDeadlineInput = document.getElementById("registration-deadline");
  const registrationTypeInput = document.getElementById("registration-type");
  const minTeamSizeInput = document.getElementById("min-team-size");
  const maxTeamSizeInput = document.getElementById("max-team-size");
  const locationInput = document.getElementById("location");
  const organizerInput = document.getElementById("organizer");
  const descriptionInput = document.getElementById("description");
  const imageUrlInput = document.getElementById("image-input"); // Changed ID
  const imageFileInput = document.getElementById("image-file-input");
  const brochureUrlInput = document.getElementById("brochure-url");
  const submitButton = document.querySelector('button[type="submit"]');

  // --- Edit Mode Logic ---
  if (eventId) {
    // We are in "edit" mode
    pageTitle.textContent = "Edit Event";
    pageSubtitle.textContent = "Update the details for this event.";
    submitButton.textContent = "Update Event";

    // Fetch event data and populate the form
    const loadEventForEditing = async () => {
      try {
        const eventDocRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventDocRef);

        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          eventTitleInput.value = eventData.title || "";
          categoryInput.value = eventData.category || "";
          dateInput.value = eventData.date || "";
          timeInput.value = eventData.time || "";
          registrationDeadlineInput.value = eventData.registrationDeadline || "";
          locationInput.value = eventData.location || "";
          organizerInput.value = eventData.organizer || "";
          descriptionInput.value = eventData.description || "";
          imageUrlInput.value = eventData.imageUrl || "";
          brochureUrlInput.value = eventData.brochureUrl || "";
          registrationTypeInput.value = eventData.registrationType || "individual";
          if (eventData.registrationType === "team") {
            document.getElementById("team-size-fields").classList.remove("hidden");
            minTeamSizeInput.value = eventData.minTeamSize || "";
            maxTeamSizeInput.value = eventData.maxTeamSize || "";
          }
        } else {
          console.error("No such event found!");
          alert("Event not found. Redirecting to dashboard.");
          window.location.href = "admin_dashboard.html";
        }
      } catch (error) {
        console.error("Error fetching event for editing:", error);
        alert("Could not load event data.");
      }
    };

    loadEventForEditing();
  }

  const eventForm = document.getElementById("event-form");
  const statusMessage = document.getElementById("status-message");

  if (eventForm) {
    eventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusMessage.textContent = ""; // Clear previous messages

      // Get form values
      const eventTitle = eventTitleInput.value;
      const category = categoryInput.value;
      const date = dateInput.value;
      const time = timeInput.value;
      const registrationDeadline = registrationDeadlineInput.value;
      const registrationType = registrationTypeInput.value;
      const minTeamSize = minTeamSizeInput.value;
      const maxTeamSize = maxTeamSizeInput.value;
      const location = locationInput.value;
      const organizer = organizerInput.value;
      const description = descriptionInput.value; 
      const imageUrl = imageUrlInput.value; // The URL from the text box
      const imageFile = imageFileInput.files[0]; // The file from the file input
      const brochureUrl = brochureUrlInput.value;

      // Basic validation
      if (!eventTitle || !date || !time || !location || !organizer) {
        statusMessage.innerHTML = `<p class="text-red-500">Please fill out all required fields.</p>`;
        return;
      }

      try {
        // Show a loading message
        statusMessage.innerHTML = `<p class="text-blue-500">${eventId ? "Updating" : "Saving"} event... This may take a moment if an image is being uploaded.</p>`;
        submitButton.disabled = true;

        // Determine the image source: prioritize the uploaded file, then the URL field.
        const imageSource = imageFile || imageUrl;
        // In edit mode, we start with the original URL from the input.
        // If creating, we start with null.
        let finalImageUrl = eventId ? imageUrlInput.value : null; 

        if (imageSource) {
          try {
            finalImageUrl = await uploadImageToImgBB(imageSource);
          } catch (uploadError) {
            console.error("Image upload failed:", uploadError);
            statusMessage.innerHTML = `<p class="text-red-500">Error processing image: ${uploadError.message}. Please check the file/link or try another.</p>`;
            submitButton.disabled = false;
            return;
          }
        }

        const eventData = {
          title: eventTitle,
          category: category,
          date: date,
          time: time,
          registrationDeadline: registrationDeadline,
          registrationType: registrationType,
          minTeamSize: minTeamSize,
          maxTeamSize: maxTeamSize,
          location: location,
          organizer: organizer,
          description: description,
          imageUrl: finalImageUrl, // Use the processed URL
          brochureUrl: brochureUrl,
        };

        // Prepare creator metadata: prefer cached session user, otherwise try to read Firestore user doc
        let creatorUid = null;
        let creatorName = null;
        let creatorEmail = null;

        try {
          const cached = sessionStorage.getItem("user");
          if (cached) {
            const u = JSON.parse(cached);
            creatorUid = u.uid || u.id || null;
            creatorName = u.fullName || u.name || u.displayName || null;
            creatorEmail = u.email || null;
          }
        } catch (e) {
          console.warn("Failed to parse cached user", e);
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
                  const userDoc = await getDoc(doc(db, "users", user.uid));
                  if (userDoc.exists()) {
                    const data = userDoc.data();
                    creatorName =
                      data.fullName || data.name || data.displayName || creatorName;
                    // cache it
                    sessionStorage.setItem(
                      "user",
                      JSON.stringify({ ...data, uid: user.uid })
                    );
                  }
                } catch (err) {
                  console.warn(
                    "Failed to fetch user doc for creator metadata",
                    err
                  );
                }
              }
              unsub();
              resolve();
            });
          });
        }

        if (eventId) {
          // Update existing document
          const eventDocRef = doc(db, "events", eventId);
          await updateDoc(eventDocRef, {
            ...eventData,
            updatedAt: serverTimestamp(),
          });
          statusMessage.innerHTML = `<p class="text-green-500">Event updated successfully!</p>`;
        } else {
          // Add a new document
          const docRef = await addDoc(collection(db, "events"), {
            ...eventData,
            createdAt: serverTimestamp(),
            creatorUid: creatorUid,
            creatorName: creatorName,
            creatorEmail: creatorEmail,
          });
          console.log("Document written with ID: ", docRef.id);
          statusMessage.innerHTML = `<p class="text-green-500">Event saved successfully!</p>`;
          eventForm.reset();
          imageFileInput.value = ''; // Also reset the file input
        }

      } catch (error) {
        console.error("Error adding document: ", error);
        statusMessage.innerHTML = `<p class="text-red-500">Error saving event: ${error.message}</p>`;
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  document.getElementById("cancel-button")?.addEventListener("click", () => {
    if (eventId) {
      window.location.href = "admin_dashboard.html"; // Go back to dashboard if editing
    } else {
      eventForm.reset(); // Just clear the form if creating
      imageFileInput.value = '';
    }
  });
});
