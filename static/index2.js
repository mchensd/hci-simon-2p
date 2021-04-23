var countDown = 0;
var player1 = null;
var player2 = null;
var paused = false; // for debugging only

var commands = [1]
var curCommand = null;
var player1_curX;
var player1_curY;
var player1_curZ;

var player2_curX;
var player2_curY;
var player2_curZ;

var slideDist = 500; // 3.5 ft * 304.8 mm / ft
var warningMsg = 'Simon says: warning: stay social distanced!';
var cmd1Msg = 'Simon says: Slide to your right';
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
    if (countDown > 0){
      countDown--;
      $('p.debug5').html('countdown '+ countDown);
      if (countDown == 0) {
        $('h3.donemsg').html('');

        p1Good = false;
        p2Good = false;
        newCommand(data);
      }
      return;
    }
    if (!paused) {
      // console.log(data)
    }
    if (!('people' in data)) {
      reset();
    }
    else if (player1 === null) {
      $('h3.player1').html('Player1: Raise your right hand')
      for (var idx of Object.keys(data.people)) {
        var keypoints = data.people[idx].keypoints
        if (keypoints.RElbow === undefined || keypoints.RWrist === undefined) {
          continue;
        }
        if (keypoints.RWrist[1] + 100 < keypoints.RElbow[1]) { // wrist is higher than elbow
          player1 = idx;
          $('h3.player1').html('Player1: ready');
          $('h3.player2').html('Player2: Raise your right hand');

          // player1_curX = data.people[idx].avg_position[0];
          // player1_curY = data.people[idx].avg_position[1];
          // player1_curZ = data.people[idx].avg_position[2];
          break;
        }
      }
    } else if (!(player1 in data.people)) {
      reset();
    } else if (player2 === null) {
      for (var idx of Object.keys(data.people)) {
        if (idx === player1) continue;
        var keypoints = data.people[idx].keypoints
        if (keypoints.RElbow === undefined || keypoints.RWrist === undefined) {
          continue;
        }
        if (keypoints.RWrist[1] + 100 < keypoints.RElbow[1]) { // wrist is higher than elbow
          player2 = idx;
          curCommand = commands[Math.floor(Math.random() * commands.length)];
          getPlayerPositions(data);

          $('h3.player2').html('Player2: ready');
          // await sleep(2000);
          $('h3.player1').html('');
          $('h3.player2').html('');
          $('h2.command').html(warningMsg);
          break;
        }
      }
    }
    else {
      if (!(player1 in data.people) || !(player2 in data.people)) {
        reset();
      } else {
        var p1X = data.people[player1].avg_position[0];
        var p2X = data.people[player2].avg_position[0];
        var distFt = Math.abs(p1X - p2X) / 304.8;
        if (distFt < 3) {
          $('h2.command').html(warningMsg);
          $('h3.subcmd').html('You are currently ' + distFt + ' feet apart');
          $('h4.p1status').html('');
          $('h4.p2status').html('');
          curCommand = commands[Math.floor(Math.random() * commands.length)];
          // console.log('curCommand: ', curCommand);
          getPlayerPositions(data);
          return;
        }
        if (curCommand == 1) { // move to the right
          $('p.debug1').html('p1X: ' + p1X);
          $('p.debug2').html('p1_curX: ' + player1_curX);
          $('p.debug3').html('p2X: ' + p2X);
          $('p.debug4').html('p2_curX: ' + player2_curX);
          
          $('h2.command').html(cmd1Msg);
          $('h3.subcmd').html('');
          
          console.log('p1X, ', p1X);
          console.log('p1curX', player1_curX);
          // console.log('p2X, ', p2X);
          // console.log('p2curX', player2_curX);
          if (player1_curX - p1X> slideDist) p1Good = true;
          if (player2_curX - p2X > slideDist) p2Good = true;

          $('h4.p1status').html('Player1 Done: ' + p1Good);
          $('h4.p2status').html('Player2 Done: ' + p2Good);

          if (p1Good && p2Good) {
            $('h3.donemsg').html('Complete!');
            countDown = 15;
            // await sleep(2000);
            
            p1Good = false;
            p2Good = false;
            newCommand(data);
          }
        }
      }
    }
  }
};

function newCommand(data) {
  curCommand = commands[Math.floor(Math.random() * commands.length)];
  getPlayerPositions(data);

}
function getPlayerPositions(data) {
  player1_curX = data.people[player1].avg_position[0];
  player1_curY = data.people[player1].avg_position[1];
  player1_curZ = data.people[player1].avg_position[2];
  
  player2_curX = data.people[player2].avg_position[0];
  player2_curY = data.people[player2].avg_position[1];
  player2_curZ = data.people[player2].avg_position[2];
  p1Good = false;
  p2Good = false;
}
function reset() {
  $('h3.player1').html('Player1: Raise your right hand');
  $('h3.player2').html('');
  $('h2.command').html('');
  $('h3.subcmd').html('');
  p1Good = false;
  p2Good = false;
  $('h4.p1status').html('');
  $('h4.p2status').html('');

  player1 = null;
  player2 = null;
  curCommand = null;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
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