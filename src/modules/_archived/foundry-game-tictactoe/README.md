# Tic-Tac-Toe for FoundryVTT

A simple Tic-Tac-Toe game implementation using CFG Core Concepts abstraction layer.

## Purpose

This module validates the CFG Core Concepts architecture by implementing the simplest possible game. It demonstrates:

- ✅ **sheets** - Game state tracking
- ✅ **attributes** - Turn counter, current player, game status
- ✅ **types** - Player roles (X or O)
- ✅ **boards** - 3×3 grid scene
- ✅ **tiles** - 9 playable squares
- ✅ **objects** - X and O markers
- ✅ **rules** - Win conditions (3 in a row), turn order
- ✅ **events** - Move made, game won, game draw
- ✅ **goals** - Get 3 in a row
- ✅ **sessions** - Single game session
- ✅ **modes** - Play mode
- ✅ **systems** - Turn-based gameplay

## Requirements

- FoundryVTT v13+
- `foundry-core-concepts` module v1.0.0+

## Installation

1. Install `foundry-core-concepts` module
2. Install this module
3. Activate both in your world

## How to Play

1. GM creates a new scene with 3×3 grid
2. Assign two players to X and O roles
3. Players take turns clicking tiles to place their markers
4. First player to get 3 in a row wins
5. If all 9 tiles are filled with no winner, it's a draw

## Core Concepts Used

This module uses the following CFG Core Concepts:

| Concept | Implementation |
|---------|---------------|
| **sheets** | Game state stored in game world flags |
| **attributes** | `currentPlayer`, `turnCount`, `gameStatus`, `winner` |
| **types** | Player roles: "X" or "O" |
| **boards** | 3×3 grid scene |
| **tiles** | 9 clickable tiles (canvas grid positions) |
| **objects** | X marker token, O marker token |
| **rules** | Turn order, win detection, draw detection |
| **events** | `moveMade`, `gameWon`, `gameDraw` |
| **goals** | Get 3 markers in a row (horizontal, vertical, or diagonal) |
| **sessions** | Game lifecycle (not started → in progress → completed) |
| **modes** | Play mode (only mode in this simple game) |
| **systems** | Turn-based system, win detection system |

## License

MIT License - See LICENSE file
