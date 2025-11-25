#!/bin/bash
###############################################################################
# Generate Hex Masks for ALL Scales (50ft through 60 light years)
###############################################################################
#
# This script creates reusable hexagonal masks for applying transparency
# to rectangular hex tile images at ALL 10 supported hex scales.
#
# Scales:
#   1. 50 ft Tactical       - 58×50 pixels   (1px=1ft)
#   2. 300 ft Local         - 346×300 pixels (1px=1ft)
#   3. 1-Mile Province      - 610×528 pixels (1px=10ft)
#   4. 6-Mile Kingdom       - 610×528 pixels (1px=60ft)
#   5. 60-Mile Continent    - 610×528 pixels (1px=600ft)
#   6. 600-Mile World       - 610×528 pixels (1px=6000ft)
#   7. 1,000-Mile Universe  - 610×528 pixels (1px=10000ft) [Mega scale]
#   8. 1 Light Year (Tera)  - 610×528 pixels (1px=50891000000ft)
#   9. 6 Light Years (Ultra)- 610×528 pixels (1px=305346000000ft)
#  10. 60 Light Years (Divine) - 610×528 pixels (1px=3053460000000ft)
#
# Usage:
#   bash scripts/generate-all-hex-masks.sh
#
# Requirements:
#   - ImageMagick (convert command)
#
###############################################################################

set -e  # Exit on error

# Output directory
MASK_DIR="public/masks/hex"

# Create directory if it doesn't exist
mkdir -p "$MASK_DIR"

echo "═══════════════════════════════════════════════════════════"
echo "  GENERATING HEX MASKS FOR ALL SCALES"
echo "═══════════════════════════════════════════════════════════"
echo ""

###############################################################################
# Helper function to calculate hex vertices for flat-top hexagon
###############################################################################
# Formula:
#   width = hex width (point-to-point, longer dimension)
#   height = hex height (flat-to-flat, shorter dimension)
#
# Vertices (from top, clockwise):
#   1. Top: (width/2, 0)
#   2. Right Upper: (width, height/4)
#   3. Right Lower: (width, height - height/4)
#   4. Bottom: (width/2, height)
#   5. Left Lower: (0, height - height/4)
#   6. Left Upper: (0, height/4)
###############################################################################

function generate_hex_mask() {
  local scale_name="$1"
  local width=$2
  local height=$3
  local pixel_scale="$4"
  local description="$5"

  echo "Generating mask: $scale_name"
  echo "  Size: ${width}×${height} pixels"
  echo "  Pixel scale: $pixel_scale"
  echo "  Description: $description"

  # Calculate vertices
  local half_width=$((width / 2))
  local quarter_height=$((height / 4))
  local three_quarter_height=$((height - quarter_height))

  # Vertices
  local v1_x=$half_width
  local v1_y=0

  local v2_x=$width
  local v2_y=$quarter_height

  local v3_x=$width
  local v3_y=$three_quarter_height

  local v4_x=$half_width
  local v4_y=$height

  local v5_x=0
  local v5_y=$three_quarter_height

  local v6_x=0
  local v6_y=$quarter_height

  # Output filename
  local output_file="${MASK_DIR}/hex_mask_${scale_name}_${width}x${height}.png"

  # Generate hex mask
  convert -size ${width}x${height} xc:none \
    -fill white \
    -draw "polygon ${v1_x},${v1_y} ${v2_x},${v2_y} ${v3_x},${v3_y} ${v4_x},${v4_y} ${v5_x},${v5_y} ${v6_x},${v6_y}" \
    "$output_file"

  echo "  ✓ Created: $output_file"
  echo ""
}

###############################################################################
# 1. 50 ft Tactical Hex
###############################################################################
generate_hex_mask \
  "50ft" \
  58 \
  50 \
  "1px=1ft" \
  "Tactical outdoor combat (5ft squares)"

###############################################################################
# 2. 300 ft Local Hex
###############################################################################
generate_hex_mask \
  "300ft" \
  346 \
  300 \
  "1px=1ft" \
  "Local area exploration, adventure locations"

###############################################################################
# 3. 1-Mile Province Hex
###############################################################################
generate_hex_mask \
  "1mile" \
  610 \
  528 \
  "1px=10ft" \
  "Province travel, daily travel tracking"

###############################################################################
# 4. 6-Mile Kingdom Hex
###############################################################################
generate_hex_mask \
  "6mile" \
  610 \
  528 \
  "1px=60ft" \
  "Kingdom-level maps, regional travel"

