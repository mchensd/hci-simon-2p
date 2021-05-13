// 'web': localhost:4444
// run.sh: 'command'
var countDown = 0;
var player1 = null;
var player2 = null;
var paused = false; // for debugging only

var commands = [1,2,3]
var curCommand = 1;
var player1_curX;
var player1_curY;
var player1_curZ;
var player1_left_arm_curX;

var player2_curX;
var player2_curY;
var player2_curZ;
var player2_left_arm_curX;

var slideDist = 500; // 3.5 ft * 304.8 mm / ft
var warningMsg = 'Simon says: warning: stay social distanced!';
var cmd1Msg = 'Simon says: Slide to your right';
var cmd2Msg = 'Simon says: Slide to your left';
var cmd3Msg = 'Simon says: Hold your left arm out';

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
      $('h3.player1').html('Raise your right hand to be player 1')
      for (var idx of Object.keys(data.people)) {
        var keypoints = data.people[idx].keypoints
        if (keypoints.RElbow === undefined || keypoints.RWrist === undefined) {
          continue;
        }
        if (keypoints.RWrist[1] + 100 < keypoints.RElbow[1]) { // wrist is higher than elbow
          player1 = idx;
          $('h3.player1').html('Player 1: ready');
          $('h3.player2').html('Raise your right hand to be player 2');

          // player1_curX = data.people[idx].avg_position[0];
          // player1_curY = data.people[idx].avg_position[1];
          // player1_curZ = data.people[idx].avg_position[2];
          break;
        }
      }
    } else if (!(player1 in data.people)) {
      reset();
    } else if (player2 === null) { // detect player 2
      for (var idx of Object.keys(data.people)) {
        if (idx === player1) continue;
        var keypoints = data.people[idx].keypoints
        if (keypoints.RElbow === undefined || keypoints.RWrist === undefined) {

          continue;
        }
        console.log(keypoints.RWrist[1], keypoints.RElbow[1]);
        if (keypoints.RWrist[1] + 100 < keypoints.RElbow[1]) { // wrist is higher than elbow
          player2 = idx;
          curCommand = 3-curCommand;
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
    else { // both players are detected, display the command if socially distanced
      $('h3.player1').html('');
          $('h3.player2').html('');

      if (!(player1 in data.people) || !(player2 in data.people)) {
        reset();
      } else {
        var p1X = data.people[player1].avg_position[0];
        var p2X = data.people[player2].avg_position[0];
        // var p1X_left_arm = data.people[player1].keypoints.LWrist[0];
        var p1X_left_arm = data.people[player1].keypoints.LWrist[0];  
        var p2X_left_arm = data.people[player2].keypoints.LWrist[0];

        var distFt = Math.abs(p1X - p2X) / 304.8;
        if (distFt < 5) {
          $('h2.command').html(warningMsg);
          $('h3.subcmd').html('You are currently ' + distFt + ' feet apart');
          $('h4.p1status').html('');
          $('h4.p2status').html('');
          curCommand = 3-curCommand;
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

          var p1Msg = "Incomplete";
          var p2Msg = 'Incomplete';
          if (p1Good) p1Msg = 'Complete!';
          if (p2Good) p2Msg = 'Complete!';

          $('h4.p1status').html('Player 1: ' + p1Msg);
          $('h4.p2status').html('Player 2: ' + p2Msg);

          if (p1Good && p2Good) {
            $('h3.donemsg').html('Complete!');
            countDown = 15;
            // await sleep(2000);
            
            p1Good = false;
            p2Good = false;
            newCommand(data);
          }
        }
        else if (curCommand == 2) {
          $('p.debug1').html('p1X: ' + p1X);
          $('p.debug2').html('p1_curX: ' + player1_curX);
          $('p.debug3').html('p2X: ' + p2X);
          $('p.debug4').html('p2_curX: ' + player2_curX);

          $('h2.command').html(cmd2Msg);
          $('h3.subcmd').html('');

          console.log('p1X, ', p1X);
          console.log('p1curX', player1_curX);
          // console.log('p2X, ', p2X);
          // console.log('p2curX', player2_curX);
          if (p1X - player1_curX > slideDist) p1Good = true;
          if (p2X - player2_curX > slideDist) p2Good = true;

          var p1Msg = "Incomplete";
          var p2Msg = 'Incomplete';
          if (p1Good) p1Msg = 'Complete!';
          if (p2Good) p2Msg = 'Complete!';

          $('h4.p1status').html('Player 1: ' + p1Msg);
          $('h4.p2status').html('Player 2: ' + p2Msg);

          if (p1Good && p2Good) {
            $('h3.donemsg').html('Complete!');
            countDown = 15;
            // await sleep(2000);

            p1Good = false;
            p2Good = false;
            newCommand(data);
         }
        }
        else if (curCommand == 3) {
          
          $('p.debug1').html('p1X_left_arm: ' + p1X_left_arm);
          $('p.debug2').html('p1_left_arm_curX: ' + player1_left_arm_curX);
          $('p.debug3').html('p2X_left_arm: ' + p2X_left_arm);
          $('p.debug4').html('p2_left_arm_curX: ' + player2_left_arm_curX);

          $('h2.command').html(cmd3Msg);
          $('h3.subcmd').html('');

          if (p1X_left_arm - player1_left_arm_curX > slideDist) p1Good = true;
          if (p2X_left_arm - player2_left_arm_curX > slideDist) p2Good = true;

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
}

function newCommand(data) {
  curCommand = 3-curCommand
  getPlayerPositions(data);

}
function getPlayerPositions(data) {
  player1_curX = data.people[player1].avg_position[0];
  player1_curY = data.people[player1].avg_position[1];
  player1_curZ = data.people[player1].avg_position[2];
  player1_left_arm_curX = data.people[player1].keypoints.LWrist[0];

  player2_curX = data.people[player2].avg_position[0];
  player2_curY = data.people[player2].avg_position[1];
  player2_curZ = data.people[player2].avg_position[2];
  player2_left_arm_curX = data.people[player2].keypoints.LWrist[0];

  p1Good = false;
  p2Good = false;
}
function reset() {
  $('h3.player1').html('Raise your right hand to be player 1');
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