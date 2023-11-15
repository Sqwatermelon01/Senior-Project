const admin = require("firebase-admin");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
admin.initializeApp();


const db = admin.firestore();
exports.DailyScoresCleanup = onSchedule("every day 08:00", async (event) => {
    const querySnapshot = await db.collection("DailyScores")
    .where("score", ">", 0).get();
    const promises = [];
        querySnapshot.forEach((doc) => {
            promises.push(doc.ref.delete());
        });
        logger.log("DailyScores reset finished");
        return Promise.all(promises);
});

exports.MonthlyScoresSubmitReset = onSchedule("every day 08:00", async (event) => {
    const querySnapshot = await db.collection("MonthlyScores")
    .where("dailySubmission", "=", true).get();
    const promises = [];
        querySnapshot.forEach((doc) => {
            promises.push(doc.ref.update({dailySubmission: false}));
        });
        logger.log("Daily submission for monthly scores reset finished");
        return Promise.all(promises);
});

exports.MonthlyScoresCleanup = onSchedule("0 0 1 * *", async (event) => {
    const querySnapshot = await db.collection("MonthlyScores")
    .where("score", ">", 0).get();
    const promises = [];
        querySnapshot.forEach((doc) => {
            promises.push(doc.ref.delete());
        });
        logger.log("MonthlyScores reset finished");
        return Promise.all(promises);
});
