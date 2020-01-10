// Get a reference to the database service
var db = firebase.database();

// Stores current userID
var userId;

// Is officer
var isOfficer = false;

// Prevent scrolling as page loads
(function () {
  document.body.setAttribute("style", "overflow: hidden;");
})();

// Check for user sign-in
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // Get user ID
    userId = user.uid;

    // Check if user exists in database
    return db.ref('/users/' + userId).once('value').then(function(snapshot) {

      // Remove loading screen
      (function() {
        document.getElementById("loadingbkgd").setAttribute("class", "d-none");
        document.body.removeAttribute("style");
      })();

      // Check for existing user
      if (!snapshot.exists()) {
        // Call modal and prompt
        $('#regUser').modal();
      }
    });

  } else {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }
});

/**
 * Registration Modal Functions
 */

// Check if "Officer" is selected in registration modal
function checkOfficer() {
  if (document.getElementById("userPosition").selectedIndex === 2) {
    document.getElementById("passwordForm").innerHTML = "<label for='password'>Officer Password</label><input type='password' class='form-control' id='password'>";
  } else {
    document.getElementById("passwordForm").innerHTML = "";
  }
}

// Checks password in registration modal
// TODO: Implement and encrypt
function checkPassword() {
  var passElement = document.getElementById("password");
  if (passElement === null) return false;
  var pass = passElement.value, hash = 0, i, chr;
  for (i = 0; i < pass.length; i++) {
    chr   = pass.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash === -1548707530;
}

// Verify user in registration modal
function checkUser(userName, userPosition) {

  // Clear errors
  document.getElementById("userErrors").innerHTML = "";

  // Check for blank name
  if (userName === "") {
    document.getElementById("userErrors").innerHTML = "<div class='alert alert-danger' role='alert'>Name cannot be empty.</div>";
    return;
  }

  // Check position
  if (userPosition === "Select position") {
    document.getElementById("userErrors").innerHTML = "<div class='alert alert-danger' role='alert'>Select a position.</div>";
    return;
  } else if (userPosition === "Officer" && !checkPassword()) {
    document.getElementById("userErrors").innerHTML = "<div class='alert alert-danger' role='alert'>Invalid password.</div>";
    return;
  }

  // Set user name and position
  db.ref("/users/" + userId).set({
    name: userName,
    position: userPosition
  });

  // Close modal
  $('#regUser').modal('hide');
}

// Vote for a phase change
function voteChangePhase() {
  document.getElementById("voteButton").setAttribute("disabled", "");
  var ref = db.ref("info/phaseChangeVotes");
  ref.transaction(function (votes) {
    return votes + 1;
  });
}

// Listen for phase changes
var phaseListener = db.ref("info/phase").on("value", function(snapshot) {
  var phase = snapshot.val();

  // Generate phase header
  phaseGenerator(phase);

  // execute new phase
  executePhase(phase);
});

// Listen for phase change votes
var phaseChangeVotesListener = db.ref("info/phaseChangeVotes").on("value", function(snapshot) {
  document.getElementById("phaseChangeVotes").innerHTML = snapshot.val();
  if (snapshot.val() === 0) {
    document.getElementById("voteButton").removeAttribute("disabled");
  }
});

// Open suggestion modal
function suggestModal() {
  $('#suggestModal').modal();
}

// Suggest event
function suggestEvent(eventName) {

  document.getElementById("eventSuggestion").value = "";

  var eventData = {
    calLink: "",
    fbLink: "",
    image: "",
    location: "",
    votes: 0,
    leaders: ""
  }

  db.ref("events/" + eventName).set(eventData);

  // Close modal
  $('#suggestModal').modal('hide');
}

// Submit votes
function submitVote(eventNum) {
  db.ref("events/" + document.querySelector("#event" + eventNum + " div span").textContent + "/votes").transaction(function(votes) {
    return votes + 1;
  });
}

// Set date
function setDate(eventNum) {
  var eventRef = document.getElementById("event" + eventNum);
  var year = eventRef.querySelector(".form-row .year input").value;
  var month = eventRef.querySelector(".form-row .month input").value;
  var date = eventRef.querySelector(".form-row .date input").value;
  if (year === "" || month === "" || date === "") {
    alert("Make sure the date is not empty.");
    return;
  }
  var date = year + "-" + month + "-" + date + "T00:00:00";
  db.ref("events/" + eventRef.querySelector("div span").textContent + "/date").set(date);
}

// Volunteer as leader
function volunteerLeader(eventNum) {
  db.ref("users/" + userId + "/name").once("value").then(function (snapshot) {
    var name = snapshot.val();
    db.ref("events/" + document.querySelector("#event" + eventNum + " div span").textContent + "/leaders").transaction(function(leaders) {
      if (leaders.indexOf(name) !== -1) return leaders;
      if (leaders === "") return name;
      return leaders + ", " + name;
    });
  });
}

// Generate phases
function phaseGenerator(phase) {
  var phaseRef = document.getElementById("currentPhase");
  phaseRef.innerHTML = "";
  switch(phase) {
    case 5:
      phaseRef.insertAdjacentHTML("afterbegin", "<li class='breadcrumb-item'>Results</li>");
    case 4:
      phaseRef.insertAdjacentHTML("afterbegin", "<li class='breadcrumb-item'>Choosing leaders</li>");
    case 3:
      phaseRef.insertAdjacentHTML("afterbegin", "<li class='breadcrumb-item'>Setting dates</li>");
    case 2:
      phaseRef.insertAdjacentHTML("afterbegin", "<li class='breadcrumb-item'>Voting</li>");
    case 1:
      phaseRef.insertAdjacentHTML("afterbegin", "<li class='breadcrumb-item'>Suggesting</li>");
    case 0:
      phaseRef.insertAdjacentHTML("afterbegin", "<li class='breadcrumb-item'>Setup</li>");
  }
  phaseRef.insertAdjacentHTML("afterbegin", "<strong class='mr-1'>Current Phase: </strong>");

}

// Generate Event List
var eventsListener;
function generateEvents(phase) {
  // No generation for phase 0
  if (phase < 1) return;

  eventsListener = db.ref("events").on("value", function(snapshot) {

    if (phase >= 3) generateCalendar();

    document.getElementById("eventInfo").innerHTML = "<h4 class='d-inline'>Events</h4> \
      <ul id='events' class='list-group'></ul>";

    // Generate buttons for phases
    if (phase === 1) {
      // Suggest event button
      document.getElementById("events").insertAdjacentHTML("beforebegin", "<button type='button' class='btn btn-outline-primary d-inline m-2' onclick='suggestModal()'>Suggest Event</button>");
    }

    var i = 0;
    snapshot.forEach(function(childSnapshot) {
      document.getElementById("events").insertAdjacentHTML("beforeend", " \
      <li class='list-group-item' id='event" + i + "'> \
        <div class='d-flex justify-content-between align-items-baseline font-weight-bold'> \
          <span>" + childSnapshot.key + "</span> \
        </div> \
      </li>");

      // Insert date if it has been set
      if (childSnapshot.child("date").exists()) {
        var date = moment(childSnapshot.child("date").val(), "YYYY-MM-DDTHH:mm");
        document.querySelector("#event" + i + " div").insertAdjacentHTML("beforeend", "<span class='text-primary'>" + date.format("MMM D") + "</span>");
      } else if (phase === 3 && isOfficer) {
        document.querySelector("#event" + i).insertAdjacentHTML("beforeend", " \
        <span class='text-muted mt-2'>Set Date:</span> \
        <div class='form-row mb-2'> \
          <div class='col year'> \
            <input type='text' class='form-control form-control-sm' placeholder='YYYY' value='2020'> \
          </div> \
          <div class='col month'> \
            <input type='text' class='form-control form-control-sm' placeholder='MM'> \
          </div> \
          <div class='col date'> \
            <input type='text' class='form-control form-control-sm' placeholder='DD'> \
          </div> \
        </div> \
        <button type='button' class='btn btn-primary btn-sm' onclick='setDate(" + i + ")'>Set</button>");
      }

      // Insert leaders if it has been set
      if (phase >= 4) {
        document.querySelector("#event" + i).insertAdjacentHTML("beforeend", "<div class='my-2'>Leaders: " + childSnapshot.child("leaders").val() + "</div>");
        if (phase === 4) document.querySelector("#event" + i).insertAdjacentHTML("beforeend", "<button type='button' class='btn btn-outline-primary d-inline m-2' onclick='volunteerLeader(" + i + ")'>Volunteer</button>");
      }

      // Insert vote option if in vote phase
      if (phase === 2) {
        document.querySelector("#event" + i).insertAdjacentHTML("beforeend", "<button type='button' class='btn btn-outline-primary d-inline m-2' onclick='submitVote(" + i + ")'>Vote</button>");

        document.querySelector("#event" + i).insertAdjacentHTML("beforeend", " \
        <span>Votes: " + childSnapshot.child("votes").val() + "</span>");
      }
      i++;
    });
  });
}

// Generate quarter calendar
function generateCalendar() {
  // Get start and end dates of quarter
  db.ref("info/dates").once("value").then(function(snapshot) {
    // Setup calendar table and header
    document.getElementById("calInfo").innerHTML = "<h4>Calendar</h4> \
    <table id='cal' class='table table-hover text-wrap'> \
      <thead> \
        <tr> \
          <th scope='col' class='table-bordered'>Week</th> \
          <th scope='col' class='table-danger'>S</th> \
          <th scope='col' class='table-secondary'>M</th> \
          <th scope='col' class='table-secondary'>T</th> \
          <th scope='col' class='table-secondary'>W</th> \
          <th scope='col' class='table-secondary'>T</th> \
          <th scope='col' class='table-secondary'>F</th> \
          <th scope='col' class='table-info'>S</th> \
        </tr> \
      </thead> \
    </table>";

    var startDate = moment(snapshot.child("startDate").val(), "YYYY-MM-DD", true);
    var endDate = moment(snapshot.child("endDate").val(), "YYYY-MM-DD", true);

    // Comparison date
    var date = moment(startDate);
    // Week X
    var i = 1;
    // Month color
    var monthbkgd = "table-light";
    // Generate table body
    document.getElementById("cal").innerHTML += "<tbody id='calBody'>";
    while (date.isBefore(endDate, "day")) {
      // Sets date to Sunday if not already
      if (date.day() !== 0) {
        date.day(0);
      }

      // Generate table row
      document.getElementById("calBody").innerHTML += "<tr id='week" + i + "'>";
      // Generate table week
      document.getElementById("week" + i).innerHTML += "<th scope='row' class='table-bordered'>" + i + "</th>";

      // Generate days of week
      for (var j = 0; j < 7; j++) {
          document.getElementById("week" + i).innerHTML += "<td id='" + date.format("MMDD") + "' class='" + monthbkgd + "'>" + date.date() + "</td>";

        // Insert month if first of month
        if (date.date() === 1) {
          document.getElementById("week" + i).querySelector("th").insertAdjacentText("beforeend", " (" + date.format("MMM") + ")");
        } else if (date.isSame(startDate)) {
          document.getElementById("week" + i).querySelector("th").insertAdjacentText("beforeend", " (" + date.format("MMM") + ")");
        }

        // Increment date
        date.add(1, "d"); 
      }

      // Generate end of table row
      document.getElementById("calBody").innerHTML += "</tr>";

      // Increment week number
      i++;
    }

    // Generate end of table body
    document.getElementById("cal").innerHTML += "</tbody>";

    // Loop through events and color dates
    db.ref("events").once("value").then(function(snapshot) {
      snapshot.forEach(function (childSnapshot) {
        if (childSnapshot.child("date").exists()) {
          var date = moment(childSnapshot.child("date").val(), "YYYY-MM-DDTHH:mm");
          document.getElementById(date.format("MMDD")).setAttribute("class", "table-primary");
        }
      });
    });
  });
}

// Generate current users
var usersListener = db.ref("users").on("value", function(snapshot) {
  document.getElementById("usersInfo").innerHTML = "<h4>Current Users</h4> \
    <ul id='users' class='list-group'></ul>";

  snapshot.forEach(function(childSnapshot) {
    var placement = "beforeend";
    if (childSnapshot.key === userId) {
      if (childSnapshot.child("position").val() === "Officer") isOfficer = true;
      else document.getElementById("voteButton").setAttribute("hidden", "");
      placement = "afterbegin";
    }
    document.getElementById("users").insertAdjacentHTML(placement, " \
    <li class='list-group-item' id='" + childSnapshot.key + "'> \
      <div class='d-flex justify-content-between'> \
        <span>" + childSnapshot.child("name").val() + "</span> \
        <span class='text-muted'>" + childSnapshot.child("position").val() + "</span> \
      </div> \
    </li>");

    if (placement === "afterbegin") {
      document.querySelector("#" + childSnapshot.key + " span").setAttribute("class", "font-weight-bold");
    }
  });
});

// Phase execution
function executePhase(phase) {
  generateEvents(phase);

  if (phase === 5) {
    document.getElementById("voteButton").setAttribute("hidden", ""); 
  }
}