//
// Implementation of the Board ADT
// Contains all the game logic
//
Board = {
	PLAYER_1: {},
	PLAYER_2: {},
	NONE: {},
	compass: null,
	moveStack: [],
	board: [],
	currentPlayerId: 0,
	boardDimension: 0,

	init : function (boardDimension) {
		this.boardDimension = boardDimension;

  	this.PLAYER_1.other = this.PLAYER_2;
  	this.PLAYER_1.score = 2;
  	this.PLAYER_1.scoreLabelId = "Player-1-Score"

  	this.PLAYER_2.other = this.PLAYER_1;
  	this.PLAYER_2.score = 2;
  	this.PLAYER_2.scoreLabelId = "Player-2-Score"

	  // for debugging
	  this.PLAYER_1.toString = function() {return "Player 1";};
	  this.PLAYER_2.toString = function() {return "Player 2";};
	  this.NONE.toString = function() {return "-";};

		this.PLAYER_1.isAI = false;
		this.PLAYER_2.isAI = false;

		this.PLAYER_1.play = function(coordinate){
			if ( this.isAI )
				return Board.play(ai.getMove(coordinate));
			else
				return Board.play(coordinate);
		};

		this.PLAYER_2.play = function(coordinate){
			if ( this.isAI )
				return Board.play(ai.getMove(coordinate));
			else
				return Board.play(coordinate);
		};

  	this.compass = new Compass();
  	this.moveStack = [];
	  this.board = [];
   	this.currentPlayerId = 0;

  	for (var row = 0; row < this.boardDimension; row++) {
    	this.board.push(Array.dim(this.boardDimension, this.NONE));
  	};

		this.board[3][3] = this.PLAYER_1;
		this.board[3][4] = this.PLAYER_2;
		this.board[4][3] = this.PLAYER_2;
		this.board[4][4] = this.PLAYER_1;


		return this;
	},

	getDimension : function() {
		return this.boardDimension;
	},

	updateCurrentPlayer : function() {
		this.currentPlayerId = (this.currentPlayerId + 1) % 2 ;
	},

	getPlayer : function (i) {
		var players = {0: this.PLAYER_1, 1: this.PLAYER_2};
		return players[i];
	},

	getCurrentPlayer : function() {
		return this.getPlayer(this.currentPlayerId);
	},

  updateCell : function (coordinate, player) {
    var row = coordinate.getRow();
    var col = coordinate.getColumn();
    this.board[row][col] = player;
  },

	// mutate board by playing player in position
	// return move
  // should only be called for VALID COORDINATE
	play : function (newDisk) {

    var player = Board.getCurrentPlayer();
    var flips = [];
    move = new Move(player, newDisk, this.flipGenerator);

		this.moveStack.push(move);

    var player = move.getPlayer();

    //mutate board
    move.getAllUpdatedCoordinates().forEach(function (cell, i, cells) {
      Board.updateCell(cell, player);
    })

    //update score
    player.score += move.getDeltaScorePlayer(player);
    player.other.score += move.getDeltaScorePlayer(player.other);

    this.updateCurrentPlayer();
		return move;
	},

	//return if play a coordinate would be valid
	verifyMove : function (coordinate) {
    return this.flipGenerator(coordinate).length > 0;
	},

  flipGenerator : function(coordinate) {
    var player = Board.getCurrentPlayer();
    var coordinates = [];
    var flips =[];

    //for each direction
    Board.compass.getDirections().forEach ( function (direction, index, array) {
      var coordinates = [];
      //should not have a disk
      if (Board.playerAt(coordinate) != Board.NONE) return ;
      var step =  direction.step(coordinate);
      while (direction.onBoard(Board.boardDimension, step)) {
        if (Board.playerAt(step) == Board.NONE) {
          return;
        } else if (Board.playerAt(step) == player) {
          //disks of opposite sign inbetween disks of same sign
          if (coordinates.length > 0 ){
            step = direction.step(step);
            flips.push(new Flip(direction, coordinate, coordinates, step));
            return;
          //not disks of opposite sign inbetween disks of same sign
          } else {
            return;
          }
        } else {
          coordinates.push(step);
          step =  direction.step(step);
        }
      }
    });

    return flips;
  },

  getFlipGenerator : function () {
    return this.flipGenerator;
  },


  playerAt : function (coordinate) {
    return this.board[coordinate.getRow()][coordinate.getColumn()];
  },

	isGameOver : function() {

		for (var row = 0; row < this.board.length; row ++) {
			for (var col = 0; col < this.board.length; col ++) {
				if (Board.verifyMove(new Coordinate(row, col))) {
					return false;
				}
			}
		}

    var player  = Board.getCurrentPlayer();
    var other = player.other;
    if (player.score > other.score) {
      winner = player;
    } else if (player.score < other.score) {
      winner = other;
    } else {
      winner = NONE;
    }

		return true;
	},

  getWinner : function() {
    return winner;
  }
};
