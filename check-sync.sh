#!/bin/bash
# Check if root files are in sync with docs directory
# This ensures GitHub Pages deployment matches local development

echo "Checking sync between root and docs directory..."
errors=0

# Files that should be kept in sync
files_to_check=(
    "workbench.html"
    "index.html"
    "styles.css"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ] && [ -f "docs/$file" ]; then
        if ! diff -q "$file" "docs/$file" > /dev/null 2>&1; then
            echo "❌ ERROR: $file is out of sync with docs/$file"
            echo "   Run: cp $file docs/$file  OR  cp docs/$file $file (depending on which is correct)"
            errors=$((errors + 1))
        else
            echo "✅ $file is in sync"
        fi
    fi
done

# Check directories that should be in sync
dirs_to_check=(
    "workbench"
    "chartspec"
    "components"
    "state"
    "styles"
)

for dir in "${dirs_to_check[@]}"; do
    if [ -d "$dir" ] && [ -d "docs/$dir" ]; then
        if ! diff -qr "$dir" "docs/$dir" > /dev/null 2>&1; then
            echo "❌ ERROR: $dir/ is out of sync with docs/$dir/"
            echo "   Run: rsync -av $dir/ docs/$dir/  OR  rsync -av docs/$dir/ $dir/ (depending on which is correct)"
            errors=$((errors + 1))
        else
            echo "✅ $dir/ is in sync"
        fi
    fi
done

if [ $errors -eq 0 ]; then
    echo ""
    echo "✅ All files are in sync!"
    exit 0
else
    echo ""
    echo "❌ Found $errors sync issue(s). Please fix them before committing."
    exit 1
fi