###############################################################################
# 5. 60-Mile Continent Hex
###############################################################################
generate_hex_mask \
  "60mile" \
  610 \
  528 \
  "1px=600ft" \
  "Continental maps, large regions"

###############################################################################
# 6. 600-Mile World Hex
###############################################################################
generate_hex_mask \
  "600mile" \
  610 \
  528 \
  "1px=6000ft" \
  "World maps, planetary scale"

###############################################################################
# 7. 1,000-Mile Universe Hex (Mega Mile)
###############################################################################
generate_hex_mask \
  "1000mile" \
  610 \
  528 \
  "1px=10000ft" \
  "Universe scale, ship combat, Mega scale (×1,000)"

###############################################################################
# 8. 1 Light Year Interstellar Hex (Tera Mile)
###############################################################################
generate_hex_mask \
  "1lightyear" \
  610 \
  528 \
  "1px=50891000000ft" \
  "Interstellar travel, star systems, Tera scale (×1,000,000)"

###############################################################################
# 9. 6 Light Years Ultra Hex (Ultra Mile)
###############################################################################
generate_hex_mask \
  "6lightyear" \
  610 \
  528 \
  "1px=305346000000ft" \
  "Multi-star systems, Ultra scale (×6,000,000)"

###############################################################################
# 10. 60 Light Years Divine Hex (Divine Mile)
###############################################################################
generate_hex_mask \
  "60lightyear" \
  610 \
  528 \
  "1px=3053460000000ft" \
  "Galactic regions, deity domains, Divine scale (×60,000,000)"

###############################################################################
# Generate Preview Images for Each Scale
###############################################################################

echo "═══════════════════════════════════════════════════════════"
echo "  GENERATING PREVIEW IMAGES"
echo "═══════════════════════════════════════════════════════════"
echo ""

function generate_preview() {
  local scale_name="$1"
  local width=$2
  local height=$3
  local description="$4"

  local mask_file="${MASK_DIR}/hex_mask_${scale_name}_${width}x${height}.png"
  local preview_file="${MASK_DIR}/hex_mask_${scale_name}_${width}x${height}_preview.png"

  # Calculate vertices
  local half_width=$((width / 2))
  local quarter_height=$((height / 4))
  local three_quarter_height=$((height - quarter_height))

  echo "Generating preview: $scale_name"

  # Create preview with annotations
  convert "$mask_file" \
    -stroke red -strokewidth 2 -fill none \
    -draw "polygon ${half_width},0 ${width},${quarter_height} ${width},${three_quarter_height} ${half_width},${height} 0,${three_quarter_height} 0,${quarter_height}" \
    -stroke blue -strokewidth 1 \
    -draw "line 0,0 ${width},0" \
    -draw "line ${width},0 ${width},${height}" \
    -draw "line ${width},${height} 0,${height}" \
    -draw "line 0,${height} 0,0" \
    -pointsize 12 -fill white -stroke black -strokewidth 1 \
    -gravity North -annotate +0+5 "$description" \
    -gravity South -annotate +0+5 "${width}×${height}" \
    "$preview_file"

  echo "  ✓ Preview: $preview_file"
  echo ""
}

# Generate previews for each scale
generate_preview "50ft" 58 50 "50 ft Tactical"
generate_preview "300ft" 346 300 "300 ft Local"
generate_preview "1mile" 610 528 "1-Mile Province"
generate_preview "6mile" 610 528 "6-Mile Kingdom"
generate_preview "60mile" 610 528 "60-Mile Continent"
generate_preview "600mile" 610 528 "600-Mile World"
generate_preview "1000mile" 610 528 "1,000-Mile Universe (Mega)"
generate_preview "1lightyear" 610 528 "1 Light Year (Tera)"
generate_preview "6lightyear" 610 528 "6 Light Years (Ultra)"
generate_preview "60lightyear" 610 528 "60 Light Years (Divine)"

###############################################################################
# Generate Index HTML for Visual Verification
###############################################################################

echo "═══════════════════════════════════════════════════════════"
echo "  GENERATING INDEX HTML"
echo "═══════════════════════════════════════════════════════════"
echo ""

INDEX_FILE="${MASK_DIR}/index.html"

