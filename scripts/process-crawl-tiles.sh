#!/bin/bash
# Process Dungeon Crawl Stone Soup tiles from 32px to 60px
# For Crit-Fumble VTT (5ft = 60px @ 1:60 scale)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Paths
SOURCE_DIR="./public/img/game/opengameart/crawl-tiles_Oct-5-2010"
OUTPUT_BASE="./public/assets/tiles/combat/base"
OUTPUT_DETAIL="./public/assets/tiles/combat/detail"

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed${NC}"
    echo "Install with: choco install imagemagick (Windows)"
    echo "Or: brew install imagemagick (Mac)"
    echo "Or: sudo apt-get install imagemagick (Linux)"
    exit 1
fi

echo -e "${GREEN}Processing Dungeon Crawl Stone Soup tiles...${NC}"
echo "Source: 32x32 pixels"
echo "Target: 60x60 pixels (base) and 600x600 pixels (detail)"
echo ""

# Create output directories
mkdir -p "$OUTPUT_BASE/floors"
mkdir -p "$OUTPUT_BASE/walls"
mkdir -p "$OUTPUT_BASE/objects"
mkdir -p "$OUTPUT_BASE/effects"

mkdir -p "$OUTPUT_DETAIL/floors"
mkdir -p "$OUTPUT_DETAIL/walls"
mkdir -p "$OUTPUT_DETAIL/objects"
mkdir -p "$OUTPUT_DETAIL/effects"

# Process function
process_tile() {
    local source_file=$1
    local category=$2
    local basename=$(basename "$source_file" .png)

    local output_base="$OUTPUT_BASE/$category/${basename}.png"
    local output_detail="$OUTPUT_DETAIL/$category/${basename}.png"

    # Base version (60x60)
    convert "$source_file" \
        -filter Lanczos \
        -resize 60x60 \
        -background none \
        -gravity center \
        -extent 60x60 \
        -quality 95 \
        "$output_base"

    # Detail version (600x600)
    convert "$source_file" \
        -filter Lanczos \
        -resize 600x600 \
        -background none \
        -gravity center \
        -extent 600x600 \
        -quality 95 \
        "$output_detail"

    # Optimize if optipng is available
    if command -v optipng &> /dev/null; then
        optipng -quiet "$output_base" 2>/dev/null || true
        optipng -quiet "$output_detail" 2>/dev/null || true
    fi
}

# Process floors
echo -e "${YELLOW}Processing floor tiles...${NC}"
floor_count=0
if [ -d "$SOURCE_DIR/dc-dngn/floor" ]; then
    for file in "$SOURCE_DIR/dc-dngn/floor"/*.png; do
        if [ -f "$file" ]; then
            process_tile "$file" "floors"
            ((floor_count++))
        fi
    done
fi
echo -e "${GREEN}✓ Processed $floor_count floor tiles${NC}"

# Process walls
echo -e "${YELLOW}Processing wall tiles...${NC}"
wall_count=0
if [ -d "$SOURCE_DIR/dc-dngn/wall" ]; then
    for file in "$SOURCE_DIR/dc-dngn/wall"/*.png; do
        if [ -f "$file" ]; then
            process_tile "$file" "walls"
            ((wall_count++))
        fi
    done
fi
echo -e "${GREEN}✓ Processed $wall_count wall tiles${NC}"

# Process objects (from item directory)
echo -e "${YELLOW}Processing object tiles...${NC}"
object_count=0
if [ -d "$SOURCE_DIR/item" ]; then
    for file in "$SOURCE_DIR/item"/*.png; do
        if [ -f "$file" ]; then
            process_tile "$file" "objects"
            ((object_count++))
        fi
    done
fi
echo -e "${GREEN}✓ Processed $object_count object tiles${NC}"

# Process effects
echo -e "${YELLOW}Processing effect tiles...${NC}"
effect_count=0
if [ -d "$SOURCE_DIR/effect" ]; then
    for file in "$SOURCE_DIR/effect"/*.png; do
        if [ -f "$file" ]; then
            process_tile "$file" "effects"
            ((effect_count++))
        fi
    done
fi
echo -e "${GREEN}✓ Processed $effect_count effect tiles${NC}"

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Tile Processing Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Summary:"
echo "  Floors:  $floor_count tiles"
echo "  Walls:   $wall_count tiles"
echo "  Objects: $object_count tiles"
echo "  Effects: $effect_count tiles"
echo "  Total:   $((floor_count + wall_count + object_count + effect_count)) tiles"
echo ""
echo "Output:"
echo "  Base (60px):   $OUTPUT_BASE/"
echo "  Detail (600px): $OUTPUT_DETAIL/"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review tiles in public/assets/tiles/"
echo "  2. Create CardType definitions from processed tiles"
echo "  3. Import tiles into database with TileAsset records"
echo ""
