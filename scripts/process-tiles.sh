#!/bin/bash
# Tile Processing Script
# Converts source assets to Crit-Fumble VTT tile format

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed${NC}"
    echo "Install with: sudo apt-get install imagemagick (Linux)"
    echo "Or: brew install imagemagick (Mac)"
    exit 1
fi

# Default values
TILE_TYPE="square"
OUTPUT_BASE="./public/assets/tiles/combat/base"
OUTPUT_DETAIL="./public/assets/tiles/combat/detail"

# Help message
show_help() {
    cat << EOF
Tile Processing Script for Crit-Fumble VTT

Usage: ./process-tiles.sh [OPTIONS] <source_file>

OPTIONS:
    -t, --type TYPE         Tile type: square (default) or hex
    -s, --size SIZE         Target size: base (60px, default) or detail (600px)
    -b, --both              Generate both base and detail versions
    -o, --output DIR        Output directory
    -h, --help              Show this help message

EXAMPLES:
    # Process single square tile (base resolution)
    ./process-tiles.sh source.png

    # Process and generate both resolutions
    ./process-tiles.sh --both source.png

    # Process hex tile
    ./process-tiles.sh --type hex source.png

    # Process tilesheet
    ./process-tiles.sh --tilesheet --columns 10 --rows 10 sheet.png

EOF
}

# Parse arguments
SIZE="base"
BOTH=false
TILESHEET=false
COLUMNS=0
ROWS=0

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TILE_TYPE="$2"
            shift 2
            ;;
        -s|--size)
            SIZE="$2"
            shift 2
            ;;
        -b|--both)
            BOTH=true
            shift
            ;;
        --tilesheet)
            TILESHEET=true
            shift
            ;;
        --columns)
            COLUMNS="$2"
            shift 2
            ;;
        --rows)
            ROWS="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_BASE="$2/base"
            OUTPUT_DETAIL="$2/detail"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            SOURCE_FILE="$1"
            shift
            ;;
    esac
done

# Validate source file
if [ -z "$SOURCE_FILE" ]; then
    echo -e "${RED}Error: No source file specified${NC}"
    show_help
    exit 1
fi

if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}Error: Source file not found: $SOURCE_FILE${NC}"
    exit 1
fi

# Get filename without extension
BASENAME=$(basename "$SOURCE_FILE" | sed 's/\.[^.]*$//')

# Create output directories
mkdir -p "$OUTPUT_BASE"
mkdir -p "$OUTPUT_DETAIL"

echo -e "${GREEN}Processing tile: $SOURCE_FILE${NC}"

# Process square tiles
process_square_tile() {
    local size=$1
    local output_dir=$2
    local pixels=$3
    local output_file="$output_dir/${BASENAME}.png"

    echo -e "${YELLOW}Generating ${size} version (${pixels}x${pixels}px)...${NC}"

    convert "$SOURCE_FILE" \
        -resize "${pixels}x${pixels}" \
        -background none \
        -gravity center \
        -extent "${pixels}x${pixels}" \
        -quality 95 \
        "$output_file"

    # Optimize PNG
    if command -v optipng &> /dev/null; then
        optipng -quiet "$output_file"
    fi

    local filesize=$(du -h "$output_file" | cut -f1)
    echo -e "${GREEN}✓ Created: $output_file ($filesize)${NC}"
}

# Process hex tiles
process_hex_tile() {
    local size=$1
    local output_dir=$2
    local pixels=$3
    local output_file="$output_dir/${BASENAME}.png"

    echo -e "${YELLOW}Generating ${size} hex tile (${pixels}px)...${NC}"

    # Hex tiles need transparency
    convert "$SOURCE_FILE" \
        -resize "${pixels}x${pixels}" \
        -background none \
        -alpha on \
        -gravity center \
        -extent "${pixels}x${pixels}" \
        -quality 95 \
        "$output_file"

    # Validate transparency
    local has_alpha=$(identify -format "%A" "$output_file")
    if [ "$has_alpha" != "True" ]; then
        echo -e "${RED}Warning: Hex tile should have alpha channel${NC}"
    fi

    # Optimize PNG
    if command -v optipng &> /dev/null; then
        optipng -quiet "$output_file"
    fi

    local filesize=$(du -h "$output_file" | cut -f1)
    echo -e "${GREEN}✓ Created: $output_file ($filesize)${NC}"
}

