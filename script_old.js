// Variables

// Stores all users
// TODO change this to store into firebase and stuff
var users = {};

var name, position;

// Keeps track of current phase
var currentPhase = 0;


// Popup registration on load
function popupReg() {
  // TODO: Remove
  return;
  $('#regUser').modal();
  if (currentPhase !== 0) {
    document.getElementById("userErrors").innerHTML = "<div class='alert alert-info' role='alert'>Not in Phase 0; new users cannot be added.</div>";
  }
}

// Check if "Officer" is selected
function checkOfficer() {
  if (document.getElementById("position").selectedIndex === 2) {
    document.getElementById("passwordForm").innerHTML = "<label for='password'>Officer Password</label><input type='password' class='form-control' id='password'>";
  } else {
    document.getElementById("passwordForm").innerHTML = "";
  }
}

// Verify user
function checkUser() {

  // Clear errors
  document.getElementById("userErrors").innerHTML = "";

  // Check name
  name = document.getElementById("name").value;
  if (name === "") {
    document.getElementById("userErrors").innerHTML = "<div class='alert alert-danger' role='alert'>Name cannot be empty.</div>";
    return;
  } else {
    for (var user in users) {
      if (user === name) {
        document.getElementById("userErrors").innerHTML = "<div class='alert alert-danger' role='alert'>Username already exists.</div>";
        return;
      }
    }
  }

  // Check position
  position = document.getElementById("position").value;
  if (position === "Select position") {
    document.getElementById("userErrors").innerHTML = "<div class='alert alert-danger' role='alert'>Select a position.</div>";
    return;
  } else if (position === "Officer" && !checkPassword()) {
    document.getElementById("userErrors").innerHTML = "<div class='alert alert-danger' role='alert'>Invalid password.</div>";
    return;
  }

  // Add to users
  // TODO: Implement firebase support and allow dynamic username updates
  // Maybe also bold user's name to that they know who they are and alphabetize
  // Might want to add option for users to rejoin if disconnected or something (currently pops up info alert if not in phase 0)
  users[name] = position;
  document.getElementById("userList").innerHTML += "<li class='list-group-item text-wrap'><b>" + name + " (<i>" + position + '</i>)</b></li>';

  // Close modal
  $('#regUser').modal('hide');
}

// Checks password
// TODO: Implement and encrypt
function checkPassword() {
  return true;
}


// Changes phase
function changePhase() {
  currentPhase++;
  document.getElementById("currentPhase").innerHTML = currentPhase;
  document.getElementById("nextPhase").innerHTML = currentPhase + 1;

  switch (currentPhase) {
    case 1:
      executePhase1();
      break;
  }
}

// Begins phase 1
function executePhase1() {
  document.getElementById("events").innerHTML += " \
  <div class='d-flex p-2 align-items-baseline'> \
  <h3>Events</h3> \
  <button type='button' class='btn btn-outline-primary mx-4' data-toggle='modal' data-target='#suggestModal'>Suggest Event</button> \
  </div> \
  <ul class='list-group text-break'> \
  <li class='list-group-item'><span class='badge badge-danger mr-4' data-toggle='modal' data-target='#deleteEventModal'>X</span>Bonfire</li> \
  <li class='list-group-item'>Bonfire</li> \
  <li class='list-group-item'>Bonfire Bonfire Bonfire Bonfire Bonfire Bonfire Bonfire </li> \
  </ul>";
}

// Suggests an event
function suggestEvent() {
  // TODO
}

// Deletes an event
function deleteEvent() {
  // TODO
}