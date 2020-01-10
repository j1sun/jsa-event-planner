const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.changePhase = functions.database.ref("/info/phaseChangeVotes")
  .onUpdate((change, context) => {
    var db = admin.database();
    if (change.after.val() >= 3) {
      return db.ref("info/phase").once("value").then(function(snapshot) {
        db.ref("info/phase").set(snapshot.val() + 1);
        return admin.database().ref("info/phaseChangeVotes").set(0);
      });
    }
  });