cat > "$INDEX_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hex Mask Gallery - All Scales</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #1a1a1a;
      color: #e0e0e0;
      margin: 0;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #ffffff;
      border-bottom: 2px solid #444;
      padding-bottom: 10px;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .mask-card {
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .mask-card h2 {
      margin-top: 0;
      color: #4CAF50;
      font-size: 1.2em;
    }
    .mask-card p {
      font-size: 0.9em;
      color: #aaa;
      margin: 5px 0;
    }
    .mask-preview {
      background: #333;
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
      display: inline-block;
    }
    .mask-preview img {
      max-width: 100%;
      height: auto;
      border: 1px solid #555;
    }
    .scale-type {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      margin: 5px 0;
    }
    .tactical { background: #2196F3; color: white; }
    .regional { background: #FF9800; color: white; }
    .cosmic { background: #9C27B0; color: white; }
  </style>
</head>
<body>
  <h1>Hex Mask Gallery - All 10 Scales</h1>
  <p style="text-align: center; color: #aaa;">
    Generated hex masks for all scales from 50 ft tactical to 60 light year divine
  </p>

  <div class="gallery">
    <!-- 50 ft Tactical -->
    <div class="mask-card">
      <h2>50 ft Tactical</h2>
      <span class="scale-type tactical">Tactical Combat</span>
      <p>58×50 pixels | 1px=1ft</p>
      <div class="mask-preview">
        <img src="hex_mask_50ft_58x50_preview.png" alt="50ft hex mask">
      </div>
      <p><small>Outdoor combat encounters</small></p>
    </div>

    <!-- 300 ft Local -->
    <div class="mask-card">
      <h2>300 ft Local</h2>
      <span class="scale-type tactical">Adventure Scale</span>
      <p>346×300 pixels | 1px=1ft</p>
      <div class="mask-preview">
        <img src="hex_mask_300ft_346x300_preview.png" alt="300ft hex mask">
      </div>
      <p><small>Local area exploration</small></p>
    </div>

    <!-- 1-Mile Province -->
    <div class="mask-card">
      <h2>1-Mile Province</h2>
      <span class="scale-type regional">Regional Travel</span>
      <p>610×528 pixels | 1px=10ft</p>
      <div class="mask-preview">
        <img src="hex_mask_1mile_610x528_preview.png" alt="1mile hex mask">
      </div>
      <p><small>Province travel, hex crawls</small></p>
    </div>

    <!-- 6-Mile Kingdom -->
    <div class="mask-card">
      <h2>6-Mile Kingdom</h2>
      <span class="scale-type regional">Kingdom Maps</span>
      <p>610×528 pixels | 1px=60ft</p>
      <div class="mask-preview">
        <img src="hex_mask_6mile_610x528_preview.png" alt="6mile hex mask">
      </div>
      <p><small>Regional travel</small></p>
    </div>

    <!-- 60-Mile Continent -->
    <div class="mask-card">
      <h2>60-Mile Continent</h2>
      <span class="scale-type regional">Continental Maps</span>
      <p>610×528 pixels | 1px=600ft</p>
      <div class="mask-preview">
        <img src="hex_mask_60mile_610x528_preview.png" alt="60mile hex mask">
      </div>
      <p><small>Large regions</small></p>
    </div>

    <!-- 600-Mile World -->
    <div class="mask-card">
      <h2>600-Mile World</h2>
      <span class="scale-type regional">World Maps</span>
      <p>610×528 pixels | 1px=6000ft</p>
      <div class="mask-preview">
        <img src="hex_mask_600mile_610x528_preview.png" alt="600mile hex mask">
      </div>
      <p><small>Planetary scale</small></p>
    </div>

    <!-- 1,000-Mile Universe (Mega) -->
    <div class="mask-card">
      <h2>1,000-Mile Universe</h2>
      <span class="scale-type cosmic">Mega Scale (×1K)</span>
      <p>610×528 pixels | 1px=10000ft</p>
      <div class="mask-preview">
        <img src="hex_mask_1000mile_610x528_preview.png" alt="1000mile hex mask">
      </div>
      <p><small>Ship combat, lesser deities</small></p>
    </div>

    <!-- 1 Light Year (Tera) -->
    <div class="mask-card">
      <h2>1 Light Year Interstellar</h2>
      <span class="scale-type cosmic">Tera Scale (×1M)</span>
      <p>610×528 pixels | 1px=50.891B ft</p>
      <div class="mask-preview">
        <img src="hex_mask_1lightyear_610x528_preview.png" alt="1lightyear hex mask">
      </div>
      <p><small>Star systems, galaxy maps</small></p>
    </div>

    <!-- 6 Light Years (Ultra) -->
    <div class="mask-card">
      <h2>6 Light Years Ultra</h2>
      <span class="scale-type cosmic">Ultra Scale (×6M)</span>
      <p>610×528 pixels | 1px=305.346B ft</p>
      <div class="mask-preview">
        <img src="hex_mask_6lightyear_610x528_preview.png" alt="6lightyear hex mask">
      </div>
      <p><small>Multi-star systems</small></p>
    </div>

    <!-- 60 Light Years (Divine) -->
    <div class="mask-card">
      <h2>60 Light Years Divine</h2>
      <span class="scale-type cosmic">Divine Scale (×60M)</span>
      <p>610×528 pixels | 1px=3.053T ft</p>
      <div class="mask-preview">
        <img src="hex_mask_60lightyear_610x528_preview.png" alt="60lightyear hex mask">
      </div>
      <p><small>Galactic regions, pantheon deities</small></p>
    </div>
  </div>

  <hr style="margin: 40px 0; border-color: #444;">

  <div style="max-width: 800px; margin: 0 auto;">
    <h2>Usage Instructions</h2>
    <p>Apply a hex mask to an image using ImageMagick:</p>
    <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px; overflow-x: auto;">
convert input_image.png \
  hex_mask_1mile_610x528.png \
  -alpha Off -compose CopyOpacity -composite \
  output_hex_masked.png
    </pre>

    <h3>Cosmic Scale Multipliers</h3>
    <ul>
      <li><strong>Mega (×1,000)</strong>: 1,000-mile hexes - Ship combat, lesser deities</li>
      <li><strong>Tera (×1,000,000)</strong>: 1 light year hexes - Interstellar travel, cosmic entities</li>
      <li><strong>Ultra (×6,000,000)</strong>: 6 light year hexes - Multi-star systems, regional deities</li>
      <li><strong>Divine (×60,000,000)</strong>: 60 light year hexes - Core pantheon deities, galactic scale</li>
    </ul>

    <h3>Tier Progression</h3>
    <ul>
      <li><strong>Tier 1 (Levels 1-4)</strong>: Province (1 mile)</li>
      <li><strong>Tier 2 (Levels 5-10)</strong>: Kingdom (6 miles)</li>
      <li><strong>Tier 3 (Levels 11-16)</strong>: Continent (60 miles)</li>
      <li><strong>Tier 4 (Levels 17-20)</strong>: World (600 miles)</li>
      <li><strong>Tier 5 (Levels 21-24)</strong>: Universe/Mega (1,000 miles)</li>
      <li><strong>Tier 6 (Levels 25-28)</strong>: Interstellar/Tera (1 light year)</li>
      <li><strong>Tier 7 (Levels 29-32)</strong>: Stellar/Ultra (6 light years)</li>
      <li><strong>Tier 8 (Levels 33-36)</strong>: Galactic/Divine (60 light years)</li>
      <li><strong>Tier 9 (Levels 37-42)</strong>: Ascended (Divine scale)</li>
      <li><strong>Tier 10 (Levels 43-50)</strong>: True Deities (Divine scale)</li>
    </ul>
  </div>
</body>
</html>
EOF

echo "✓ Index HTML created: $INDEX_FILE"
echo ""

###############################################################################
# Summary
###############################################################################

echo "═══════════════════════════════════════════════════════════"
echo "  HEX MASK GENERATION COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Generated masks:"
echo "  1. 50 ft Tactical       (58×50)"
echo "  2. 300 ft Local         (346×300)"
echo "  3. 1-Mile Province      (610×528)"
echo "  4. 6-Mile Kingdom       (610×528)"
echo "  5. 60-Mile Continent    (610×528)"
echo "  6. 600-Mile World       (610×528)"
echo "  7. 1,000-Mile Universe  (610×528) [Mega ×1K]"
echo "  8. 1 Light Year         (610×528) [Tera ×1M]"
echo "  9. 6 Light Years        (610×528) [Ultra ×6M]"
echo " 10. 60 Light Years       (610×528) [Divine ×60M]"
echo ""
echo "Output directory: $MASK_DIR"
echo "Preview gallery: $INDEX_FILE"
echo ""
echo "Open $INDEX_FILE in your browser to view all masks!"
echo ""
