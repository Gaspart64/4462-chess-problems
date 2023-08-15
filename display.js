// Module Imports
const Chess = require("chess.js");
const URI = require("urijs");
const $ = require("jquery");
const { ChessBoard } = require("./chessboard/chessboard.js");
const { problems } = require("./problems.json");
const random = require("./random.js");
const { enableScroll, disableScroll } = require("./toggle-scrollbar.js");
let url_parameters = new URI(window.location.href).search(true);

// Unhighlight board
function unhighlight() {
  $("#board .square-55d63").css("background", "");
}

// Highlight specific square
function highlight(square) {
  const squareEl = $("#board .square-" + square);
  const background = squareEl.hasClass("black-3c85d") ? "#696969" : "#a9a9a9";
  squareEl.css("background", background);
}

// Parse move from string to components
function parse_move(move) {
  let [source, target] = move.split("-");
  let promotion = target.length == 2 ? "q" : target[2];
  target = target.slice(0, 2);
  return [source, target, promotion];
}

var game;
var correct_moves;

// Make the move on the board
function make_move() {
  let [source, target, promotion] = parse_move(correct_moves[0]);
  game.move({ "from": source, "to": target, "promotion": promotion });
  board.move(source + "-" + target);
  correct_moves.shift();
}

// Load next problem
function next_problem() {
  change_problem(1);
}

// Load previous problem
function previous_problem() {
  change_problem(-1);
}

// Common function to handle problem change
function change_problem(direction) {
  const current_problem_id = document.querySelector("#problem-num").innerHTML;
  if ("o" in url_parameters && current_problem_id != (direction === 1 ? 4462 : 1)) {
    next(problems[current_problem_id - 1 + direction]);
    pushstate();
  } else if (direction === 1) {
    next();
    if (history && history.replaceState && "id" in url_parameters) {
      delete url_parameters["id"];
      history.replaceState(url_parameters, "", new URI(window.location.href).search(url_parameters).toString());
    }
  }
}

// Event handler for keydown
document.body.onkeydown = function (e) {
  unhighlight();
  e.preventDefault();

  if (e.key == " " || e.code == "Space" || e.code == "ArrowRight") {
    next_problem();
  }

  if (e.code == "ArrowLeft") {
    previous_problem();
  }
};

// Handler for drop event
function onDropHandler(src, tgt) {
  enableScroll();

  if (game.in_checkmate()) {
    return "snapback";
  }

  let [source, target, promotion] = parse_move(correct_moves[0]);

  if (correct_moves.length == 1) {
    const sim_game = new Chess(game.fen());
    sim_game.move({ "from": src, "to": tgt, "promotion": promotion });

    if (!sim_game.in_checkmate()) {
      return "snapback";
    } else {
      game.move({ "from": src, "to": tgt, "promotion": promotion });
      correct_moves.shift();
    }
  } else {
    if (src !== source || tgt !== target) {
      return "snapback";
    }
    game.move({ "from": source, "to": target, "promotion": promotion });
    correct_moves.shift();
    setTimeout(make_move, 500);
  }

  if (game.in_checkmate()) {
    $("#hint-btn").css("display", "none");
    $("#next-btn").css("display", "");
    document.querySelector("#next-btn").onclick = next_problem;
    document.querySelector("#problem-title").innerHTML = document.querySelector("#problem-title").innerHTML.split("-")[0] + " - Solved!";
  }
}

// Chessboard configuration
const board = ChessBoard("board", {
  draggable: true,
  dropOffBoard: "snapback",
  onDragStart: function (src, tgt, position, orientation) { disableScroll(); },
  onDrop: onDropHandler,
  onMoveEnd: function () { board.position(game.fen()); },
  onSnapEnd: function () { board.position(game.fen()); unhighlight(); }
});

function next(problem=random.choice(problems), useAnimation=true) {
    $("#next-btn").css("display", "none")
    $("#hint-btn").css("display", "")
    const problem_type = "Checkm" + problem.type.slice(1) + " Move" + (problem.type.endsWith("One") ? "" : "s")
    var problem_title = `${problem_type} - ${problem.first}`
    document.title = `#${problem.problemid}`
    if ("o" in url_parameters) { problem_title = `#${problem.problemid} ${problem_title}`}
    document.querySelector("#problem-title").innerHTML = problem_title
    document.querySelector("#problem-num").innerHTML = `${problem.problemid}`
    document.querySelector("#problem-link").href = "o" in url_parameters ? `?o&id=${problem.problemid}` : `?id=${problem.problemid}`
    game = new Chess(problem.fen)
    board.position(problem.fen, useAnimation)
    correct_moves = problem.moves.split(";")
    document.querySelector("#hint-btn").onclick = function() {
        let [source, target, promotion] = parse_move(correct_moves[0])
        highlight(source)
        highlight(target)
    }
}

function init() {
    const problem = ("id" in url_parameters && url_parameters["id"] <= 4462 && url_parameters["id"] > 0) ? problems[url_parameters["id"] - 1] : random.choice(problems)
    next(problem)
    pushstate()
}

function pushstate() {
    if (history && history.pushState && "o" in url_parameters) {
        const current_problem_id = document.querySelector("#problem-num").innerHTML
        url_parameters["id"] = current_problem_id
        if (history.state && history.state["id"] == current_problem_id) {
            return
        }
        history.pushState(url_parameters, "", new URI(window.location.href).search(url_parameters).toString())
    }
}

window.onpopstate = function(event) {
    if (event.state) {
        url_parameters["id"] = event.state["id"]
        next(problems[url_parameters["id"] - 1], false)
    }
}

// Exports
Object.assign(exports, {
    init: init
})