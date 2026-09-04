import NewsletterSubscriber from "../models/newsletter.model.js";

/**
 * Public, unauthenticated. Deliberately idempotent: an email that's
 * already subscribed gets the same 201 and message as a fresh one, rather
 * than a "you're already subscribed" error — otherwise the endpoint
 * becomes an oracle anyone could use to test whether a given address is
 * on the list.
 */
export const subscribeToNewsletter = async (req, res) => {
  const { email } = req.body;

  await NewsletterSubscriber.updateOne(
    { email },
    { $setOnInsert: { email } },
    { upsert: true },
  );

  return res.status(201).json({
    success: true,
    message: "You're subscribed. Look out for the next one.",
  });
};
