CFG Tile Rendering for 5e-compatible (and other ttrpg) play
---------------------
For each scale, we will use the appropriately sized source image, or the original source image resolution, whichever is closer to the scale we need. Not that all views will have zoom controlls, there are the base "100%" values. When zooming in, a higher resolution image can be loaded as available. We want to support all of these resolutions, and make sure we retain the original file and resolution as well, so we can choose a source tile or tileset dynamically depending on the zoom level and screen size.


milli = x1/1,000
centi = x1/100
deci = x1/10
kilo = x1,000
mega = x1,000,000
giga = x1,000,000,000

1 milli-inch = 1/1000 inch (di)
1 centi-inch = 1/100 inch (di)
1 deci-inch = 1/10 inch (di)

1 deci-mile = 528 feet (dm)
1 kilo-foot = 1,000 feet (Kft)

1 hexa-mile = 6 miles (Hm)
1 decahexa-mile = 60 miles (DHm)
1 centahexa-mile = 600 miles (CHm)
1 kilo-mile = 1000 miles (Km)
1 kilohexa-mile = 6000 miles (KHm)


For reference, Earth's diameter is about 7,926 miles, or just under 8 kilo-miles.
Earth's Circumference is 24,901.461 miles, or about 25 Km

Interaction Scale
-----------------
Square Tile Dimensions = gridless, 600 x 600 pixels, where each pixel is 0.1 inches (10 pixels per inch) OR 6000 x 6000 pixels, where each pixel is 0.01 inches (100 pixels per inch)


Combat Scale
------------
Square Tile Dimensions = 5ft squares, 60 x 60 x 3 pixels, where each pixel is 1 inch

Exploration Scales
-----------------
Adventure Location -> Square Tile Dimensions (Inside Buildings, Dungeons, Adventure Locations, Encounters, Small Paths) = 10 ft squares, 30 x 30 x 3 pixels, where each pixel is 4 inches

Settlement/Wilderness -> Hex Tile Dimensions (Settlement / Natural Feature / Wilderness / Small River / Large Path) = 30 ft hexes, 34 x 30 x 5 pixels, where each pixel is 1ft square (may contain interiors/buildings/dungeons, wilderness, and smaller settlements)

Travel / Minimap Scale
------------
Hex Tile Dimensions (County / Wilderness / Small Lake / Large River) = 0.1 mile hex, 610 x 528 pixels, where each pixel is 1 ft Square (may contain Adventure Locations, Encounters, Settlements, Wilderness, and smaller counties)
Hex Tile Dimensions (Province/Small Sea/ Large Lake) = 1 mile hex, 610 x 528 pixels, where each pixel is 10 ft Square (may contain counties, wilderness, and smaller provinces)
Hex Tile Dimensions (Kingdom/Gulf/Large Sea) = 6 mile hex, 610 x 528 pixels, where each pixel is 60 ft Square (may contain provinces, wilderness, and smaller kingdoms)
Hex Tile Dimensions (Continent/Ocean) = 60 mile hex, 610 x 528 pixels, where each pixel is 600 ft Square (may contain kingdoms, seas, islands (various smaller scales), and wilderness)


World Overview Scale
-------------
Hex Tile Dimensions (World) = 6,000 mile voxel, 1,155 x 1,000 hex, where each pixel is 6 miles;




------------------------------------------------------------
Voxel Space Scales (FUTURE)
------------
Hex tiles unite to form many-sided near-spherical objects anhcored on voxels.

1 kilo-mile = 1,000 miles (Km)
1 kilohexa-mile = 6,000 miles (KHm)
1 mega-mile = 1,000,000 miles (Mm)
1 megahexa-mile = 6,000,000 miles (Mm)
1 milli-AU = 92,955.81 miles
1 centi-AU = 929,558.1 miles
1 deci-AU = 9,295,581 miles
1 Astronomical Unit = 92,955,810 miles (just under 93 mega-miles)

Hex Tile Dimensions (Province; 1 mile hexes; each hex is as the province scale above; smaller scales available through iteration)
