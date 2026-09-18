/* ==========================================================
   SATHRYX WORKSHOP — FRONTEND CONFIGURATION
   Replace only GOOGLE_SCRIPT_URL after deploying the Apps Script.
   No API keys or private credentials belong in this file.
   ========================================================== */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwu1GnL8h1FITKcNmH2wsk4_sdCIEmN8DueG_141aq77QmerNYLGjrGYEWr7Dfjkk-q/exec";

/* Optional calendar configuration. Leave blank until the event date/time is finalized. */
const EVENT_CONFIG = {
  title: "SATHRYX — Generative AI + Python Workshop",
  description: "Build With AI. Think Beyond Code. SATHRYX Generative AI + Python Workshop.",
  location: "LIVE ONLINE WORKSHOP",
  start: "", // Example: "20261015T100000"
  end: ""    // Example: "20261015T130000"
};

const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");
const successState = document.getElementById("successState");
const successName = document.getElementById("successName");
const successEmail = document.getElementById("successEmail");
const toast = document.getElementById("toast");
const siteNav = document.getElementById("siteNav");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.getElementById("navLinks");

document.getElementById("yearNow").textContent = new Date().getFullYear();

function showToast(message, type = "") {
  toast.textContent = message;
  toast.className = `toast ${type}`.trim();
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
}

function setFieldState(id, valid, message = "") {
  const input = document.getElementById(id);
  const field = input?.closest(".field");
  if (!field) return;
  field.classList.toggle("valid", valid);
  field.classList.toggle("invalid", !valid && Boolean(message));
  const error = document.querySelector(`[data-error-for="${id}"]`);
  if (error) error.textContent = message;
}

const validators = {
  fullName: value => value.trim().length >= 2 ? "" : "Please enter your full name.",
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim()) ? "" : "Enter a valid email address.",
  contactNumber: value => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 ? "" : "Enter a valid contact number.";
  },
  college: value => value.trim().length >= 2 ? "" : "Please enter your college or institution.",
  department: value => value ? "" : "Please select your department.",
  year: value => value ? "" : "Please select your year of study.",
  codingLevel: value => value ? "" : "Please select your coding level.",
  aiUsage: value => value ? "" : "Please select how often you use AI tools.",
  applicationIdea: value => value.trim().length >= 5 ? "" : "Tell us what you would like to build."
};

function validateField(id, showMessage = true) {
  const input = document.getElementById(id);
  if (!input || !validators[id]) return true;
  const message = validators[id](input.value);
  setFieldState(id, !message, showMessage ? message : "");
  return !message;
}

Object.keys(validators).forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener("blur", () => validateField(id, true));
  input.addEventListener("input", () => {
    if (document.getElementById(id).closest(".field")?.classList.contains("invalid")) validateField(id, true);
    else if (input.value.trim()) validateField(id, false);
  });
  input.addEventListener("change", () => validateField(id, true));
});

["applicationIdea", "expectations"].forEach(id => {
  const input = document.getElementById(id);
  const counter = document.querySelector(`[data-count-for="${id}"]`);
  const update = () => {
    if (counter) counter.textContent = `${input.value.length} / ${input.maxLength}`;
  };
  input.addEventListener("input", update);
  update();
});

document.querySelectorAll('.chip input[value="None"]').forEach(noneBox => {
  noneBox.addEventListener("change", () => {
    if (!noneBox.checked) return;
    document.querySelectorAll('input[name="technologies"]:not([value="None"])').forEach(cb => cb.checked = false);
  });
});
document.querySelectorAll('input[name="technologies"]:not([value="None"])').forEach(cb => {
  cb.addEventListener("change", () => {
    if (cb.checked) document.querySelector('input[name="technologies"][value="None"]').checked = false;
  });
});

function collectFormData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.technologies = [...document.querySelectorAll('input[name="technologies"]:checked')].map(x => x.value).join(", ");
  return data;
}

function setSubmitting(loading) {
  submitBtn.disabled = loading;
  submitBtn.classList.toggle("loading", loading);
  if (loading) {
    submitBtn.querySelector(".btn-label").textContent = "SECURING YOUR REGISTRATION...";
  } else {
    submitBtn.querySelector(".btn-label").textContent = "REGISTER FOR WORKSHOP";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.className = "form-status";

  const requiredIds = Object.keys(validators);
  const valid = requiredIds.map(id => validateField(id, true)).every(Boolean);
  if (!valid) {
    formStatus.textContent = "Please review the highlighted fields.";
    showToast("A few details need your attention.", "error");
    document.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea")?.focus();
    return;
  }

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL")) {
    formStatus.textContent = "Registration backend is not connected yet. Add your Apps Script URL in js/script.js.";
    showToast("Connect the Google Apps Script URL before accepting registrations.", "error");
    return;
  }

  setSubmitting(true);
  try {
    const data = collectFormData();

    /* text/plain is intentionally used to avoid a CORS preflight.
       Apps Script reads the JSON from e.postData.contents. */
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow"
    });

    const raw = await response.text();
    let result = {};
    try { result = JSON.parse(raw); } catch (_) {}

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "The registration service returned an error.");
    }

    successName.textContent = data.fullName;
    successEmail.textContent = data.email;
    form.hidden = true;
    successState.hidden = false;
    formStatus.textContent = "";
    showToast("Registration confirmed.");
    successState.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    console.error(error);
    formStatus.textContent = "We couldn't submit your registration. Please try again.";
    showToast("Submission failed. Please try again.", "error");
  } finally {
    setSubmitting(false);
  }
});

/* Sticky navigation */
window.addEventListener("scroll", () => {
  siteNav.classList.toggle("scrolled", window.scrollY > 24);
}, { passive: true });

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  menuToggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
  navLinks.classList.toggle("open", !open);
});
navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  navLinks.classList.remove("open");
}));

/* Reveal animations */
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index * 35, 220)}ms`;
    observer.observe(el);
  });
} else {
  revealItems.forEach(el => el.classList.add("in-view"));
}

/* Calendar: only creates a real .ics when date/time has been configured. */
document.getElementById("calendarBtn").addEventListener("click", () => {
  if (!EVENT_CONFIG.start || !EVENT_CONFIG.end) {
    showToast("Add the workshop date and time in js/script.js first.", "error");
    return;
  }
  const escapeICS = value => String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SATHRYX//Workshop//EN",
    "BEGIN:VEVENT",
    `UID:sathryx-${Date.now()}@workshop`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${EVENT_CONFIG.start}`,
    `DTEND:${EVENT_CONFIG.end}`,
    `SUMMARY:${escapeICS(EVENT_CONFIG.title)}`,
    `DESCRIPTION:${escapeICS(EVENT_CONFIG.description)}`,
    `LOCATION:${escapeICS(EVENT_CONFIG.location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "sathryx-workshop.ics";
  anchor.click();
  URL.revokeObjectURL(url);
});

function toICSDate(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

document.getElementById("shareBtn").addEventListener("click", async () => {
  const shareData = {
    title: EVENT_CONFIG.title,
    text: "SATHRYX — Generative AI + Python Workshop. Build With AI. Think Beyond Code.",
    url: window.location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (_) {}
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Event link copied to clipboard.");
    } catch (_) {
      showToast("Copy this page URL to share the event.");
    }
  }
});

/* Footer placeholders should never navigate to a fake destination. */
document.querySelectorAll("[data-placeholder-link]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showToast("Add the official SATHRYX link here before publishing.");
  });
});
