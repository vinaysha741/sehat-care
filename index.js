// STEP 1: Get references to the main form, confirmation panel, and navigation.
const form = document.getElementById("registrationForm");
const confirmation = document.getElementById("confirmation");
const confirmationDetails = document.getElementById("confirmationDetails");
const formMessage = document.getElementById("formMessage");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");


// NEW: settings for slots and staff panel
const SEATS_PER_SLOT = 5;       // how many people can book one time slot
const STAFF_PIN = "1234";       // demo only! a real site needs a server login
const STORAGE_KEY = "sehatCareRegistrations";
const SLOTS = [
  "9:00 AM – 10:00 AM", "10:00 AM – 11:00 AM", "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM", "2:00 PM – 3:00 PM", "3:00 PM – 4:00 PM"
];
const timeSlot = document.getElementById("timeSlot");
const slotInfo = document.getElementById("slotInfo");

// NEW: read the saved registrations from the browser
function getRegistrations() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

// NEW: save the registrations back to the browser
function saveRegistrations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// NEW: how many seats are free in one time slot
function seatsLeft(slot) {
  const booked = getRegistrations().filter(r => r.timeSlot === slot).length;
  return SEATS_PER_SLOT - booked;
}

// NEW: fill the time dropdown and show seats left (full slots are disabled)
function fillSlots() {
  const chosen = timeSlot.value;
  timeSlot.innerHTML = '<option value="">Select time</option>';
  SLOTS.forEach(slot => {
    const left = seatsLeft(slot);
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = left > 0 ? slot + " (" + left + " seats left)" : slot + " (FULL)";
    option.disabled = left <= 0;
    timeSlot.appendChild(option);
  });
  timeSlot.value = chosen;
}

timeSlot.addEventListener("change", () => {
  slotInfo.textContent = timeSlot.value
    ? "Only " + seatsLeft(timeSlot.value) + " seat(s) left in this slot."
    : "Each time slot has limited seats.";
});

// NEW: hide most of a name, "Ravi Kumar" becomes "R*** K***"
function maskName(name) {
  return name.split(" ").map(w => w[0] + "***").join(" ");
}

// NEW: hide a phone number, keep only the last 3 digits
function maskPhone(phone) {
  return "*******" + phone.slice(-3);
}

// STEP 2: Open and close the mobile navigation menu.
menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

// STEP 3: Close the mobile menu after a navigation link is selected.
navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

// STEP 4: Generate a short unique registration ID for the demo.
function makeId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(100 + Math.random() * 900);
  return `SC-${stamp.slice(-5)}-${random}`;
}

// STEP 5: Escape user-entered text before inserting it into the confirmation HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

// STEP 6: Show a validation error near the form.
function showError(message) {
  formMessage.textContent = message;
  formMessage.className = "form-message error";
  formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
}

// STEP 7: Validate the form and save the registration locally.
form.addEventListener("submit", (e) => {
  e.preventDefault();
  formMessage.className = "form-message";

  // STEP 7A: Let the browser check required fields and basic input types.
  if (!form.checkValidity()) {
    showError("Please complete all required fields correctly.");
    form.reportValidity();
    return;
  }

  // STEP 7B: Apply a simple phone-number validation rule.
  const phone = document.getElementById("phone").value.trim();
  if (!/^[+0-9 ()-]{7,20}$/.test(phone)) {
    showError("Please enter a valid phone number.");
    document.getElementById("phone").focus();
    return;
  }

  // NEW: check again that the time slot still has a free seat
  if (seatsLeft(timeSlot.value) <= 0) {
    showError("Sorry, this time slot is full. Please choose another one.");
    fillSlots();
    return;
  }

  // STEP 7C: Collect the submitted form values.
  const wantReminder = document.getElementById("wantReminder").checked;
  const data = {
    id: makeId(),
    fullName: document.getElementById("fullName").value.trim(),
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    phone,
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    date: document.getElementById("date").selectedOptions[0].text,
    timeSlot: document.getElementById("timeSlot").value,
    concern: document.getElementById("concern").value.trim(),
    conditions: document.getElementById("conditions").value.trim(),
    emergencyName: document.getElementById("emergencyName").value.trim(),
    emergencyPhone: document.getElementById("emergencyPhone").value.trim(),
    createdAt: new Date().toISOString(),
    // NEW: reminder and attendance
    wantReminder: wantReminder,
    reminderType: document.getElementById("reminderType").value,
    reminderWhen: document.getElementById("reminderWhen").value,
    reminderSent: false,
    attendance: "Pending"     // Pending / Present / Absent
  };

  // STEP 7D: Save demo data in this browser only.
  const registrations = JSON.parse(localStorage.getItem("sehatCareRegistrations") || "[]");
  registrations.push(data);
  localStorage.setItem("sehatCareRegistrations", JSON.stringify(registrations));

  // NEW: text for the reminder line in the confirmation
  const reminderText = wantReminder ? data.reminderType + ", " + data.reminderWhen : "No reminder";

  // STEP 8: Build the registration confirmation card.
  confirmationDetails.innerHTML = `
    <div class="detail"><span>Registration ID</span><strong>${escapeHTML(data.id)}</strong></div>
    <div class="detail"><span>Patient</span><strong>${escapeHTML(data.fullName)}</strong></div>
    <div class="detail"><span>Date</span><strong>${escapeHTML(data.date)}</strong></div>
    <div class="detail"><span>Time</span><strong>${escapeHTML(data.timeSlot)}</strong></div>
    <div class="detail"><span>Reminder</span><strong>${escapeHTML(reminderText)}</strong></div>
    <div class="detail"><span>Location</span><strong>Community Health Center</strong></div>
  `;

  // STEP 9: Hide the form and reveal the success confirmation.
  form.classList.add("hidden");
  confirmation.classList.remove("hidden");
  confirmation.scrollIntoView({ behavior: "smooth", block: "start" });

  // NEW: update the seat counts and the staff table
  fillSlots();
  showStaffTable();
});

