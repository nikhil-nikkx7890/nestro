import ContactSubmission from "../models/contact.model.js";

// Deliberately minimal per ADR-041 — stores the submission only, no email
// integration. Public, unauthenticated: anyone should be able to reach out.
export const createContactSubmission = async (req, res) => {
  const { name, email, message } = req.body;

  await ContactSubmission.create({ name, email, message });

  return res.status(201).json({
    success: true,
    message: "Thanks for reaching out — we'll get back to you soon.",
  });
};