# Process tilesheet
process_tilesheet() {
    local size=$1
    local output_dir=$2
    local tile_size=$3
    local output_file="$output_dir/${BASENAME}-sheet.png"

    echo -e "${YELLOW}Processing tilesheet (${COLUMNS}x${ROWS} tiles, ${tile_size}px each)...${NC}"

    local sheet_width=$((COLUMNS * tile_size))
    local sheet_height=$((ROWS * tile_size))

    # Resize entire sheet
    convert "$SOURCE_FILE" \
        -resize "${sheet_width}x${sheet_height}!" \
        -quality 95 \
        "$output_file"

    echo -e "${GREEN}✓ Created tilesheet: $output_file${NC}"

    # Extract individual tiles
    local tiles_dir="$output_dir/${BASENAME}-tiles"
    mkdir -p "$tiles_dir"

    echo -e "${YELLOW}Extracting individual tiles...${NC}"

    convert "$output_file" \
        -crop "${tile_size}x${tile_size}" \
        +repage \
        "$tiles_dir/tile-%d.png"

    local tile_count=$(ls -1 "$tiles_dir" | wc -l)
    echo -e "${GREEN}✓ Extracted $tile_count tiles to $tiles_dir${NC}"
}

# Main processing logic
if [ "$TILESHEET" = true ]; then
    if [ $COLUMNS -eq 0 ] || [ $ROWS -eq 0 ]; then
        echo -e "${RED}Error: Tilesheet requires --columns and --rows${NC}"
        exit 1
    fi

    if [ "$SIZE" = "base" ] || [ "$BOTH" = true ]; then
        process_tilesheet "base" "$OUTPUT_BASE" 60
    fi

    if [ "$SIZE" = "detail" ] || [ "$BOTH" = true ]; then
        process_tilesheet "detail" "$OUTPUT_DETAIL" 600
    fi
elif [ "$TILE_TYPE" = "square" ]; then
    # Process square tiles
    if [ "$SIZE" = "base" ] || [ "$BOTH" = true ]; then
        process_square_tile "base" "$OUTPUT_BASE" 60
    fi

    if [ "$SIZE" = "detail" ] || [ "$BOTH" = true ]; then
        process_square_tile "detail" "$OUTPUT_DETAIL" 600
    fi
elif [ "$TILE_TYPE" = "hex" ]; then
    # Process hex tiles
    local output_hex_base="./public/assets/tiles/hex/travel-1mile"
    local output_hex_detail="./public/assets/tiles/hex/travel-1mile-detail"
    mkdir -p "$output_hex_base"
    mkdir -p "$output_hex_detail"

    if [ "$SIZE" = "base" ] || [ "$BOTH" = true ]; then
        process_hex_tile "base" "$output_hex_base" 528
    fi

    if [ "$SIZE" = "detail" ] || [ "$BOTH" = true ]; then
        process_hex_tile "detail" "$output_hex_detail" 5280
    fi
else
    echo -e "${RED}Error: Unknown tile type: $TILE_TYPE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tile processing complete!${NC}"

# Show summary
echo ""
echo "Summary:"
echo "--------"
echo "Source: $SOURCE_FILE"
echo "Type: $TILE_TYPE"
if [ "$BOTH" = true ]; then
    echo "Generated: base + detail versions"
else
    echo "Generated: $SIZE version"
fi

# Validation checks
echo ""
echo "Validation:"
echo "-----------"

validate_tile() {
    local file=$1
    local expected_size=$2

    if [ ! -f "$file" ]; then
        return
    fi

    local actual_size=$(identify -format "%wx%h" "$file")
    local filesize=$(du -h "$file" | cut -f1)
    local has_alpha=$(identify -format "%A" "$file")

    echo "File: $(basename $file)"
    echo "  Size: $actual_size (expected: ${expected_size}x${expected_size})"
    echo "  File size: $filesize"
    echo "  Alpha: $has_alpha"

    # Warn if file is too large
    local filesize_kb=$(du -k "$file" | cut -f1)
    if [ $filesize_kb -gt 100 ]; then
        echo -e "  ${YELLOW}Warning: File size > 100KB, consider optimizing${NC}"
    fi
}

if [ "$TILE_TYPE" = "square" ]; then
    [ -f "$OUTPUT_BASE/${BASENAME}.png" ] && validate_tile "$OUTPUT_BASE/${BASENAME}.png" 60
    [ -f "$OUTPUT_DETAIL/${BASENAME}.png" ] && validate_tile "$OUTPUT_DETAIL/${BASENAME}.png" 600
elif [ "$TILE_TYPE" = "hex" ]; then
    [ -f "$output_hex_base/${BASENAME}.png" ] && validate_tile "$output_hex_base/${BASENAME}.png" 528
fi

echo ""
echo -e "${GREEN}Done!${NC}"
