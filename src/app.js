var othello = {};

(function () {
  'use strict';

  // Utilities {{{1

  function memoize(f) {
    var memo = {};
    var first = 0;
    var second = 0;
    return function () {
      if (arguments[0] === 'stat')
        return [first, second];
      var key = JSON.stringify(arguments);
      if (memo[key] === undefined) {
        memo[key] = f.apply(this, arguments);
        first++;
      } else {
        second++;
      }
      return memo[key];
    };
  }

  function delay(expressionAsFunction) {
    var result;
    var isEvaluated = false;

    return function () {
      if (!isEvaluated) {
        result = expressionAsFunction();
        isEvaluated = true;
      }
      return result;
    };
  }

  function force(promise) {
    return promise();
  }

  function sum(ns) {
    return ns.reduce(function (t, n) {return t + n;});
  }

  function random(n) {
    return Math.floor(Math.random() * n);
  }


  // Core logic

  var m = location.href.match(/\?n=(\d+)$/);
  var N = m === null ? 8 : parseInt(m[1]);

  var EMPTY = 'empty';
  var WHITE = 'white';
  var BLACK = 'black';

  function ix(x, y) {
    return x + y * N;
  }

  function makeInitialGameBoard() {
    var board = [];

    for (var x = 0; x < N; x++)
      for (var y = 0; y < N; y++)
        board[ix(x, y)] = EMPTY;

    var x2 = N >> 1;
    var y2 = N >> 1;
    board[ix(x2 - 1, y2 - 1)] = WHITE;
    board[ix(x2 - 1, y2 - 0)] = BLACK;
    board[ix(x2 - 0, y2 - 1)] = BLACK;
    board[ix(x2 - 0, y2 - 0)] = WHITE;

    return board;
  }

  function makeGameTree(board, player, wasPassed, nest) {
    return {
      board: board,
      player: player,
      moves: listPossibleMoves(board, player, wasPassed, nest)
    };
  }

  function listPossibleMoves(board, player, wasPassed, nest) {
    return completePassingMove(
      listAttackingMoves(board, player, nest),
      board,
      player,
      wasPassed,
      nest
    );
  }

  function completePassingMove(attackingMoves, board, player, wasPassed, nest) {
    if (0 < attackingMoves.length)
      return attackingMoves;
    else if (!wasPassed)
      return [{
        isPassingMove: true,
        gameTreePromise: delay(function () {
          return makeGameTree(board, nextPlayer(player), true, nest + 1);
        })
      }];
    else
      return [];
  }

  function listAttackingMovesN(board, player, nest) {
    var moves = [];

    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var vulnerableCells = listVulnerableCells(board, x, y, player);
        if (canAttack(vulnerableCells)) {
          moves.push({
            x: x,
            y: y,
            gameTreePromise: (function (x, y, vulnerableCells) {
              return delay(function () {
                return makeGameTree(
                  makeAttackedBoard(board, x, y, vulnerableCells, player),
                  nextPlayer(player),
                  false,
                  nest + 1
                );
              });
            })(x, y, vulnerableCells)
          });
        }
      }
    }

    return moves;
  }

  function listAttackingMoves8(board, player, nest) {
    return listAttackableCells(board, player).map(function (c) {
      var x = c & 0x07;
      var y = c >> 3;
      return {
        x: x,
        y: y,
        gameTreePromise: delay(function () {
          var vulnerableCells = listVulnerableCells(board, x, y, player);
          return makeGameTree(
            makeAttackedBoard(board, x, y, vulnerableCells, player),
            nextPlayer(player),
            false,
            nest + 1
          );
        })
      };
    });
  }

  var listAttackingMoves = N === 8 ? listAttackingMoves8 : listAttackingMovesN;

  function nextPlayer(player) {
    return player === BLACK ? WHITE : BLACK;
  }

  function canAttack(vulnerableCells) {
    return vulnerableCells.length;
  }

  function makeAttackedBoard(board, x, y, vulnerableCells, player) {
    var newBoard = board.slice();
    newBoard[ix(x, y)] = player;
    for (var i = 0; i < vulnerableCells.length; i++)
      newBoard[vulnerableCells[i]] = player;
    return newBoard;
  }

  function listVulnerableCells(board, x, y, player) {
    var vulnerableCells = [];

    if (board[ix(x, y)] !== EMPTY)
      return vulnerableCells;

    var opponent = nextPlayer(player);
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0)
          continue;
        for (var i = 1; i < N; i++) {
          var nx = x + i * dx;
          var ny = y + i * dy;
          if (nx < 0 || N <= nx || ny < 0 || N <= ny)
            break;
          var cell = board[ix(nx, ny)];
          if (cell === player && 2 <= i) {
            for (var j = 1; j < i; j++)
              vulnerableCells.push(ix(x + j * dx, y + j * dy));
            break;
          }
          if (cell !== opponent)
            break;
        }
      }
    }

    return vulnerableCells;
  }

  function judge(board) {
    var n = {};
    n[BLACK] = 0;
    n[WHITE] = 0;
    n[EMPTY] = 0;
    for (var i = 0; i < board.length; i++)
      n[board[i]]++;

    if (n[BLACK] > n[WHITE])
      return 1;
    if (n[BLACK] < n[WHITE])
      return -1;
    return 0;
  }




  // Core logic: Bit board  {{{1
  //
  // Naming conventions:
  //   b = black
  //   w = white
  //   o = offense
  //   d = defense
  //   e = empty
  //   a = attackable
  //   u = upper half of a board
  //   l = lower half of a board
  //
  // Assumption: N = 8

  var N2 = N >> 1;

  function listAttackableCells(board, player) {
    var bb = makeBitBoard(board);
    var ou = player === BLACK ? bb.blackUpper : bb.whiteUpper;
    var ol = player === BLACK ? bb.blackLower : bb.whiteLower;
    var du = player === BLACK ? bb.whiteUpper : bb.blackUpper;
    var dl = player === BLACK ? bb.whiteLower : bb.blackLower;
    var eu = ~(ou | du);
    var el = ~(ol | dl);
    var au = 0;
    var al = 0;
    var at;

    at = listAttackableBitsAtUp(ou, ol, du, dl, eu, el);
    au |= at.upper;
    al |= at.lower;

    at = listAttackableBitsAtRightUp(ou, ol, du, dl, eu, el);
    au |= at.upper;
    al |= at.lower;

    au |= listAttackableBitsAtRight(ou, du, eu);
    al |= listAttackableBitsAtRight(ol, dl, el);

    at = listAttackableBitsAtRightDown(ou, ol, du, dl, eu, el);
    au |= at.upper;
    al |= at.lower;

    at = listAttackableBitsAtDown(ou, ol, du, dl, eu, el);
    au |= at.upper;
    al |= at.lower;

    at = listAttackableBitsAtLeftDown(ou, ol, du, dl, eu, el);
    au |= at.upper;
    al |= at.lower;

    au |= listAttackableBitsAtLeft(ou, du, eu);
    al |= listAttackableBitsAtLeft(ol, dl, el);

    at = listAttackableBitsAtLeftUp(ou, ol, du, dl, eu, el);
    au |= at.upper;
    al |= at.lower;

    return cellPositionsFromBitBoard(au, al);
  }

  function makeBitBoard(board) {
    //                    MSB                   LSB
    //                     1a 1b 1c 1d 1e 1f 1g 1h MSB
    //                     2a 2b 2c 2d 2e 2f 2g 2h
    //             upper   3a 3b 3c 3d 3e 3f 3g 3h
    //                     4a 4b 4c 4d 4e 4f 4g 4h
    // bit board =   +   =
    //                     5a 5b 5c 5d 5e 5f 5g 5h
    //             lower   6a 6b 6c 6d 6e 6f 6g 6h
    //                     7a 7b 7c 7d 7e 7f 7g 7h
    //                     8a 8b 8c 8d 8e 8f 8g 8h LSB
    var bu = 0;
    var bl = 0;
    var wu = 0;
    var wl = 0;
    var nu = N2 - 1;
    var nl = N - 1;
    var n = N - 1;
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        if (y < N2) {
          var i = ix(x, y);
          bu |= (board[i] === BLACK ? 1 : 0) << (n-x) << ((nu-y) * N);
          wu |= (board[i] === WHITE ? 1 : 0) << (n-x) << ((nu-y) * N);
        } else {
          var j = ix(x, y);
          bl |= (board[j] === BLACK ? 1 : 0) << (n-x) << ((nl-y) * N);
          wl |= (board[j] === WHITE ? 1 : 0) << (n-x) << ((nl-y) * N);
        }
      }
    }
    return {
      blackUpper: bu,
      blackLower: bl,
      whiteUpper: wu,
      whiteLower: wl
    };
  }

  function cellPositionsFromBitBoard(au, al) {
    var positions = [];

    for (var yu = 0; yu < N2 && au; yu++) {
      for (var xu = 0; xu < N && au; xu++) {
        if (au & 0x80000000)
          positions.push(ix(xu, yu));
        au <<= 1;
      }
    }

    for (var yl = N2; yl < N && al; yl++) {
      for (var xl = 0; xl < N && al; xl++) {
        if (al & 0x80000000)
          positions.push(ix(xl, yl));
        al <<= 1;
      }
    }

    return positions;
  }

  function shiftUp(u, l) {
    return (u << N) |
           (l >>> (N * (N2 - 1)));
  }

  function shiftDown(u, l) {
    return (l >>> N) |
           ((u & 0x000000ff) << (N * (N2 - 1)));
  }

  function listAttackableBitsAtUp(ou, ol, _du, _dl, eu, el) {
    var du = _du & 0x00ffffff;
    var dl = _dl & 0xffffff00;
    var tu = du & shiftUp(ou, ol);
    var tl = dl & shiftUp(ol, 0);
    tu |= du & shiftUp(tu, tl);
    tl |= dl & shiftUp(tl, 0);
    tu |= du & shiftUp(tu, tl);
    tl |= dl & shiftUp(tl, 0);
    tu |= du & shiftUp(tu, tl);
    tl |= dl & shiftUp(tl, 0);
    tu |= du & shiftUp(tu, tl);
    tl |= dl & shiftUp(tl, 0);
    tu |= du & shiftUp(tu, tl);
    tl |= dl & shiftUp(tl, 0);
    return {
      upper: eu & shiftUp(tu, tl),
      lower: el & shiftUp(tl, 0)
    };
  }

  function listAttackableBitsAtRightUp(ou, ol, _du, _dl, eu, el) {
    var du = _du & 0x007e7e7e;
    var dl = _dl & 0x7e7e7e00;
    var tu = du & (shiftUp(ou, ol) >>> 1);
    var tl = dl & (shiftUp(ol, 0) >>> 1);
    tu |= du & (shiftUp(tu, tl) >>> 1);
    tl |= dl & (shiftUp(tl, 0) >>> 1);
    tu |= du & (shiftUp(tu, tl) >>> 1);
    tl |= dl & (shiftUp(tl, 0) >>> 1);
    tu |= du & (shiftUp(tu, tl) >>> 1);
    tl |= dl & (shiftUp(tl, 0) >>> 1);
    tu |= du & (shiftUp(tu, tl) >>> 1);
    tl |= dl & (shiftUp(tl, 0) >>> 1);
    tu |= du & (shiftUp(tu, tl) >>> 1);
    tl |= dl & (shiftUp(tl, 0) >>> 1);
    return {
      upper: eu & (shiftUp(tu, tl) >>> 1),
      lower: el & (shiftUp(tl, 0) >>> 1)
    };
  }

  function listAttackableBitsAtRight(o, _d, e) {
    var d = _d & 0x7e7e7e7e;
    var t = d & (o >>> 1);
    t |= d & (t >>> 1);
    t |= d & (t >>> 1);
    t |= d & (t >>> 1);
    t |= d & (t >>> 1);
    t |= d & (t >>> 1);
    return e & (t >>> 1);
  }

  function listAttackableBitsAtRightDown(ou, ol, _du, _dl, eu, el) {
    var du = _du & 0x007e7e7e;
    var dl = _dl & 0x7e7e7e00;
    var tl = dl & (shiftDown(ou, ol) >>> 1);
    var tu = du & (shiftDown(0, ou) >>> 1);
    tl |= dl & (shiftDown(tu, tl) >>> 1);
    tu |= du & (shiftDown(0, tu) >>> 1);
    tl |= dl & (shiftDown(tu, tl) >>> 1);
    tu |= du & (shiftDown(0, tu) >>> 1);
    tl |= dl & (shiftDown(tu, tl) >>> 1);
    tu |= du & (shiftDown(0, tu) >>> 1);
    tl |= dl & (shiftDown(tu, tl) >>> 1);
    tu |= du & (shiftDown(0, tu) >>> 1);
    tl |= dl & (shiftDown(tu, tl) >>> 1);
    tu |= du & (shiftDown(0, tu) >>> 1);
    return {
      upper: eu & (shiftDown(0, tu) >>> 1),
      lower: el & (shiftDown(tu, tl) >>> 1)
    };
  }

  function listAttackableBitsAtDown(ou, ol, _du, _dl, eu, el) {
    var du = _du & 0x00ffffff;
    var dl = _dl & 0xffffff00;
    var tl = dl & shiftDown(ou, ol);
    var tu = du & shiftDown(0, ou);
    tl |= dl & shiftDown(tu, tl);
    tu |= du & shiftDown(0, tu);
    tl |= dl & shiftDown(tu, tl);
    tu |= du & shiftDown(0, tu);
    tl |= dl & shiftDown(tu, tl);
    tu |= du & shiftDown(0, tu);
    tl |= dl & shiftDown(tu, tl);
    tu |= du & shiftDown(0, tu);
    tl |= dl & shiftDown(tu, tl);
    tu |= du & shiftDown(0, tu);
    return {
      upper: eu & shiftDown(0, tu),
      lower: el & shiftDown(tu, tl)
    };
  }

  function listAttackableBitsAtLeftDown(ou, ol, _du, _dl, eu, el) {
    var du = _du & 0x007e7e7e;
    var dl = _dl & 0x7e7e7e00;
    var tl = dl & (shiftDown(ou, ol) << 1);
    var tu = du & (shiftDown(0, ou) << 1);
    tl |= dl & (shiftDown(tu, tl) << 1);
    tu |= du & (shiftDown(0, tu) << 1);
    tl |= dl & (shiftDown(tu, tl) << 1);
    tu |= du & (shiftDown(0, tu) << 1);
    tl |= dl & (shiftDown(tu, tl) << 1);
    tu |= du & (shiftDown(0, tu) << 1);
    tl |= dl & (shiftDown(tu, tl) << 1);
    tu |= du & (shiftDown(0, tu) << 1);
    tl |= dl & (shiftDown(tu, tl) << 1);
    tu |= du & (shiftDown(0, tu) << 1);
    return {
      upper: eu & (shiftDown(0, tu) << 1),
      lower: el & (shiftDown(tu, tl) << 1)
    };
  }

  function listAttackableBitsAtLeft(o, _d, e) {
    var d = _d & 0x7e7e7e7e;
    var t = d & (o << 1);
    t |= d & (t << 1);
    t |= d & (t << 1);
    t |= d & (t << 1);
    t |= d & (t << 1);
    t |= d & (t << 1);
    return e & (t << 1);
  }

  function listAttackableBitsAtLeftUp(ou, ol, _du, _dl, eu, el) {
    var du = _du & 0x007e7e7e;
    var dl = _dl & 0x7e7e7e00;
    var tu = du & (shiftUp(ou, ol) << 1);
    var tl = dl & (shiftUp(ol, 0) << 1);
    tu |= du & (shiftUp(tu, tl) << 1);
    tl |= dl & (shiftUp(tl, 0) << 1);
    tu |= du & (shiftUp(tu, tl) << 1);
    tl |= dl & (shiftUp(tl, 0) << 1);
    tu |= du & (shiftUp(tu, tl) << 1);
    tl |= dl & (shiftUp(tl, 0) << 1);
    tu |= du & (shiftUp(tu, tl) << 1);
    tl |= dl & (shiftUp(tl, 0) << 1);
    tu |= du & (shiftUp(tu, tl) << 1);
    tl |= dl & (shiftUp(tl, 0) << 1);
    return {
      upper: eu & (shiftUp(tu, tl) << 1),
      lower: el & (shiftUp(tl, 0) << 1)
    };
  }




  // AI {{{1

  // API {{{1

  var externalAITable = {};

  var lastAIType;

  othello.registerAI = function (ai) {
    externalAITable[lastAIType] = ai;
  };

  othello.force = force;
  othello.delay = delay;
  othello.EMPTY = EMPTY;
  othello.WHITE = WHITE;
  othello.BLACK = BLACK;
  othello.nextPlayer = nextPlayer;

  // UI {{{1

  function drawGameBoard(board, player, moves) {
    var ss = [];
    var attackable = [];
    moves.forEach(function (m) {
      if (!m.isPassingMove)
        attackable[ix(m.x, m.y)] = true;
    });

    ss.push('<table>');
    for (var y = -1; y < N; y++) {
      ss.push('<tr>');
      for (var x = -1; x < N; x++) {
        if (0 <= y && 0 <= x) {
          ss.push('<td class="');
          ss.push('cell');
          ss.push(' ');
          ss.push(attackable[ix(x, y)] ? player : board[ix(x, y)]);
          ss.push(' ');
          ss.push(attackable[ix(x, y)] ? 'attackable' : '');
          ss.push('" id="');
          ss.push('cell_' + x + '_' + y);
          ss.push('">');
          ss.push('<span class="disc"></span>');
          ss.push('</td>');
        } else if (0 <= x && y === -1) {
          ss.push('<th>' + String.fromCharCode('a'.charCodeAt(0)+x) + '</th>');
        } else if (x === -1 && 0 <= y) {
          ss.push('<th>' + (y + 1) + '</th>');
        } else /* if (x === -1 && y === -1) */ {
          ss.push('<th></th>');
        }
      }
      ss.push('</tr>');
    }
    ss.push('</table>');

    $('#game-board').html(ss.join(''));
    $('#current-player-name').text(player);
  }

  function resetUI() {
    $('#console').empty();
    $('#message').empty();
  }

  function setUpUIToChooseMove(gameTree) {
    $('#message').text('Choose your move.');
    gameTree.moves.forEach(function (m, i) {
      if (m.isPassingMove) {
        $('#console').append(
          $('<input type="button" class="btn">')
          .val(makeLabelForMove(m))
          .click(function () {
            shiftToNewGameTree(force(m.gameTreePromise));
          })
        );
      } else {
        $('#cell_' + m.x + '_' + m.y)
        .click(function () {
          shiftToNewGameTree(force(m.gameTreePromise));
        });
      }
    });
  }

  function makeLabelForMove(move) {
    if (move.isPassingMove)
      return 'Pass';
    else
      return 'abcdefgh'[move.x] + '12345678'[move.y];
  }

  function setUpUIToReset() {
    resetGame();
    if ($('#repeat-games:checked').length)
      startNewGame();
  }

  var minimumDelayForAI = 500;  // milliseconds
  function chooseMoveByAI(gameTree, ai) {
    $('#message').text('Now thinking...');
    setTimeout(
      function () {
        var start = Date.now();
        var newGameTree = force(ai.findTheBestMove(gameTree).gameTreePromise);
        var end = Date.now();
        var delta = end - start;
        setTimeout(
          function () {
            shiftToNewGameTree(newGameTree);
          },
          Math.max(minimumDelayForAI - delta, 1)
        );
      },
      1
    );
  }

  function showWinner(board) {
    var r = judge(board);
    $('#message').text(
      r === 0 ?
      'The game ends in a draw.' :
      'The winner is ' + (r === 1 ? BLACK : WHITE) + '.'
    );
  }

  var playerTable = {};

  function makePlayer(playerType) {
    if (playerType === 'human') {
      return setUpUIToChooseMove;
    } else {
      var ai = makeAI(playerType);
      return function (gameTree) {
        chooseMoveByAI(gameTree, ai);
      };
    }
  }

  function blackPlayerType() {
    return $('#black-player-type').val();
  }

  function whitePlayerType() {
    return $('#white-player-type').val();
  }

  function swapPlayerTypes() {
    var t = $('#black-player-type').val();
    $('#black-player-type').val($('#white-player-type').val()).change();
    $('#white-player-type').val(t).change();
  }

  function shiftToNewGameTree(gameTree) {
    drawGameBoard(gameTree.board, gameTree.player, gameTree.moves);
    resetUI();
    if (gameTree.moves.length === 0) {
      showWinner(gameTree.board);
      recordStat(gameTree.board);
      if ($('#repeat-games:checked').length)
        showStat();
      setUpUIToReset();
    } else {
      playerTable[gameTree.player](gameTree);
    }
  }

  var stats = {};

  function recordStat(board) {
    var s = stats[[blackPlayerType(), whitePlayerType()]] || {b: 0, w: 0, d: 0};
    var r = judge(board);
    if (r === 1)
      s.b++;
    if (r === 0)
      s.d++;
    if (r === -1)
      s.w++;
    stats[[blackPlayerType(), whitePlayerType()]] = s;
  }

  function showStat() {
    var s = stats[[blackPlayerType(), whitePlayerType()]];
    $('#stats').text('Black: ' + s.b + ', White: ' + s.w + ', Draw: ' + s.d);
  }

  function resetGame() {
    $('#preference-pane :input:not(#repeat-games)')
      .removeClass('disabled')
      .removeAttr('disabled');
  }

  function startNewGame() {
    $('#preference-pane :input:not(#repeat-games)')
      .addClass('disabled')
      .attr('disabled', 'disabled');
    playerTable[BLACK] = makePlayer(blackPlayerType());
    playerTable[WHITE] = makePlayer(whitePlayerType());
    shiftToNewGameTree(makeGameTree(makeInitialGameBoard(), BLACK, false, 1));
  }




  // Startup {{{1

  $('#start-button').click(function () {startNewGame();});
  $('#add-new-ai-button').click(function () {addNewAI();});
  $('#swap-player-types-button').click(function () {swapPlayerTypes();});
  resetGame();
  drawGameBoard(makeInitialGameBoard(), '-', []);
})();
// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
