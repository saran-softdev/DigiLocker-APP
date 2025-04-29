const admin = require("../config/firebase");
const Document = require("../models/Document");
const User = require("../models/User");

exports.sendExpiringDocumentNotification = async (userId, docIndex) => {
  console.log("userId", userId);
  console.log("docIndex", docIndex);

  try {
    const userDoc = await Document.findOne({ user: userId });
    if (!userDoc || !userDoc.document[docIndex]) {
      console.log(
        `❌ No document found for user ${userId} at index ${docIndex}`
      );
      return;
    }

    const doc = userDoc.document[docIndex];
    const user = await User.findById(userId);

    if (!user?.fcmToken) {
      console.log(`⚠️ No FCM token found for user ${user.email}`);
      return;
    }

    const payload = {
      notification: {
        title: `⚠️ ${doc.documentName} is expiring soon. Please renew it.`,
        body: `Expires on ${new Date(doc.expirationDate).toLocaleDateString()}`
      },
      token: user.fcmToken
    };

    const response = await admin.messaging().send(payload);

    console.log(
      `✅ Notification sent to ${user.email} for "${doc.documentName}"`
    );
    console.log(`📨 Message ID: ${response}`);
  } catch (err) {
    console.error(
      `❌ Failed to send notification for user ${userId}:`,
      err.message
    );
  }
};
