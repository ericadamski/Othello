ai = {
  boardCopy: {},
  INFINITY: 1000000000000,
  nodeCount: 0,
  limit: this.INFINITY,
  depth: 8,

  updateAIBoard : function(b) {
    this.boardCopy =  this.copyBoard(b);
    ai.nodeCount = 0;
  },

  copyBoard : function(b) {
    var sam = new Array(b.getDimension());
    var ba = b.getBoard();
    for ( var i = 0; i < sam.length; i++ )
    {
      sam[i] = new Array(b.getDimension());
      for ( var j = 0; j < sam[i].length; j++ )
      {
        sam[i][j] = $.extend({},ba[i][j]);
      }
    }

    return new Board(b.getDimension(),
      b.getMoveStack().slice(),
      sam,
      b.getCurrentPlayer().toString() === "Player 1" ? 0 : 1);
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

  maximize : function(game, move, alpha, beta, heuristic, dep) {
    game.play(move,
      game.getMoveStack(),
      game.getBoard(),
      game.getCurrentPlayer());

    if (game.isGameOver(game.getBoard(), false))
    {
      var player = game.getCurrentPlayer();
      return heuristic(player.other, player);
    }

    if( dep > this.depth ) return alpha

    ++dep;

    this.getMoves(game,
      game.getCurrentPlayer()).forEach( function(move, index, moves) {
        if( ai.nodeCount < ai.limit )
        {
          ai.nodeCount++;
          alpha = Math.max(alpha, ai.minimize(game,
            move.getNewDisk(),
            alpha,
            beta,
            heuristic,
            dep));
          if ( alpha >= beta ) return alpha;
        }
    });

    return alpha;
  },

  minimize : function(game, move, alpha, beta, heuristic, dep) {
    game.play(move,
      game.getMoveStack(),
      game.getBoard(),
      game.getCurrentPlayer());

    if (game.isGameOver(game.getBoard(), false))
    {
      var player = game.getCurrentPlayer();
      return heuristic(player.other, player);
    }

    if( dep > this.depth ) return beta;

    ++dep;

    this.getMoves(game,
      game.getCurrentPlayer()).forEach( function(move, index, moves) {
        if( ai.nodeCount < ai.limit )
        {
          ai.nodeCount++;
          beta = Math.min(beta, ai.maximize(game,
            move.getNewDisk(),
            alpha,
            beta,
            heuristic,
            dep));
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

    var bc = null;

    this.getMoves(this.boardCopy, max).forEach( function(move, index, moves) {
      bc = ai.copyBoard(ai.boardCopy);
      var m = move;
      if ( ai.nodeCount < ai.limit )
      {
        var tmpValue = ai.minimize(bc,
          m.getNewDisk(),
          alpha,
          beta,
          heuristic,
          0);
        if (tmpValue > value)
        {
          best = m
          value = tmpValue;
        }
      }
      else
        return best.getNewDisk();
    });

    return best.getNewDisk();
  },

  getMoves : function (game, player) {
    var moves = [];
    var count = 0;

    for (var row = 0; row < game.getDimension(); row ++) {
      for (var col = 0; col < game.getDimension(); col ++) {
        var newDisk = new Coordinate(row, col);
        if (game.isMove(newDisk, game.getBoard())) {
          moves.push(new Move(player,
            newDisk,
            game.getFlipGenerator(),
            game.getBoard()));
        }
      }
    }
    console.log("-----");
    return moves;
  }
}
