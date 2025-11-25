# Tic-Tac-Toe Visual Test Plan

**Module**: `foundry-game-tictactoe`
**Test Type**: Manual Visual Testing with Screenshots
**Environment**: FoundryVTT 13.350+
**Date**: 2025-01-20

## Prerequisites

1. FoundryVTT 13.350+ installed
2. `foundry-core-concepts` module installed
3. `foundry-game-tictactoe` module installed and enabled
4. Test world created

## Screenshot Organization

All screenshots should be saved to:
```
src/modules/foundry-game-tictactoe/tests/screenshots/
```

Structure:
```
screenshots/
├── 01-initialization/
├── 02-new-game/
├── 03-gameplay/
├── 04-win-conditions/
├── 05-draw-condition/
├── 06-reset-game/
├── 07-ui-states/
└── 08-edge-cases/
```

---

## Test 1: Module Initialization

**Objective**: Verify module loads correctly and integrates with FoundryVTT

### Test 1.1: Module Enabled
**Steps**:
1. Launch FoundryVTT
2. Navigate to Setup → Game Worlds → [Test World]
3. Click "Edit World"
4. Go to "Module Management"
5. Verify `foundry-game-tictactoe` appears in list

**Screenshot**: `01-initialization/module-in-list.png`
**Expected**: Module visible with title "Tic-Tac-Toe Game", version 1.0.0

### Test 1.2: Module Activated
**Steps**:
1. Enable `foundry-core-concepts` module (dependency)
2. Enable `foundry-game-tictactoe` module
3. Save and launch world
4. Check browser console for initialization logs

**Screenshot**: `01-initialization/console-logs.png`
**Expected**:
```
foundry-game-tictactoe: Initializing Tic-Tac-Toe
foundry-game-tictactoe: Initialized
foundry-game-tictactoe: Ready
foundry-game-tictactoe: Game loaded, status: not_started
```

