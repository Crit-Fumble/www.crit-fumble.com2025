#!/bin/bash

# Clean up any "nul" files created by Windows-style redirects in Git Bash
# These files are created when scripts use "nul" instead of "/dev/null"

echo "🧹 Cleaning up nul files..."

COUNT=0

# Find and remove all files named "nul" (case insensitive)
while IFS= read -r -d '' file; do
  echo "Removing: $file"
  rm "$file"
  ((COUNT++))
done < <(find . -type f \( -iname "nul" -o -iname "NUL" \) -print0 2>/dev/null)

if [ $COUNT -eq 0 ]; then
  echo "✅ No nul files found"
else
  echo "✅ Cleaned up $COUNT nul file(s)"
fi
