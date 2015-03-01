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
    var p1Index = document.getElementById("player-1-mode").selectedIndex;
    //player-2-mode
    var p2Index = document.getElementById("player-2-mode").selectedIndex;

    if ( p1Index === 0 )
      console.log("Human");
    else
      this.board.getPlayer(0).isAI = true;

    if ( p2Index === 0 )
      console.log("Human");
    else
      this.board.getPlayer(1).isAI = true;
  },

  updateGuessLocations : function() {
  	Game.elements.forEach(function(cells, row) {
  		cells.forEach(function(cell, col) {
 				if (Game.board.verifyMove(new Coordinate(row, col)))
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

  start : function() {
    Game.boardDimension = 8;
    Game.elements = [];
    Game.board = Board.init(Game.boardDimension);

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
            Game.updateTurnLabel(currentPlayer);
            Game.updateScoreLabel();
            Game.updateGuessLocations();

            if (Game.board.isGameOver()) {
              Game.gameOver();
              return;
            }
          }

          if ( (currentPlayer = Game.board.getCurrentPlayer()).isAI )
          {
            var move = currentPlayer.play(Game.board);

            Game.renderLine(move.getAllUpdatedCoordinates(), move.getPlayer());
            Game.updateTurnLabel(currentPlayer)
            Game.updateScoreLabel();
            Game.updateGuessLocations();
          }
        });
      });
    });


    var player;

    if ( (player = Game.board.getCurrentPlayer()).isAI )
    {
      var move = player.play(Game.board);

      Game.renderLine(move.getAllUpdatedCoordinates(), move.getPlayer());
      Game.updateTurnLabel(currentPlayer)
      Game.updateScoreLabel();
      Game.updateGuessLocations();
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
