//
// Othello
//


//
// Initialization after the page is loaded
//
Game = {

  boardDimension: 8,
	elements: [],
	board: null,

  getGameMode : function() {
    //player-1-mode
    this.board.getPlayer(0).isAI =
      document.getElementById("player-1-mode").selectedIndex;
    this.board.getPlayer(0).limit = document.getElementById("P1-limit");
    //player-2-mode
    this.board.getPlayer(1).isAI =
      document.getElementById("player-2-mode").selectedIndex;
    this.board.getPlayer(1).limit = document.getElementById("P2-limit");
  },

  updateGuessLocations : function() {
  	Game.elements.forEach(function(cells, row) {
  		cells.forEach(function(cell, col) {
 				if (Game.board.verifyMove(new Coordinate(row, col), Game.board.getBoard()))
 					cell.renderGuess(true);
 				else
		 		  cell.renderGuess(false);
  		});
  	});
  },

	updateTurnLabel : function(player) {
		$("#turn").html("");
    var imageSrc = 'images/' + player.toString() + '.png';
    var image = $('<img>').attr('src', imageSrc);
		$("#turn").prepend(image).prepend(player.toString());
	},

	updateScoreLabel : function() {
		var player = Game.board.getCurrentPlayer();
		var scoreLabelId = player.scoreLabelId;
		var score = player.score;
		var playerString = player.toString();
		$("#" + scoreLabelId).html(score);
		scoreLabelId = player.other.scoreLabelId;
		score = player.other.score;
		playerString = player.other.toString();
		$("#" + scoreLabelId).html(score);
	},

  renderPiece : function(player, row, col) {
    this.elements[row][col].html("");
    var imageSrc = 'images/' + player.toString() + '.png';
    var image = $('<img>').attr('src', imageSrc);
    this.elements[row][col].prepend(image);
  },

  showNodeCount : function(player, count) {
    $("#"+ player.scoreLabelId +"-Node-Count").html(count);
  },

  start : function() {
    Game.boardDimension = 8;
    Game.elements = [];
    Game.board = new Board(Game.boardDimension);

    for (var row = 0; row < Game.boardDimension; row++) {
    	Game.elements.push(Array.dim(Game.boardDimension).map(function () {
    		var box = $("<div>");
    		box.addClass("box");
    		$("#board").append(box);
    		return box;
    	}));
    }

    Game.renderPiece(Game.board.getPlayer(0), 3, 3);
    Game.renderPiece(Game.board.getPlayer(1), 3, 4);
    Game.renderPiece(Game.board.getPlayer(1), 4, 3);
    Game.renderPiece(Game.board.getPlayer(0), 4, 4);

  	Game.updateTurnLabel(Game.board.getCurrentPlayer());
  	Game.updateScoreLabel();

  	// attach renderGuess methods to elements
  	Game.elements.forEach(function(cells, row) {
  		cells.forEach(function(cell, col) {
  			cell.renderGuess = function (switchOn) {
  				if (switchOn) {
  					cell.addClass("guess");
  				} else {
  					cell.removeClass("guess");
  				}
  			};
  		});
  	});

  	// attach render methods to elements
  	Game.elements.forEach(function(cells, row) {
  		cells.forEach(function(cell, col) {
  			cell.render = function (player) {
          cell.renderGuess(false);
          Game.renderPiece(player, row, col);
  			};
  		});
  	});

    // attach deRender methods to elements
    Game.elements.forEach(function(cells, row) {
      cells.forEach(function(cell, col) {
        cell.deRender = function () {
          cell.html("");
        };
      });
    });

    Game.updateGuessLocations();

    Game.getGameMode();
    // if both are AI, then start playing the game.
    // if one if AI, the get the click function and the other is AI.

    Game.elements.forEach(function(cells, row, elements) {
      cells.forEach(function(cell, col) {
        cell.click(function() {
          var coordinate = new Coordinate(row,col);

          var currentPlayer = Game.board.getCurrentPlayer();

          if (Game.getElementAt(coordinate).hasClass("guess")) {
            var move = currentPlayer.play(coordinate);

            Game.renderLine(move.getAllUpdatedCoordinates(), move.getPlayer());
            Game.updateTurnLabel(Game.board.getCurrentPlayer());
            Game.updateScoreLabel();
            Game.updateGuessLocations();

            if (Game.board.isGameOver(Game.board.getBoard(), true)) {
              Game.gameOver();
              return;
            }
          }

          if ( (currentPlayer = Game.board.getCurrentPlayer()).isAI !== 0 )
          {
            setInterval(function(){
              var aiMove = currentPlayer.play(Game.board);
              var move = aiMove.move;

              Game.showNodeCount(currentPlayer, aiMove.nodes);
              Game.renderLine(move.getAllUpdatedCoordinates(), move.getPlayer());
              Game.updateTurnLabel(Game.board.getCurrentPlayer());
              Game.updateScoreLabel();
              Game.updateGuessLocations();

              if (Game.board.isGameOver(Game.board.getBoard())) {
                Game.gameOver();
                return;
              }
            }, 2500);
          }
        });
      });
    });


    var player;

    if ( (player = Game.board.getCurrentPlayer()).isAI !== 0 )
    {
      if ( player.other.isAI !== 0 )
      {
        var int = setInterval(function(){
          player = Game.board.getCurrentPlayer();
          var aiMove = player.play(Game.board);
          var move = aiMove.move;

          Game.showNodeCount(player, aiMove.nodes);
          Game.renderLine(move.getAllUpdatedCoordinates(), move.getPlayer());
          Game.updateTurnLabel(Game.board.getCurrentPlayer())
          Game.updateScoreLabel();
          Game.updateGuessLocations();

          if (Game.board.isGameOver(Game.board.getBoard())) {
            Game.gameOver();
            clearInterval(int);
            return;
          }
        }, 2500);
      }
      else
      {
          var aiMove = player.play(Game.board);
          var move = aiMove.move;

          Game.showNodeCount(player, aiMove.nodes);
          Game.renderLine(move.getAllUpdatedCoordinates(), move.getPlayer());
          Game.updateTurnLabel(Game.board.getCurrentPlayer())
          Game.updateScoreLabel();
          Game.updateGuessLocations();
      }
    }
  },

  getElementAt : function (coordinate) {
    return Game.elements[coordinate.getRow()][coordinate.getColumn()];
  },

  //takes a list of coordinates and what player to render
  renderLine : function (coordinates, player) {
    coordinates.forEach( function (coordinate, index, coordinates) {
      Game.getElementAt(coordinate).render(player);
    })
  },

  gameOver : function () {
    if (Game.board !== null )
    {
      var winner = Game.board.getWinner();
      var outcome = $("#outcome");
      outcome.html("Winner: " + winner.toString());
      this.updateTurnLabel(winner);
    }

    var reset = document.createElement('button');
    reset.id = 'restart-button';
    reset.name = 'Restart';
    reset.innerHTML = 'Restart';
    reset.class = '.btn';
    reset.onclick = Game.reset;

    var out = document.getElementById('outcome');
    out.appendChild(document.createElement('br'));
    out.appendChild(reset);
  },

  reset : function() {
    $("#board").empty();
    $("#outcome").empty();
    Game.start();
  }

};

$(document).ready(Game.gameOver);
