import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3004/api/contacts";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  tags: "",
  favorite: false,
  notes: "",
};

function App() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadContacts(query = "") {
    setLoading(true);
    setError("");

    try {
      const url = query
        ? `${API_BASE_URL}?q=${encodeURIComponent(query)}`
        : API_BASE_URL;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load contacts");
      }

      setContacts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadContacts(search);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEdit(contact) {
    setEditingId(contact._id);
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company || "",
      tags: (contact.tags || []).join(", "),
      favorite: Boolean(contact.favorite),
      notes: contact.notes || "",
    });
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_BASE_URL}/${editingId}` : API_BASE_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save contact");
      }

      resetForm();
      await loadContacts(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this contact?");
    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete contact");
      }

      if (editingId === id) {
        resetForm();
      }

      await loadContacts(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <main className="layout">
        <section className="hero-panel">
          <p className="eyebrow">React + Express + MongoDB</p>
          <h1>Contact Manager</h1>
          <p className="hero-copy">
            Add, search, edit, and delete contacts from a MongoDB-backed
            address book.
          </p>
        </section>

        <section className="panel form-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">
                {editingId ? "Update a saved contact" : "Create a new contact"}
              </p>
              <h2>{editingId ? "Edit Contact" : "New Contact"}</h2>
            </div>
            {editingId ? (
              <button className="ghost-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Alex Morgan"
                required
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="alex@example.com"
                required
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="+91 98765 43210"
                required
              />
            </label>

            <label>
              Company
              <input
                name="company"
                value={form.company}
                onChange={updateField}
                placeholder="Northwind Labs"
              />
            </label>

            <label className="full-width">
              Tags
              <input
                name="tags"
                value={form.tags}
                onChange={updateField}
                placeholder="friend, work, vendor"
              />
            </label>

            <label className="full-width notes-field">
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                rows="4"
                placeholder="Met at the product meetup. Prefers WhatsApp."
              />
            </label>

            <label className="favorite-toggle">
              <input
                name="favorite"
                type="checkbox"
                checked={form.favorite}
                onChange={updateField}
              />
              Mark as favorite
            </label>

            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Contact" : "Save Contact"}
            </button>
          </form>
        </section>

        <section className="panel list-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Saved records</p>
              <h2>Contacts</h2>
            </div>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, company, or tag"
            />
          </div>

          {error ? <p className="status error">{error}</p> : null}
          {loading ? <p className="status">Loading contacts...</p> : null}

          {!loading && contacts.length === 0 ? (
            <p className="status">No contacts found.</p>
          ) : null}

          <div className="contact-list">
            {contacts.map((contact) => (
              <article className="contact-card" key={contact._id}>
                <div className="contact-card-top">
                  <div>
                    <div className="name-row">
                      <h3>{contact.name}</h3>
                      {contact.favorite ? (
                        <span className="favorite-badge">Favorite</span>
                      ) : null}
                    </div>
                    <p>{contact.email}</p>
                    <p>{contact.phone}</p>
                    {contact.company ? <p>{contact.company}</p> : null}
                  </div>
                </div>

                {contact.tags?.length ? (
                  <div className="tag-row">
                    {contact.tags.map((tag) => (
                      <span className="tag" key={`${contact._id}-${tag}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {contact.notes ? <p className="notes-copy">{contact.notes}</p> : null}

                <div className="card-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => startEdit(contact)}
                  >
                    Edit
                  </button>
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => handleDelete(contact._id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
