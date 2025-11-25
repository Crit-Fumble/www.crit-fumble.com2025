#!/bin/bash
# Process Dungeon Crawl Stone Soup tiles
# Combine 2x2 grids of 32px tiles (64x64) and scale to 60px for richer detail
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
TEMP_DIR="./temp/tile-processing"

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed${NC}"
    echo "Install with: choco install imagemagick (Windows)"
    echo "Or: brew install imagemagick (Mac)"
    echo "Or: sudo apt-get install imagemagick (Linux)"
    exit 1
fi

echo -e "${GREEN}Processing Dungeon Crawl Stone Soup tiles...${NC}"
echo "Method: Combine 2x2 grids of 32px tiles -> 64x64 -> scale to 60px"
echo "This preserves more detail than simple upscaling!"
echo ""

# Create output directories
mkdir -p "$OUTPUT_BASE/floors"
mkdir -p "$OUTPUT_BASE/walls"
mkdir -p "$OUTPUT_BASE/objects"

mkdir -p "$OUTPUT_DETAIL/floors"
mkdir -p "$OUTPUT_DETAIL/walls"
mkdir -p "$OUTPUT_DETAIL/objects"

mkdir -p "$TEMP_DIR"

# Process 2x2 grid of tiles (64x64 -> 60px base, 600px detail)
process_2x2_grid() {
    local tile1=$1
    local tile2=$2
    local tile3=$3
    local tile4=$4
    local category=$5
    local output_name=$6

    local output_base="$OUTPUT_BASE/$category/${output_name}.png"
    local output_detail="$OUTPUT_DETAIL/$category/${output_name}.png"
    local temp_grid="$TEMP_DIR/${output_name}-grid.png"

    # Create 2x2 grid (64x64 pixels total)
    # Layout:
    #   tile1 tile2
    #   tile3 tile4
    convert \
        \( "$tile1" "$tile2" +append \) \
        \( "$tile3" "$tile4" +append \) \
        -background none \
        -append \
        "$temp_grid"

    # Scale down to 60x60 (base) - this downscaling preserves detail!
    convert "$temp_grid" \
        -filter Lanczos \
        -resize 60x60 \
        -background none \
        -quality 95 \
        "$output_base"

    # Scale up to 600x600 (detail)
    convert "$temp_grid" \
        -filter Lanczos \
        -resize 600x600 \
        -background none \
        -quality 95 \
        "$output_detail"

    # Optimize
    if command -v optipng &> /dev/null; then
        optipng -quiet "$output_base" 2>/dev/null || true
        optipng -quiet "$output_detail" 2>/dev/null || true
    fi

    # Clean up temp file
    rm -f "$temp_grid"
}

# Create 2x2 combinations from a set of tiles
create_floor_combinations() {
    local source_dir=$1
    local pattern=$2  # e.g., "dirt", "stone", "brick"
    local category=$3

    # Find all matching tiles
    local tiles=("$source_dir"/${pattern}*.png)

    if [ ${#tiles[@]} -lt 4 ]; then
        echo -e "${YELLOW}  Warning: Not enough tiles for $pattern (need 4, found ${#tiles[@]})${NC}"
        return
    fi

    # Create combinations
    local count=0
    for ((i=0; i<${#tiles[@]}-3; i+=4)); do
        local basename="${pattern}_2x2_${count}"

        if [ -f "${tiles[$i]}" ] && [ -f "${tiles[$i+1]}" ] && \
           [ -f "${tiles[$i+2]}" ] && [ -f "${tiles[$i+3]}" ]; then

            process_2x2_grid \
                "${tiles[$i]}" "${tiles[$i+1]}" \
                "${tiles[$i+2]}" "${tiles[$i+3]}" \
                "$category" "$basename"

            ((count++))
        fi
    done

    echo -e "${GREEN}  Created $count 2x2 combinations for $pattern${NC}"
}

# Process floor tiles
echo -e "${YELLOW}Processing floor tiles (2x2 combinations)...${NC}"
if [ -d "$SOURCE_DIR/dc-dngn/floor" ]; then
    create_floor_combinations "$SOURCE_DIR/dc-dngn/floor" "dirt" "floors"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/floor" "stone" "floors"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/floor" "crystal_floor" "floors"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/floor" "cobble" "floors"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/floor" "grey_dirt" "floors"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/floor" "pebble" "floors"
else
    echo -e "${RED}  Floor directory not found${NC}"
fi

# Process wall tiles
echo -e "${YELLOW}Processing wall tiles (2x2 combinations)...${NC}"
if [ -d "$SOURCE_DIR/dc-dngn/wall" ]; then
    create_floor_combinations "$SOURCE_DIR/dc-dngn/wall" "brick_brown" "walls"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/wall" "brick_dark" "walls"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/wall" "brick_gray" "walls"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/wall" "stone_dark" "walls"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/wall" "stone_gray" "walls"
    create_floor_combinations "$SOURCE_DIR/dc-dngn/wall" "crystal_wall" "walls"
else
    echo -e "${RED}  Wall directory not found${NC}"
fi

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Tile Processing Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Output:"
echo "  Base (60px):    $OUTPUT_BASE/"
echo "  Detail (600px): $OUTPUT_DETAIL/"
echo ""
echo "Each 60px tile is composed of 2x2 32px tiles for richer detail!"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review tiles in public/assets/tiles/"
echo "  2. Create more combinations manually if needed"
echo "  3. Create CardType definitions from processed tiles"
echo ""
