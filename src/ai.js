ai = {
  boardCopy: {},

  updateAIBoard : function(board) {
    this.boardCopy = {};
    jQuery.extend(this.boardCopy, board);
  },

  getMove : function(board) {
    this.updateAIBoard(board);
    return this.minmax();
  },

  cornersHeuristic : function(min, max) {
    //Sudo
    /*if ( Max Player Corners + Min Player Corners != 0)
        Corner Heuristic Value =
        	100 * (Max Player Corners - Min Player Corners) / (Max Player Corners + Min Player Corners)
      else
          Corner Heuristic Value = 0*/
  },

  mobilityHeuristic : function(min, max) {
    //Sudo
    /*if ( Max Player Moves + Min Player Moves != 0)
	     Mobility Heuristic Value =
		     100 * (Max Player Moves - Min Player Moves) / (Max Player Moves + Min Player Moves)
      else
	     Mobility Heuristic Value = 0*/
  },

  maximize : function(game, move) {
    game.play(move);

    if (game.isGameOver())
      return new Move(game.getCurrentPlayer(),
        move,
        game.getFlipGenerator()).getDeltaScorePlayer(game.getWinner());

    var value = -10000;

    this.getMoves(game).forEach( function(move, index, moves) {
      value = Math.max(value, ai.minimize(game, move));
    });

    return value;
  },

  minimize : function(game, move) {
    game.play(move);

    if (game.isGameOver())
      return new Move(game.getCurrentPlayer(),
        move,
        game.getFlipGenerator()).getDeltaScorePlayer(game.getWinner());

    var value = 10000;

    this.getMoves(game).forEach( function(move, index, moves) {
      value = Math.min(value, ai.maximize(game, move));
    });

    return value;
  },

  minmax : function() {
    var max = this.boardCopy.getCurrentPlayer();

    var best = null;
    var value = -100000;

    this.getMoves(this.boardCopy).forEach( function(move, index, moves) {
      var tmpValue = ai.minimize(ai.boardCopy, move);
      console.log(tmpValue);
      if (tmpValue > value)
      {
        best = new Move(ai.boardCopy.getCurrentPlayer(),
          move,
          ai.boardCopy.getFlipGenerator());
        value = tmpValue;
      }
    });

    return best.getNewDisk();
  },

  getMoves : function (game) {
    var moves = [];

    for (var row = 0; row < this.boardCopy.getDimension(); row ++) {
      for (var col = 0; col < this.boardCopy.getDimension(); col ++) {
        var newDisk = new Coordinate(row, col);
        if (game.verifyMove(newDisk)) {
          moves.push(newDisk);
        }
      }
    }

    return moves;
  }
}
