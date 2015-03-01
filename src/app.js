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

    Game.elements.forEach(function(cells, row, elements) {
      cells.forEach(function(cell, col) {
        cell.click(function() {
          var coordinate = new Coordinate(row,col);
          if (Game.getElementAt(coordinate).hasClass("guess")) {
            var move = Game.board.play(coordinate);
            Game.renderLine(move.getAllUpdatedCoordinates(), move.getPlayer());
            Game.updateTurnLabel(Game.board.getCurrentPlayer());
            Game.updateScoreLabel();
            Game.updateGuessLocations();
            if (Game.board.isGameOver()) {
              Game.gameOver();
              return;
            }
          }
            /////////// TODO: Put in AI stuff herehrehr::::////
        });
      });
    });
    Game.gameOver();
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
      //var winner = Game.board.getWinner();
      var outcome = $("#outcome");
      //outcome.html("Winner: " + winner.toString());

      var reset = document.createElement('button');
      reset.id = 'restart-button';
      reset.name = 'Restart';
      reset.innerHTML = 'Restart';
      reset.class = '.btn';
      reset.onclick = Game.reset;

      var out = document.getElementById('outcome');
      out.appendChild(document.createElement('br'));
      out.appendChild(reset);

      //this.updateTurnLabel(winner);
  },

  reset : function() {
    $("#board").empty();
    $("#outcome").empty();
    Game.start();
  }

};

$(document).ready(Game.start);
