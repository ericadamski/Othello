//
// Implementation of the Board ADT
// Contains all the game logic
//
Board = function (boardDimension, moveStack, board, currentPlayer) {
	var that = this;

  this.PLAYER_1 = {},
	this.PLAYER_2 = {},
	this.NONE = {};

  this.PLAYER_1.other = this.PLAYER_2;
  this.PLAYER_1.score = 2;
  this.PLAYER_1.scoreLabelId = "Player-1-Score"
	this.PLAYER_1.isAI = false;

  this.PLAYER_2.other = this.PLAYER_1;
  this.PLAYER_2.score = 2;
  this.PLAYER_2.scoreLabelId = "Player-2-Score"
	this.PLAYER_2.isAI = false;

  // for debugging
  this.PLAYER_1.toString = function() {return "Player 1";};
  this.PLAYER_2.toString = function() {return "Player 2";};
  this.NONE.toString = function() {return "-";};

  this.compass = new Compass();

  if (moveStack !== undefined)
	{
		this.moveStack = [];
  	this.moveStack = moveStack;
	}
	else
		this.moveStack = [];

	if (board !== undefined)
	{
		this.board = [];
		this.board = board;
	}
	else
  	this.board = [];

	if (currentPlayer !== undefined)
		this.currentPlayerId = currentPlayer;
	else
  	this.currentPlayerId = 0;

	this.boardDimension = boardDimension;

  this.winner;

  for (var row = 0; row < this.boardDimension; row++) {
    this.board.push(Array.dim(this.boardDimension, this.NONE));
  };

  this.board[3][3] = this.PLAYER_1;
  this.board[3][4] = this.PLAYER_2;
  this.board[4][3] = this.PLAYER_2;
  this.board[4][4] = this.PLAYER_1;

	this.PLAYER_1.play = function(coordinate) {
		if (this.isAI !== 0)
		{
			var aiMove = ai.getMove(coordinate,
				this.isAI,
				parseInt(this.limit.value));
			return {move: that.play(aiMove.move,
				that.getMoveStack(),
				that.getBoard()), nodes: aiMove.nodes};
		}
		else
			return that.play(coordinate, that.getMoveStack(), that.getBoard());
	};
	this.PLAYER_2.play = function(coordinate) {
		if (this.isAI !== 0)
		{
			var aiMove = ai.getMove(coordinate,
				this.isAI,
				parseInt(this.limit.value));
			return {move: that.play(aiMove.move,
				that.getMoveStack(),
				that.getBoard()), nodes: aiMove.nodes};
		}
		else
			return that.play(coordinate, that.getMoveStack(), that.getBoard());
	};

	this.updateCurrentPlayer = function() {
		this.currentPlayerId = (this.currentPlayerId + 1) % 2 ;
	};

  var playerAt = function (coordinate, b) {
    return b[coordinate.getRow()][coordinate.getColumn()];
  };

  this.updateCell = function (coordinate, player, b) {
    var row = coordinate.getRow();
    var col = coordinate.getColumn();
    b[row][col] = player;
  };

  var flipGenerator = function(coordinate, player, b) {
		if ( player === undefined )
			player = that.getCurrentPlayer();

		if ( b === undefined )
		{
			b = player;
			player = that.getCurrentPlayer();
		}

    var coordinates = [];
    var flips =[];

    //for each direction
    that.compass.getDirections().forEach ( function (direction, index, array) {
      var coordinates = [];
      //should not have a disk
      if (playerAt(coordinate, b).toString() != that.NONE.toString()) return ;
      var step =  direction.step(coordinate);
      while (direction.onBoard(that.boardDimension, step)) {
        if (playerAt(step, b).toString() == that.NONE.toString()) {
          return;
        } else if (playerAt(step, b).toString() == player.toString()) {
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
  };

	this.getFlipGenerator = function () {
	  return flipGenerator;
	};
};

Board.prototype.getBoard = function() {
	return this.board;
};

Board.prototype.getMoveStack = function() {
	return this.moveStack;
};

Board.prototype.getDimension = function() {
	return this.boardDimension;
};

Board.prototype.getPlayer = function (i) {
	var players = {0: this.PLAYER_1, 1: this.PLAYER_2};
	return players[i];
};

Board.prototype.getCurrentPlayer = function() {
	return this.getPlayer(this.currentPlayerId);
};

// mutate board by playing player in position
// return move
// should only be called for VALID COORDINATE
Board.prototype.play = function (newDisk, moveStack, b) {
  var player = this.getCurrentPlayer();
  var flips = [];
  move = new Move(player, newDisk, this.getFlipGenerator(), b);

	moveStack.push(move);

  var player = move.getPlayer();

	var that = this;

  //mutate board
  move.getAllUpdatedCoordinates().forEach(function (cell, i, cells) {
    that.updateCell(cell, player, b);
  });

  //update score
  player.score += move.getDeltaScorePlayer(player);
  player.other.score += move.getDeltaScorePlayer(player.other);

	player.lastMove = move;

  this.updateCurrentPlayer();
	return move;
};

//return if play a coordinate would be valid
Board.prototype.verifyMove = function (coordinate, player, b) {
  return this.getFlipGenerator()(coordinate, player, b).length > 0;
};

Board.prototype.isGameOver = function(b) {
	for (var row = 0; row < this.getDimension(); row ++) {
		for (var col = 0; col < this.getDimension(); col ++) {
			if (this.verifyMove(new Coordinate(row, col), b)) {
				return false;
			}
		}
	}

  var player  = this.getCurrentPlayer();
  var other = player.other;
  if (player.score > other.score) {
    this.winner = player;
  } else if (player.score < other.score) {
    this.winner = other;
  } else {
    this.winner = this.NONE;
  }

	return true;
};

Board.prototype.getWinner = function() {
  return this.winner;
};
