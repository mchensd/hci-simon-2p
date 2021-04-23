var player = null;
var paused = false; // for debugging only
var commands = Array(1);
var curCommand = null;
var curX = null;
var curY = null;
var curZ = null;
function pause() {
  paused = !paused;
  if (paused) {
    $('button.pause').html('Resume')
  } else {
    $('button.pause').html('Pause')
  }
}

$(document).ready(function() {
    twod.start();
    frames.start();
});

var twod = {
  socket: null,
  start: function() {
    var url = "ws://" + location.host + "/twod";
    twod.socket = new WebSocket(url);
    twod.socket.onmessage = function(event) {
      twod.process(JSON.parse(event.data));
    }
  },

  process: function(data) {
    if (!paused){
      $('img.twod').attr("src", 'data:image/pnjpegg;base64,'+data.src);
    }
  }
};

var frames = {
  socket: null, 
  start: function() {
    var url = "ws://" + location.host + "/frames";
    frames.socket = new WebSocket(url);
    frames.socket.onmessage = function(event) {
      frames.process(JSON.parse(event.data));
    }
  },

  process: function(data) {
    if (!paused) {
      console.log(data)
    }

    if (player === null) {
      $('h3.distance').html('Raise your right hand to get started')
      if ('people' in data) {
        for (var idx of Object.keys(data.people)) {
          var keypoints = data.people[idx].keypoints
          if (keypoints.RElbow === undefined || keypoints.RWrist === undefined) {
            continue;
          }
          if (keypoints.RWrist[1] + 100 < keypoints.RElbow[1]) { // wrist is higher than elbow
            player = idx;
            curCommand = commands[Math.floor(Math.random() * commands.length];
            curX = 
            break;
          }
        }
      }
    }
    else {
      if (!('people' in data)) {
        player = null;
      } else if (!(player in data.people)) {
        player = null; 
      } else {
        var Zdist = data.people[player].avg_position[2]
        if (curCommand == 1) { // move to the right
          
        }
      }
    }
    

    
  }
};

// function pause(obj) {
//   if (obj.className === 'pauseData') {
//     dataPaused = !dataPaused;
//   } else if (obj.className === 'pauseImg') {
//     imgPaused = !imgPaused;
//   }

//   if (dataPaused) {
//     $('button.pauseData').html('Resume Data')
//   } else {
//     $('button.pauseData').html('Pause Data')
//   }

//   if (imgPaused) {
//     $('button.pauseImg').html('Resume Image Feed')
//   } else {
//     $('button.pauseImg').html('Pause Image Feed')
//   }
// }