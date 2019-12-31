/* Realtime database */

var config = {
  apiKey: "AIzaSyC4DqzoorkuN56sSf92jJXVubVQDhcr_D0y",
  authDomain: "jsa-event-planner.firebaseapp.com",
  databaseURL: "https://jsa-event-planner.firebaseio.com",
  storageBucket: "bucket.appspot.com"
};
firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();



/* Google sign-in to authenticate users */

firebase.auth().getRedirectResult().then(function(result) {
  if (result.credential) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    // TODO: Needed?
    //var token = result.credential.accessToken;

    // Get user ID
    var userId = firebase.auth().currentUser.uid;

    // Check if user exists in database
    var userData = firebase.database.ref('/users/' + userId);
    return userData.once('value').then(function(snapshot) {
      if (!snapshot.exists()) {
        // TODO: Call modal and prompt, then set stuff

        // Get user info
        var user = result.user;

        userData.set({
          name: "",
          position: ""
        })
      }
    });
  }
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  alert("Oh no! Something bad happened. Please try again.\nFOR DEBUG PURPOSES\nError code: " + errorCode + "\nError message: " + errorMessage + "\nUser email: " + email + "\nAuthorization credential: " + credential);
});

// Check for user sign-in
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
  } else {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }
});



/* Vue.js */

var vm = new Vue({
  el: '#app',
  
})