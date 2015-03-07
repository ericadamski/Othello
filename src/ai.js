ai = {
  boardCopy: {},
  INFINITY: 1000000000000,
  nodeCount: 0,
  limit: this.INFINITY,

  updateAIBoard : function(b) {
    var sam = new Array(b.getBoard().length);
    var ba = b.getBoard();
    for ( var i = 0; i < sam.length; i++ )
      sam[i] = ba[i].slice();

    this.boardCopy = new Board(b.getDimension(),
      b.getMoveStack().slice(),
      sam,
      b.getCurrentPlayer().toString() === "Player 1" ? 0 : 1);

    ai.nodeCount = 0;
  },

  getMove : function(b, heuristicChoice, limit) {
    this.limit = undefined;
    this.limit = limit;
    //console.log("Limiting Search By : " + this.limit);
    this.updateAIBoard(b);
    var heuristic = heuristicChoice === 1 ?
      this.maxScoreHeuristic :
      this.coinParityHeuristic;
    return {move: this.minmax(heuristic), nodes: ai.nodeCount};
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

  maximize : function(game, move, alpha, beta, heuristic) {
    game.play(move, game.getMoveStack(), game.getBoard());

    if (game.isGameOver(game.getBoard(), false))
    {
      var player = game.getCurrentPlayer();
      return heuristic(player.other, player);
    }

    this.getMoves(game,
      game.getCurrentPlayer()).forEach( function(move, index, moves) {
        if( ai.nodeCount < ai.limit )
        {
          ai.nodeCount++;
          alpha = Math.max(alpha, ai.minimize(game,
            move,
            alpha,
            beta,
            heuristic));
          if ( alpha >= beta ) return alpha;
        }
    });

    return alpha;
  },

  minimize : function(game, move, alpha, beta, heuristic) {
    game.play(move, game.getMoveStack(), game.getBoard());

    if (game.isGameOver(game.getBoard(), false))
    {
      var player = game.getCurrentPlayer();
      return heuristic(player.other, player);
    }

    this.getMoves(game,
      game.getCurrentPlayer()).forEach( function(move, index, moves) {
        if( ai.nodeCount < ai.limit )
        {
          ai.nodeCount++;
          beta = Math.min(beta, ai.maximize(game,
            move,
            alpha,
            beta,
            heuristic));
          if ( beta <= alpha ) return beta;
        }
    });

    return beta;
  },

  minmax : function(heuristic) {
    var max = this.boardCopy.getCurrentPlayer();

    if (this.limit === undefined || isNaN(this.limit))
      this.limit = this.INFINITY;

    if (this.limit < 1)
      this.limit = 1;

    alpha = -this.INFINITY;
    beta = this.INFINITY;

    var best = null;
    var value = -this.INFINITY;

    this.getMoves(this.boardCopy, max).forEach( function(move, index, moves) {
      if ( ai.nodeCount < ai.limit )
      {
        var tmpValue = ai.minimize(ai.boardCopy, move, alpha, beta, heuristic);
        if (tmpValue > value)
        {
          best = new Move(ai.boardCopy.getCurrentPlayer(),
            move,
            ai.boardCopy.getFlipGenerator(),
            ai.boardCopy.getBoard());
          value = tmpValue;
        }
      }
      else
        return best.getNewDisk();;
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
