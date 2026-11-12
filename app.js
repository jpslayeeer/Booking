const CONFIG = {
  facilityName: "Peak and Paddle",
  address: "Sitio Bali-Bali, Brgy. Poblacion, Compostela, Cebu",
  hourlyRate: 300,
  openHour: 7,
  closeHour: 23,
  courts: ["Court 1", "Court 2"],
  supabaseUrl: "https://fkvtxsyozilpuheexjio.supabase.co",
  supabaseAnonKey: "sb_publishable_ccBH2mBZycjN6RVicoy_7A_eu_Rs0ZI"
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
      document.getElementById("step-4").style.display = "none";
      document.getElementById("review-btn").style.display = "none";
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
      document.getElementById("step-4").style.display = "none";
      document.getElementById("review-btn").style.display = "none";
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
        const hasSlots = selectedSlots.length > 0;
        document.getElementById("step-4").style.display = hasSlots ? "block" : "none";
        document.getElementById("review-btn").style.display = hasSlots ? "block" : "none";
      };
    }
    box.appendChild(el);
  }
}

function updateTotal() {
  const total = selectedSlots.length * CONFIG.hourlyRate;
  document.getElementById("ui-hours-count").textContent = `${selectedSlots.length} ${selectedSlots.length === 1 ? "hour" : "hours"} selected`;
  document.getElementById("ui-total").textContent = `₱${total.toLocaleString()}`;
}

document.getElementById("prev-days").onclick = () => { if (dateOffset > 0) { dateOffset--; renderDates(); } };
document.getElementById("next-days").onclick = () => { dateOffset++; renderDates(); };

document.getElementById("review-btn").onclick = () => {
  const name = document.getElementById("full-name").value.trim();
  const contact = document.getElementById("contact-no").value.trim();
  if (!selectedSlots.length) return alert("Please select at least one time slot.");
  if (!name || !contact) return alert("Please enter your Full Name and Contact Number.");

  const total = selectedSlots.length * CONFIG.hourlyRate;
  document.getElementById("modal-title").textContent = "Review Your Booking";
  document.getElementById("modal-body").innerHTML = `
    <div class="space-y-2 text-sm">
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Court</span><span class="font-semibold">${selectedCourt}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Date</span><span class="font-semibold">${selectedDateStr}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Time</span><span class="font-semibold text-right">${selectedSlots.join("<br>")}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Name</span><span class="font-semibold">${name}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Contact</span><span class="font-semibold">${contact}</span></div>
      <div class="flex justify-between pt-2 text-base font-bold"><span>Total Amount</span><span>₱${total.toLocaleString()}</span></div>
    </div>`;
  document.getElementById("modal-actions").classList.remove("hidden");
  document.getElementById("modal").classList.remove("hidden");
};

document.getElementById("close-modal").onclick = () => document.getElementById("modal").classList.add("hidden");

document.getElementById("confirm-btn").onclick = async () => {
  const btn = document.getElementById("confirm-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  const name = document.getElementById("full-name").value.trim();
  const contact = document.getElementById("contact-no").value.trim();
  const email = document.getElementById("email").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (db) {
    const rows = selectedSlots.map(slot => ({
      court_name: selectedCourt, booking_date: selectedDateStr, time_slot: slot,
      full_name: name, contact_no: contact, email, notes, total_amount: CONFIG.hourlyRate, status: "pending"
    }));
    const { error } = await db.from("bookings").insert(rows);
    if (error) {
      alert("Sorry, one of those slots was just taken! Please pick another.");
      btn.disabled = false;
      btn.textContent = "Confirm Booking";
      document.getElementById("modal").classList.add("hidden");
      loadBookedSlots();
      return;
    }
  }

  document.getElementById("modal-title").textContent = "Booking Confirmed!";
  document.getElementById("modal-body").innerHTML = `<p class="text-sm text-gray-600 mb-4">Thank you, <strong>${name}</strong>! Your slot at <strong>${CONFIG.facilityName}</strong> is reserved.</p><button onclick="location.reload()" class="w-full py-3 rounded-full bg-[#18231c] text-white font-bold">Done</button>`;
  document.getElementById("modal-actions").classList.add("hidden");
};

init();
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
  const total = selectedSlots.length * CONFIG.hourlyRate;
  document.getElementById("ui-hours-count").textContent = `${selectedSlots.length} ${selectedSlots.length === 1 ? "hour" : "hours"} selected`;
  document.getElementById("ui-total").textContent = `₱${total.toLocaleString()}`;
}

document.getElementById("prev-days").onclick = () => { if (dateOffset > 0) { dateOffset--; renderDates(); } };
document.getElementById("next-days").onclick = () => { dateOffset++; renderDates(); };

document.getElementById("review-btn").onclick = () => {
  const name = document.getElementById("full-name").value.trim();
  const contact = document.getElementById("contact-no").value.trim();
  if (!selectedSlots.length) return alert("Please select at least one time slot.");
  if (!name || !contact) return alert("Please enter your Full Name and Contact Number.");

  const total = selectedSlots.length * CONFIG.hourlyRate;
  document.getElementById("modal-title").textContent = "Review Your Booking";
  document.getElementById("modal-body").innerHTML = `
    <div class="space-y-2 text-sm">
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Court</span><span class="font-semibold">${selectedCourt}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Date</span><span class="font-semibold">${selectedDateStr}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Time</span><span class="font-semibold text-right">${selectedSlots.join("<br>")}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Name</span><span class="font-semibold">${name}</span></div>
      <div class="flex justify-between py-1 border-b"><span class="text-gray-500">Contact</span><span class="font-semibold">${contact}</span></div>
      <div class="flex justify-between pt-2 text-base font-bold"><span>Total Amount</span><span>₱${total.toLocaleString()}</span></div>
    </div>`;
  document.getElementById("modal-actions").classList.remove("hidden");
  document.getElementById("modal").classList.remove("hidden");
};

document.getElementById("close-modal").onclick = () => document.getElementById("modal").classList.add("hidden");

document.getElementById("confirm-btn").onclick = async () => {
  const btn = document.getElementById("confirm-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  const name = document.getElementById("full-name").value.trim();
  const contact = document.getElementById("contact-no").value.trim();
  const email = document.getElementById("email").value.trim();
  const notes = document.getElementById("notes").value.trim();

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