// STEP 10: Print only the confirmation section using the print CSS rules.
document.getElementById("printBtn").addEventListener("click", () => window.print());

// STEP 11: Reset the form when the visitor wants another registration.
document.getElementById("newRegistrationBtn").addEventListener("click", () => {
  form.reset();
  confirmation.classList.add("hidden");
  form.classList.remove("hidden");
  document.getElementById("register").scrollIntoView({ behavior: "smooth" });
  document.getElementById("fullName").focus();
});

// ===== NEW: STAFF PANEL =====
const lockBox = document.getElementById("lockBox");
const staffBox = document.getElementById("staffBox");
const hideDetails = document.getElementById("hideDetails");
const regTable = document.getElementById("regTable");

// Unlock with the PIN
document.getElementById("unlockBtn").addEventListener("click", () => {
  if (document.getElementById("pinInput").value === STAFF_PIN) {
    lockBox.classList.add("hidden");
    staffBox.classList.remove("hidden");
    document.getElementById("pinMessage").textContent = "";
    showStaffTable();
  } else {
    document.getElementById("pinMessage").textContent = "Wrong PIN. Try again.";
  }
});

// Lock the panel again
document.getElementById("lockBtn").addEventListener("click", () => {
  staffBox.classList.add("hidden");
  lockBox.classList.remove("hidden");
  document.getElementById("pinInput").value = "";
});

hideDetails.addEventListener("change", showStaffTable);

// Draw the table of registrations
function showStaffTable() {
  const list = getRegistrations();
  const hide = hideDetails.checked;
  let present = 0, absent = 0;
  regTable.innerHTML = "";

  list.forEach((p, index) => {
    if (p.attendance === "Present") present++;
    if (p.attendance === "Absent") absent++;

    const name = hide ? maskName(p.fullName) : p.fullName;
    const phone = hide ? maskPhone(p.phone) : p.phone;
    const reminder = !p.wantReminder ? "Not wanted" : (p.reminderSent ? "Sent" : "Waiting");

    const options = ["Pending", "Present", "Absent"].map(o =>
      "<option" + (o === p.attendance ? " selected" : "") + ">" + o + "</option>").join("");

    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHTML(p.id) + "</td>" +
      "<td>" + escapeHTML(name) + "</td>" +
      "<td>" + escapeHTML(phone) + "</td>" +
      "<td>" + escapeHTML(p.timeSlot) + "</td>" +
      '<td><span class="tag">' + reminder + "</span></td>" +
      '<td><select data-index="' + index + '">' + options + "</select></td>";
    regTable.appendChild(row);
  });

  document.getElementById("summary").textContent =
    "Total: " + list.length + " | Present: " + present + " | Absent: " + absent +
    " | Pending: " + (list.length - present - absent);
}

// Save attendance when staff changes a dropdown
regTable.addEventListener("change", (e) => {
  const list = getRegistrations();
  list[e.target.dataset.index].attendance = e.target.value;
  saveRegistrations(list);
  showStaffTable();
});

// Reminders (demo): only marks them as sent. A real site needs an SMS/email service.
document.getElementById("remindBtn").addEventListener("click", () => {
  const list = getRegistrations();
  let count = 0;
  list.forEach(p => {
    if (p.wantReminder && !p.reminderSent) { p.reminderSent = true; count++; }
  });
  saveRegistrations(list);
  showStaffTable();
  alert("Demo: " + count + " reminder(s) marked as sent. No real message was sent.");
});

// CSV report. Health details are never included. Names/phones follow the hide checkbox.
document.getElementById("csvBtn").addEventListener("click", () => {
  const hide = hideDetails.checked;
  let csv = "ID,Name,Phone,Date,Time slot,Attendance\n";
  getRegistrations().forEach(p => {
    const name = hide ? maskName(p.fullName) : p.fullName;
    const phone = hide ? maskPhone(p.phone) : p.phone;
    csv += [p.id, name, phone, p.date, p.timeSlot, p.attendance]
      .map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",") + "\n";
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "camp-report.csv";
  link.click();
});

// Delete everything (asks first)
document.getElementById("deleteBtn").addEventListener("click", () => {
  if (confirm("Delete ALL registrations from this browser?")) {
    localStorage.removeItem(STORAGE_KEY);
    showStaffTable();
    fillSlots();
  }
});

// Start: fill the time slot dropdown when the page opens
fillSlots();