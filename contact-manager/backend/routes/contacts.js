import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

function normaliseTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildPayload(body) {
  return {
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company || "",
    tags: normaliseTags(body.tags),
    favorite: Boolean(body.favorite),
    notes: body.notes || "",
  };
}

router.get("/", async (req, res) => {
  try {
    const search = req.query.q?.trim();
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { company: { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const contacts = await Contact.find(query)
      .sort({ favorite: -1, updatedAt: -1 })
      .lean();

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch contacts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).lean();

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message || "Invalid contact id" });
  }
});

router.post("/", async (req, res) => {
  try {
    const contact = await Contact.create(buildPayload(req.body));
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to create contact" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      buildPayload(req.body),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to update contact" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete contact" });
  }
});

export default router;