### Test 1.3: Scene Controls Button
**Steps**:
1. Once in game world, look at left sidebar (scene controls)
2. Verify hashtag icon (#) button appears

**Screenshot**: `01-initialization/scene-controls-button.png`
**Expected**: Hashtag button visible in scene controls toolbar

---

## Test 2: Opening Game Window

**Objective**: Verify UI application opens and displays correctly

### Test 2.1: Open Game Window
**Steps**:
1. Click hashtag (#) button in scene controls
2. Verify game window opens

**Screenshot**: `02-new-game/window-opened.png`
**Expected**:
- Window title: "Tic-Tac-Toe"
- Status: "Game Not Started"
- 3×3 grid visible (all tiles empty)
- Two buttons: "New Game" and "Reset Game"

### Test 2.2: Window Dimensions
**Steps**:
1. Verify window size is 400px × 500px
2. Try to resize window (should not be resizable)

**Screenshot**: `02-new-game/window-dimensions.png`
**Expected**: Fixed size window, not resizable

---

## Test 3: Starting New Game

**Objective**: Verify game starts correctly and updates UI

### Test 3.1: Click New Game
**Steps**:
1. Click "New Game" button
2. Observe status change
3. Check browser console for notifications

**Screenshot**: `03-gameplay/new-game-started.png`
**Expected**:
- Status changes to "Player X's Turn"
- Board remains empty
- Console shows: "Tic-Tac-Toe: Game started! Player X's turn."

---

## Test 4: Gameplay - Move Placement

**Objective**: Verify tile clicks place markers correctly

### Test 4.1: First Move (X)
**Steps**:
1. Click top-left tile (position 0)
2. Verify X appears
3. Verify status updates

**Screenshot**: `03-gameplay/move-01-x-topleft.png`
**Expected**:
- X marker in top-left (red color: #e74c3c)
- Status: "Player O's Turn"

### Test 4.2: Second Move (O)
**Steps**:
1. Click center tile (position 4)
2. Verify O appears

**Screenshot**: `03-gameplay/move-02-o-center.png`
**Expected**:
- O marker in center (blue color: #3498db)
- Status: "Player X's Turn"

### Test 4.3: Third Move (X)
**Steps**:
1. Click top-center tile (position 1)

**Screenshot**: `03-gameplay/move-03-x-topcenter.png`

### Test 4.4: Multiple Moves Sequence
**Steps**:
1. Continue playing: O → position 3, X → position 5

**Screenshot**: `03-gameplay/move-sequence.png`
**Expected**: Board shows progression of moves

---

## Test 5: Tile Interaction States

**Objective**: Verify hover states and occupied tile behavior

### Test 5.1: Hover on Empty Tile
**Steps**:
1. Hover mouse over empty tile (don't click)
2. Observe background color change

**Screenshot**: `07-ui-states/tile-hover-empty.png`
**Expected**: Background changes to #e0e0e0 (light gray)

### Test 5.2: Click Occupied Tile
**Steps**:
1. Start new game
2. Click tile to place X
3. Try to click same tile again

**Screenshot**: `07-ui-states/tile-occupied-error.png`
**Expected**:
- Cursor shows "not-allowed"
- Notification: "That tile is already occupied!"
- Tile marker doesn't change

### Test 5.3: Hover on Occupied Tile
**Steps**:
1. Hover over occupied tile

**Screenshot**: `07-ui-states/tile-hover-occupied.png`
**Expected**: No hover effect (cursor: not-allowed)

---

## Test 6: Win Conditions

**Objective**: Verify all 8 win patterns are detected correctly

### Test 6.1: Horizontal Win - Top Row
**Steps**:
1. New game
2. X: 0, O: 3, X: 1, O: 4, X: 2 (top row complete)

**Screenshot**: `04-win-conditions/win-horizontal-top.png`
**Expected**:
- Status: "Player X Wins!"
- Game state: completed
- Console: "Tic-Tac-Toe: Player X wins!"

### Test 6.2: Horizontal Win - Middle Row
**Steps**:
1. New game
2. X: 3, O: 0, X: 4, O: 1, X: 5

**Screenshot**: `04-win-conditions/win-horizontal-middle.png`

### Test 6.3: Horizontal Win - Bottom Row
**Steps**:
1. New game
2. X: 6, O: 0, X: 7, O: 1, X: 8

**Screenshot**: `04-win-conditions/win-horizontal-bottom.png`

### Test 6.4: Vertical Win - Left Column
**Steps**:
1. New game
2. X: 1, O: 0, X: 2, O: 3, X: 4, O: 6

**Screenshot**: `04-win-conditions/win-vertical-left.png`

### Test 6.5: Vertical Win - Middle Column
**Steps**:
1. New game
2. X: 0, O: 1, X: 2, O: 4, X: 5, O: 7

**Screenshot**: `04-win-conditions/win-vertical-middle.png`

### Test 6.6: Vertical Win - Right Column
**Steps**:
1. New game
2. X: 0, O: 2, X: 1, O: 5, X: 3, O: 8

**Screenshot**: `04-win-conditions/win-vertical-right.png`

### Test 6.7: Diagonal Win - Top-Left to Bottom-Right
**Steps**:
1. New game
2. X: 0, O: 1, X: 4, O: 2, X: 8

**Screenshot**: `04-win-conditions/win-diagonal-tlbr.png`

### Test 6.8: Diagonal Win - Top-Right to Bottom-Left
**Steps**:
1. New game
2. X: 2, O: 0, X: 4, O: 1, X: 6

**Screenshot**: `04-win-conditions/win-diagonal-trbl.png`

---

## Test 7: Draw Condition

**Objective**: Verify draw detection when board is full

### Test 7.1: Complete Draw Game
**Steps**:
1. New game
2. Play sequence:
   - X: 0, O: 3, X: 1, O: 4, X: 5
   - O: 2, X: 6, O: 7, X: 8
3. Final board state:
   ```
   X X O
   O O X
   X O X
   ```

**Screenshot**: `05-draw-condition/draw-game-complete.png`
**Expected**:
- Status: "It's a Draw!"
- All 9 tiles filled
- No winner

---

## Test 8: Reset Game

**Objective**: Verify reset functionality

### Test 8.1: Reset During Game
**Steps**:
1. Start new game
2. Make a few moves (X: 0, O: 1)
3. Click "Reset Game" button

**Screenshot**: `06-reset-game/reset-during-game.png`
**Expected**:
- Board clears (all tiles empty)
- Status: "Game Not Started"
- Notification: "Tic-Tac-Toe: Game reset"

### Test 8.2: Reset After Win
**Steps**:
1. Complete game with winner
2. Click "Reset Game"

**Screenshot**: `06-reset-game/reset-after-win.png`
**Expected**: Same as above

### Test 8.3: Reset After Draw
**Steps**:
1. Complete game with draw
2. Click "Reset Game"

**Screenshot**: `06-reset-game/reset-after-draw.png**
**Expected**: Same as above

---

## Test 9: Game State Persistence

**Objective**: Verify game state survives page refresh

### Test 9.1: Save and Reload
**Steps**:
1. Start new game
2. Make moves: X: 0, O: 1, X: 4
3. Take screenshot

**Screenshot**: `07-ui-states/before-reload.png`

4. Refresh browser (F5)
5. Reopen game window
6. Take screenshot

**Screenshot**: `07-ui-states/after-reload.png`
**Expected**: Game state identical (same moves, same turn)

---

## Test 10: Edge Cases

**Objective**: Test unusual scenarios and error handling

### Test 10.1: Click Before Starting Game
**Steps**:
1. Open game window (don't click "New Game")
2. Click any tile

**Screenshot**: `08-edge-cases/click-before-start.png`
**Expected**:
- Nothing happens (tiles don't respond)
- Status remains "Game Not Started"

### Test 10.2: Rapid Clicking Same Tile
**Steps**:
1. Start new game
2. Rapidly click same tile 5 times

**Screenshot**: `08-edge-cases/rapid-clicking.png`
**Expected**:
- Only first click registers
- Multiple "already occupied" warnings may appear

### Test 10.3: Try to Move Out of Turn
**Steps**:
1. Start new game (X's turn)
2. X makes move at position 0
3. X tries to move again at position 1

**Screenshot**: `08-edge-cases/out-of-turn.png`
**Expected**:
- Second move rejected
- Notification: "Not your turn! Current player: O"

### Test 10.4: Move After Game Completed
**Steps**:
1. Complete game (win or draw)
2. Try to click empty tile

**Screenshot**: `08-edge-cases/move-after-complete.png`
**Expected**:
- Click has no effect
- Notification: "Game is not in progress!"

---

## Test 11: Responsive Behavior

**Objective**: Verify UI behavior in different scenarios

### Test 11.1: Multiple Windows Open
**Steps**:
1. Click hashtag button twice
2. Verify only one window opens (or second replaces first)

**Screenshot**: `07-ui-states/multiple-windows.png`

### Test 11.2: Move Window Around
**Steps**:
1. Drag window by title bar
2. Move to different positions

**Screenshot**: `07-ui-states/window-moved.png`
**Expected**: Window moves smoothly, content remains intact

### Test 11.3: Close and Reopen Window
**Steps**:
1. Start game, make moves
2. Close window (X button)
3. Reopen via hashtag button

**Screenshot**: `07-ui-states/window-reopened.png`
**Expected**: Game state preserved, window shows current game

---

## Test 12: Button States

**Objective**: Verify button behavior and visual feedback

### Test 12.1: Button Hover States
**Steps**:
1. Hover over "New Game" button
2. Hover over "Reset Game" button

**Screenshots**:
- `07-ui-states/button-new-game-hover.png`
- `07-ui-states/button-reset-game-hover.png`

### Test 12.2: Button Click Feedback
**Steps**:
1. Click and hold "New Game" button
2. Release

**Screenshot**: `07-ui-states/button-click-feedback.png`

---

## Test 13: Browser Console Inspection

**Objective**: Verify game events are firing correctly

### Test 13.1: Event Logging
**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `game.tictactoe.getGameState()`
4. Take screenshot showing game state object

**Screenshot**: `08-edge-cases/console-game-state.png`

### Test 13.2: Hook Events
**Steps**:
1. In console, add hook listener:
   ```javascript
   Hooks.on("tictactoe.moveMade", (data) => console.log("Move:", data));
   ```
2. Make move
3. Verify event logged

**Screenshot**: `08-edge-cases/console-hook-events.png`

---

## Test 14: Accessibility

**Objective**: Basic accessibility checks

### Test 14.1: Keyboard Navigation
**Steps**:
1. Open game window
2. Press Tab key repeatedly
3. Verify focus moves between buttons and tiles

**Screenshot**: `07-ui-states/keyboard-focus.png`
**Expected**: Visual focus indicator on buttons

### Test 14.2: Color Contrast
**Steps**:
1. Use browser DevTools to inspect colors
2. Verify contrast ratios:
   - X marker (red #e74c3c) vs background (#f5f5f5)
   - O marker (blue #3498db) vs background (#f5f5f5)

**Screenshot**: `07-ui-states/color-contrast-check.png`
**Expected**: WCAG AA compliance (4.5:1 minimum)

---

## Test 15: Performance

**Objective**: Verify game performs well

### Test 15.1: Memory Usage
**Steps**:
1. Open browser DevTools → Memory
2. Take heap snapshot before opening game
3. Open game, play 10 complete games
4. Take heap snapshot after
5. Check for memory leaks

**Screenshot**: `08-edge-cases/memory-profile.png`

### Test 15.2: Rendering Performance
**Steps**:
1. Open DevTools → Performance
2. Start recording
3. Play complete game
4. Stop recording
5. Check frame rate and render times

**Screenshot**: `08-edge-cases/performance-profile.png`

---

## Bug Tracking

Use this section to document any bugs found during testing:

### Bug #1: [Bug Title]
- **Severity**: Critical/High/Medium/Low
- **Steps to Reproduce**:
- **Expected**:
- **Actual**:
- **Screenshot**:
- **Status**: Open/Fixed/Wontfix

---

## Test Completion Checklist

- [ ] All 15 test sections completed
- [ ] All required screenshots captured (70+ total)
- [ ] All screenshots organized in correct folders
- [ ] Console logs verified
- [ ] No critical bugs found (or all critical bugs fixed)
- [ ] Game state persistence works correctly
- [ ] All 8 win conditions work
- [ ] Draw condition works
- [ ] Reset functionality works
- [ ] Module loads without errors

---

## Summary Report Template

After completing all tests, fill out:

**Test Date**: [Date]
**Tester**: [Name]
**FoundryVTT Version**: [Version]
**Module Version**: 1.0.0
**Tests Passed**: X / 15
**Bugs Found**: X
**Critical Issues**: X
**Status**: ✅ Ready for Release / ⚠️ Needs Fixes / ❌ Blocked

**Notes**:
[Additional observations]
