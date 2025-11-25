#!/bin/bash
###############################################################################
# Generate Hex Masks for All Resolutions
###############################################################################
#
# This script creates reusable hexagonal masks for applying transparency
# to rectangular hex tile images at all supported resolutions.
#
# Usage:
#   bash scripts/generate-hex-mask.sh
#
# Output:
#   public/masks/hex_mask_610x528.png  - Base scale (1px = 10ft)
#   public/masks/hex_mask_305x264.png  - Small scale (50%)
#   public/masks/hex_mask_6100x5280.png - Large scale (10×)
#
###############################################################################

set -e  # Exit on error

# Output directory
MASK_DIR="public/masks"

# Create directory if it doesn't exist
mkdir -p "$MASK_DIR"

echo "Generating hexagonal masks for all resolutions..."
echo ""

###############################################################################
# Base mask: 610×528 pixels (1px = 10 feet)
###############################################################################

echo "1. Generating base mask (610×528)..."

# Vertices for flat-top hexagon (610×528):
#   (305, 0)   - Top vertex
#   (610, 132) - Right vertex (upper)
#   (610, 396) - Right vertex (lower)
#   (305, 528) - Bottom vertex
#   (0, 396)   - Left vertex (lower)
#   (0, 132)   - Left vertex (upper)

convert -size 610x528 xc:none \
  -fill white \
  -draw "polygon 305,0 610,132 610,396 305,528 0,396 0,132" \
  "${MASK_DIR}/hex_mask_610x528.png"

echo "   ✓ Base mask created: ${MASK_DIR}/hex_mask_610x528.png"

###############################################################################
# Small mask: 305×264 pixels (50% scale, zoom out)
###############################################################################

echo "2. Generating small mask (305×264)..."

# Vertices for flat-top hexagon (305×264):
# All coordinates are exactly half of base
#   (152.5, 0)   → (153, 0)   - Top vertex (rounded)
#   (305, 66)                  - Right vertex (upper)
#   (305, 198)                 - Right vertex (lower)
#   (152.5, 264) → (153, 264) - Bottom vertex (rounded)
#   (0, 198)                   - Left vertex (lower)
#   (0, 66)                    - Left vertex (upper)

convert -size 305x264 xc:none \
  -fill white \
  -draw "polygon 153,0 305,66 305,198 153,264 0,198 0,66" \
  "${MASK_DIR}/hex_mask_305x264.png"

echo "   ✓ Small mask created: ${MASK_DIR}/hex_mask_305x264.png"

###############################################################################
# Large mask: 6100×5280 pixels (10× scale, zoom way out)
###############################################################################

echo "3. Generating large mask (6100×5280)..."

# Vertices for flat-top hexagon (6100×5280):
# All coordinates are exactly 10× base
#   (3050, 0)    - Top vertex
#   (6100, 1320) - Right vertex (upper)
#   (6100, 3960) - Right vertex (lower)
#   (3050, 5280) - Bottom vertex
#   (0, 3960)    - Left vertex (lower)
#   (0, 1320)    - Left vertex (upper)

convert -size 6100x5280 xc:none \
  -fill white \
  -draw "polygon 3050,0 6100,1320 6100,3960 3050,5280 0,3960 0,1320" \
  "${MASK_DIR}/hex_mask_6100x5280.png"

echo "   ✓ Large mask created: ${MASK_DIR}/hex_mask_6100x5280.png"

###############################################################################
# Generate preview with grid overlay (base mask only)
###############################################################################

echo "4. Generating preview..."

PREVIEW_FILE="${MASK_DIR}/hex_mask_610x528_preview.png"

convert "${MASK_DIR}/hex_mask_610x528.png" \
  -stroke red -strokewidth 2 -fill none \
  -draw "polygon 305,0 610,132 610,396 305,528 0,396 0,132" \
  -stroke blue -strokewidth 1 \
  -draw "line 0,0 610,0" \
  -draw "line 610,0 610,528" \
  -draw "line 610,528 0,528" \
  -draw "line 0,528 0,0" \
  -stroke green -strokewidth 1 \
  -draw "line 305,0 305,528" \
  -draw "line 0,264 610,264" \
  -pointsize 16 -fill white -stroke black -strokewidth 1 \
  -annotate +310 +20 "Top (305, 0)" \
  -annotate +615 +140 "Right Upper (610, 132)" \
  -annotate +615 +404 "Right Lower (610, 396)" \
  -annotate +240 +545 "Bottom (305, 528)" \
  -annotate +5 +404 "Left Lower (0, 396)" \
  -annotate +5 +140 "Left Upper (0, 132)" \
  "$PREVIEW_FILE"

echo "   ✓ Preview created: $PREVIEW_FILE"

###############################################################################
# Summary
###############################################################################

echo ""
echo "=========================================="
echo "Hex Mask Generation Complete!"
echo "=========================================="
echo ""
echo "Created masks:"
echo "  1. Base (610×528):  ${MASK_DIR}/hex_mask_610x528.png"
echo "  2. Small (305×264): ${MASK_DIR}/hex_mask_305x264.png"
echo "  3. Large (6100×5280): ${MASK_DIR}/hex_mask_6100x5280.png"
echo "  4. Preview: ${MASK_DIR}/hex_mask_610x528_preview.png"
echo ""
echo "Mask details:"
echo "  - Format: PNG with transparency"
echo "  - Shape: Flat-top hexagon (6 vertices)"
echo "  - Top edge: 305 pixels (3,050 feet / 305 cards)"
echo "  - Side edge: 264 pixels (2,640 feet / 264 cards)"
echo ""
echo "Usage:"
echo "  convert input.png ${MASK_DIR}/hex_mask_610x528.png \\"
echo "    -alpha Off -compose CopyOpacity -composite output.png"
echo ""
echo "Zoom strategy:"
echo "  - Zoom out: Use small (305×264) or large (6100×5280) masks"
echo "  - Zoom in: Switch to underlying square card detail (no mask needed)"
echo ""
