const CONFIG = {
  facilityName: "Peak and Paddle",
  address: "Sitio Bali-Bali, Brgy. Poblacion, Compostela, Cebu",
  hourlyRate: 300,
  openHour: 7,
  closeHour: 23,
  courts: ["Court 1", "Court 2"],
  supabaseUrl: "https://supabase.co",
  supabaseAnonKey: "sb_publishable_ccBH2mBZycjN6RVicoy_7A_eu_Rs0ZI",
  gcashNumber: "0917 123 4567",
  gcashName: "Peak and Paddle",
  gcashQrImage: "gcash-qr.png"
};

let selectedCourt = "";
let dateOffset = 0;
let selectedDateStr = "";
let selectedSlots = [];
let bookedSlots = [];

function formatHour(h) {
  const period = h >= 12 && h < 24 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${period}`;
}

function init() {
  document.getElementById("ui-name").textContent = CONFIG.facilityName;
  document.getElementById("ui-address").textContent = CONFIG.address;
  document.getElementById("ui-hours").textContent = `Open Daily ${formatHour(CONFIG.openHour)} - ${formatHour(CONFIG.closeHour)}`;
  document.getElementById("ui-rate").textContent = `₱${CONFIG.hourlyRate.toLocaleString()} / hr`;
  renderCourts();
}

function renderCourts() {
  const box = document.getElementById("court-list");
  box.innerHTML = "";
  CONFIG.courts.forEach(c => {
    const active = c === selectedCourt;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = active
      ? "py-3 px-5 rounded-full font-semibold text-sm bg-[#18231c] text-white shadow-md transition"
      : "py-3 px-5 rounded-full font-semibold text-sm bg-white text-[#18231c] shadow-sm hover:bg-gray-50 transition";
    btn.textContent = c;
    btn.onclick = () => {
      selectedCourt = c;
      selectedDateStr = "";
      selectedSlots = [];
      renderCourts();
      renderDates();
      document.getElementById("step-2").style.display = "block";
      document.getElementById("step-3").style.display = "none";
      updateTotal();
    };
    box.appendChild(btn);
  });
}

function renderDates() {
  const box = document.getElementById("date-list");
  box.innerHTML = "";
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + dateOffset + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const active = iso === selectedDateStr;

    const card = document.createElement("div");
    card.className = active
      ? "bg-[#18231c] text-white rounded-2xl py-3 px-2 text-center cursor-pointer shadow-md"
      : "bg-white text-[#18231c] rounded-2xl py-3 px-2 text-center cursor-pointer shadow-sm hover:bg-gray-50";
    card.innerHTML = `<div class="text-xl font-bold">${String(d.getDate()).padStart(2, "0")}</div><div class="text-xs opacity-75">${d.toLocaleDateString("en-US", { weekday: "short" })}</div>`;
    card.onclick = () => {
      selectedDateStr = iso;
      selectedSlots = [];
      renderDates();
      loadBookedSlots();
      document.getElementById("step-3").style.display = "block";
      updateTotal();
    };
    box.appendChild(card);
  }
}
async function loadBookedSlots() {
  bookedSlots = [];
  try {
    const url = `${CONFIG.supabaseUrl}/rest/v1/bookings?select=time_slot&court_name=eq.${encodeURIComponent(selectedCourt)}&booking_date=eq.${selectedDateStr}`;
    const res = await fetch(url, {
      headers: {
        apikey: CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${CONFIG.supabaseAnonKey}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      bookedSlots = data.map(r => r.time_slot);
    }
  } catch (e) {
    console.error("Could not load slots:", e);
  }
  renderSlots();
}

function renderSlots() {
  const box = document.getElementById("time-grid");
  box.innerHTML = "";
  for (let h = CONFIG.openHour; h < CONFIG.closeHour; h++) {
    const label = `${formatHour(h)} - ${formatHour(h + 1)}`;
    const isBooked = bookedSlots.includes(label);
    const isSelected = selectedSlots.includes(label);

    const el = document.createElement("div");
    el.textContent = label;
    if (isBooked) {
      el.className = "py-3 px-2 rounded-xl text-xs font-semibold text-center bg-gray-200 text-gray-400 line-through cursor-not-allowed";
    } else if (isSelected) {
      el.className = "py-3 px-2 rounded-xl text-xs font-semibold text-center bg-[#18231c] text-white shadow-md cursor-pointer";
    } else {
      el.className = "py-3 px-2 rounded-xl text-xs font-semibold text-center bg-white text-[#18231c] shadow-sm hover:border-[#18231c] border border-transparent cursor-pointer";
    }

    if (!isBooked) {
      el.onclick = () => {
        selectedSlots = isSelected ? selectedSlots.filter(s => s !== label) : [...selectedSlots, label];
        renderSlots();
        updateTotal();
      };
    }
    box.appendChild(el);
  }
}

function updateTotal() {
  const count = selectedSlots.length;
  const total = count * CONFIG.hourlyRate;
  document.getElementById("ui-hours-count").textContent = `${count} ${count === 1 ? "hour" : "hours"} selected`;
  document.getElementById("ui-total").textContent = `₱${total.toLocaleString()}`;

  const step4 = document.getElementById("step-4");
  const reviewBtn = document.getElementById("review-btn");
  if (step4) step4.style.display = count > 0 ? "block" : "none";
  if (reviewBtn) reviewBtn.style.display = count > 0 ? "block" : "none";
}

document.getElementById("prev-days").onclick = () => { if (dateOffset > 0) { dateOffset--; renderDates(); } };
document.getElementById("next-days").onclick = () => { dateOffset++; renderDates(); };

document.getElementById("review-btn").onclick = () => {
  const name = document.getElementById("full-name").value.trim();
  const contact = document.getElementById("contact-no").value.trim();
  if (!selectedSlots.length) return alert("Please select at least one time slot.");
  if (!name || !contact) return alert("Please enter your Full Name and Contact Number.");

  const total = selectedSlots.length * CONFIG.hourlyRate;
  document.getElementById("modal-title").textContent = "Review & Pay via GCash";
  document.getElementById("modal-body").innerHTML = `
    <div style="font-size:0.88rem; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f1f5f9;">
        <span style="color:#6b7280;">Court & Date</span><strong>${selectedCourt} &bull; ${selectedDateStr}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f1f5f9;">
        <span style="color:#6b7280;">Time</span><strong style="text-align:right;">${selectedSlots.join("<br>")}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:1rem;">
        <span style="color:#6b7280;">Amount Due</span><strong>₱${total.toLocaleString()}</strong>
      </div>
    </div>

    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; padding:14px; text-align:center; margin-bottom:12px;">
      <p style="font-size:0.8rem; font-weight:700; color:#1e40af; margin-bottom:6px;">Scan QR or Send via GCash</p>
      <img src="${CONFIG.gcashQrImage}" alt="GCash QR Code" style="width:150px; height:150px; object-fit:contain; margin:0 auto 8px; border-radius:10px; background:#fff; padding:6px;" />
      <p style="font-size:0.85rem; font-weight:700; color:#18231c;">${CONFIG.gcashNumber}</p>
      <p style="font-size:0.78rem; color:#4b5563;">${CONFIG.gcashName}</p>
    </div>

    <div>
      <label style="display:block; font-size:0.78rem; font-weight:600; color:#374151; margin-bottom:4px;">GCash Reference No. (*)</label>
      <input id="modal-gcash-ref" type="text" placeholder="Enter 13-digit GCash Ref No." style="width:100%; padding:9px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:0.88rem;" />
    </div>`;
  document.getElementById("modal-actions").classList.remove("hidden");
  document.getElementById("modal").classList.remove("hidden");
};

document.getElementById("close-modal").onclick = () => document.getElementById("modal").classList.add("hidden");

document.getElementById("confirm-btn").onclick = async () => {
  const gcashRef = document.getElementById("modal-gcash-ref") ? document.getElementById("modal-gcash-ref").value.trim() : "";
  if (!gcashRef) {
    alert("Please enter your GCash Reference Number before confirming your booking.");
    return;
  }

  const btn = document.getElementById("confirm-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  const name = document.getElementById("full-name").value.trim();
  const contact = document.getElementById("contact-no").value.trim();
  const email = document.getElementById("email").value.trim();
  const baseNotes = document.getElementById("notes").value.trim();
  const notes = [`GCash Ref: ${gcashRef}`, baseNotes].filter(Boolean).join(" | ");

  const rows = selectedSlots.map(slot => ({
    court_name: selectedCourt, booking_date: selectedDateStr, time_slot: slot,
    full_name: name, contact_no: contact, email, notes, total_amount: CONFIG.hourlyRate, status: "pending"
  }));

  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
      Prefer: "return=minimal"
    },
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    alert("Sorry, one of those slots was just taken or could not be saved! Please pick another.");
    btn.disabled = false;
    btn.textContent = "Confirm Booking";
    document.getElementById("modal").classList.add("hidden");
    loadBookedSlots();
    return;
  }

  document.getElementById("modal-title").textContent = "Booking Confirmed!";
  document.getElementById("modal-body").innerHTML = `<p class="text-sm text-gray-600 mb-4">Thank you, <strong>${name}</strong>! Your slot at <strong>${CONFIG.facilityName}</strong> is reserved.</p><button onclick="location.reload()" class="w-full py-3 rounded-full bg-[#18231c] text-white font-bold">Done</button>`;
  document.getElementById("modal-actions").classList.add("hidden");
};

init();
