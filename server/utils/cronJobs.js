const cron = require("node-cron");
const Document = require("../models/Document");
const User = require("../models/User"); // ✅ required for isOnline check
const {
  sendExpiringDocumentNotification
} = require("../controller/notificationController");

cron.schedule(
  //"* * * * *", //every mins once
  "0 * * * *", //every hours once
  async () => {
    console.log("🕒 Running document expiration check (every minute)…");

    const now = Date.now();
    const weekMs = 1000 * 60 * 60 * 24 * 7;
    const cutoff = new Date(now + weekMs);

    // Get documents with expiring sub-documents
    const parents = await Document.find({
      document: {
        $elemMatch: {
          expirationDate: {
            $ne: null,
            $gt: new Date(now),
            $lte: cutoff
          }
        }
      }
    });

    console.log(
      `Found ${parents.length} parent document(s) with expiring children.`
    );

    for (const parent of parents) {
      // ✅ Check if user is online before notifying
      const user = await User.findById(parent.user);
      if (!user || !user.isOnline) {
        console.log(
          `🚫 Skipping notification: User ${parent.user} is offline.`
        );
        continue;
      }

      // Notify for each expiring document
      for (const [idx, sub] of parent.document.entries()) {
        if (
          sub.expirationDate &&
          sub.expirationDate.getTime() > now &&
          sub.expirationDate.getTime() <= cutoff.getTime()
        ) {
          console.log(
            `📌 Notifying ${parent.user} about "${
              sub.documentName
            }" expiring at ${sub.expirationDate.toLocaleString()}`
          );

          await sendExpiringDocumentNotification(parent.user, idx);

          // Optional: Mark notified once to prevent repeated alerts
          // await Document.updateOne(
          //   { _id: parent._id, "document._id": sub._id },
          //   { $set: { "document.$.notified": true } }
          // );
        }
      }
    }
  },
  { timezone: "Asia/Kolkata" }
);
