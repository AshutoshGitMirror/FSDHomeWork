const form = document.getElementById("feedback-form");
const list = document.getElementById("feedback-list");
const statusMessage = document.getElementById("status-message");
const refreshButton = document.getElementById("refresh-button");

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = isError
    ? "status-message error"
    : "status-message";
}

function renderFeedback(items) {
  if (!items.length) {
    list.innerHTML =
      '<p class="empty-state">No feedback submitted yet.</p>';
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
        <article class="feedback-card">
          <div class="feedback-card-header">
            <div>
              <h3>${item.studentName}</h3>
              <p class="feedback-meta">${item.courseName}</p>
            </div>
            <span class="rating-pill">Rating ${item.rating}/5</span>
          </div>
          <p class="feedback-comments">${item.comments}</p>
          <div class="feedback-actions">
            <button class="delete-button" data-id="${item._id}" type="button">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadFeedback() {
  try {
    const response = await fetch("/feedback");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load feedback");
    }

    renderFeedback(data);
  } catch (error) {
    setStatus(error.message, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    setStatus("Submitting feedback...");

    const response = await fetch("/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit feedback");
    }

    form.reset();
    setStatus("Feedback submitted successfully.");
    await loadFeedback();
  } catch (error) {
    setStatus(error.message, true);
  }
});

refreshButton.addEventListener("click", () => {
  loadFeedback();
});

list.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-button");

  if (!button) {
    return;
  }

  try {
    const response = await fetch(`/feedback/${button.dataset.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete feedback");
    }

    setStatus("Feedback deleted.");
    await loadFeedback();
  } catch (error) {
    setStatus(error.message, true);
  }
});

loadFeedback();
