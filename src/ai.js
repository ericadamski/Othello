ai = {
  boardCopy: {},

  updateAIBoard : function(b) {
    var sam = new Array(b.getBoard().length);
    var ba = b.getBoard();
    for ( var i = 0; i < sam.length; i++ )
      sam[i] = ba[i].slice();

    this.boardCopy = new Board(b.getDimension(),
      b.getMoveStack().slice(),
      sam,
      b.getCurrentPlayer().toString() === "Player 1" ? 0 : 1);
  },

  getMove : function(b, heuristicChoice) {
    this.updateAIBoard(b);
    var heuristic = heuristicChoice === 1 ?
      this.maxScoreHeuristic :
      this.coinParityHeuristic;
    return this.minmax(heuristic);
  },

  maxScoreHeuristic : function(min, max) {
    return max.score;
  },

  coinParityHeuristic : function(min, max) {
    var game = ai.boardCopy;
    var board = game.getBoard();

    var maxCoin = 0,
        minCoin = 0;

    for ( var row = 0; row < game.getDimension(); row++ )
    {
      for ( var col = 0; col < game.getDimension(); col++ )
      {
        if ( board[row][col].toString() !== game.NONE.toString() )
        {
          board[row][col].toString() === max.toString() ?
            ++maxCoin :
            ++minCoin
        }
      }
    }

    return 100 * ( maxCoin - minCoin ) / (maxCoin + minCoin );
  },

  maximize : function(game, move, heuristic) {
    game.play(move, game.getMoveStack(), game.getBoard());

    if (game.isGameOver(game.getBoard(), false))
    {
      var player = game.getCurrentPlayer();
      return heuristic(player.other, player);
    }

    var value = -10000;

    this.getMoves(game,
      game.getCurrentPlayer()).forEach( function(move, index, moves) {
        value = Math.max(value, ai.minimize(game, move, heuristic));
    });

    return value;
  },

  minimize : function(game, move, heuristic) {
    game.play(move, game.getMoveStack(), game.getBoard());

    if (game.isGameOver(game.getBoard(), false))
    {
      var player = game.getCurrentPlayer();
      return heuristic(player.other, player);
    }

    var value = 10000;

    this.getMoves(game,
      game.getCurrentPlayer()).forEach( function(move, index, moves) {
        value = Math.min(value, ai.maximize(game, move, heuristic));
    });

    return value;
  },

  minmax : function(heuristic) {
    var max = this.boardCopy.getCurrentPlayer();

    var best = null;
    var value = -100000;

    this.getMoves(this.boardCopy, max).forEach( function(move, index, moves) {
      var tmpValue = ai.minimize(ai.boardCopy, move, heuristic);
      console.log(tmpValue);
      if (tmpValue > value)
      {
        best = new Move(ai.boardCopy.getCurrentPlayer(),
          move,
          ai.boardCopy.getFlipGenerator(),
          ai.boardCopy.getBoard());
        value = tmpValue;
      }
    });

    return best.getNewDisk();
  },

  getMoves : function (game, player) {
    var moves = [];

    for (var row = 0; row < game.getDimension(); row ++) {
      for (var col = 0; col < game.getDimension(); col ++) {
        var newDisk = new Coordinate(row, col);
        if (game.verifyMove(newDisk, player, game.getBoard())) {
          moves.push(newDisk);
        }
      }
    }

    return moves;
  }
}
