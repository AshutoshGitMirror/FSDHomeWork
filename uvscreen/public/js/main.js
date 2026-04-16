// ── Sunscreen Advisor — Client-side JavaScript ──────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // ── Form validation ───────────────────────────────────────────────────
  const form = document.getElementById("uv-form");
  const latInput = document.getElementById("lat");
  const lngInput = document.getElementById("lng");

  if (form) {
    form.addEventListener("submit", (e) => {
      const lat = parseFloat(latInput.value);
      const lng = parseFloat(lngInput.value);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        e.preventDefault();
        shakeInput(latInput);
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        e.preventDefault();
        shakeInput(lngInput);
        return;
      }

      // Show loading state on button
      const btn = document.getElementById("btn-check");
      btn.innerHTML = '<span class="btn-icon">⏳</span> Checking UV…';
      btn.disabled = true;
    });
  }

  // ── Shake animation helper ────────────────────────────────────────────
  function shakeInput(input) {
    input.style.borderColor = "#ef4444";
    input.style.animation = "none";
    input.offsetHeight; // trigger reflow
    input.style.animation = "shake 0.4s ease";
    input.focus();
    setTimeout(() => {
      input.style.borderColor = "";
      input.style.animation = "";
    }, 800);
  }

  // ── Add shake keyframe dynamically ────────────────────────────────────
  if (!document.getElementById("shake-style")) {
    const style = document.createElement("style");
    style.id = "shake-style";
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%      { transform: translateX(-6px); }
        40%      { transform: translateX(6px); }
        60%      { transform: translateX(-4px); }
        80%      { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Stagger animation delays on chart bars ────────────────────────────
  const bars = document.querySelectorAll(".chart-bar");
  bars.forEach((bar, i) => {
    bar.style.setProperty("--bar-delay", i);
  });
});
