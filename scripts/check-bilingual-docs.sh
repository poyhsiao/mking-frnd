#!/bin/bash

# Bilingual documentation check script
# Ensures all documentation changes include both Chinese and English versions

set -e

echo "🔍 Checking bilingual documentation requirements..."

# Get list of modified markdown files in docs/
MODIFIED_DOCS=$(git diff --cached --name-only | grep "^docs/" | grep "\.md$" || true)

if [[ -z "$MODIFIED_DOCS" ]]; then
    echo "✅ No documentation changes detected."
    exit 0
fi

echo "📝 Modified documentation files:"
echo "$MODIFIED_DOCS" | sed 's/^/   - /'
echo ""

# Check for bilingual pairs
MISSING_PAIRS=()

while IFS= read -r file; do
    if [[ "$file" == *"-zh.md" ]]; then
        # Chinese file, check for English counterpart
        english_file="${file%-zh.md}.md"
        if [[ ! -f "$english_file" ]] && [[ ! "$MODIFIED_DOCS" =~ $english_file ]]; then
            MISSING_PAIRS+=("$english_file")
        fi
    elif [[ "$file" == *".md" ]] && [[ "$file" != *"-zh.md" ]]; then
        # English file, check for Chinese counterpart
        chinese_file="${file%.md}-zh.md"
        if [[ ! -f "$chinese_file" ]] && [[ ! "$MODIFIED_DOCS" =~ $chinese_file ]]; then
            MISSING_PAIRS+=("$chinese_file")
        fi
    fi
done <<< "$MODIFIED_DOCS"

# Special cases - files that don't require bilingual versions
EXCLUDED_FILES=(
    "docs/README.md"
    "docs/README-zh.md"
    "docs/CHANGELOG.md"
    "docs/CHANGELOG-zh.md"
)

# Filter out excluded files
FILTERED_MISSING=()
for missing in "${MISSING_PAIRS[@]}"; do
    excluded=false
    for excluded_file in "${EXCLUDED_FILES[@]}"; do
        if [[ "$missing" == "$excluded_file" ]]; then
            excluded=true
            break
        fi
    done
    if [[ "$excluded" == false ]]; then
        FILTERED_MISSING+=("$missing")
    fi
done

if [[ ${#FILTERED_MISSING[@]} -gt 0 ]]; then
    echo "❌ Missing bilingual documentation pairs:"
    printf '   - %s\n' "${FILTERED_MISSING[@]}"
    echo ""
    echo "Please create the missing language versions or add them to the excluded files list."
    exit 1
fi

echo "✅ All bilingual documentation requirements satisfied."
exit 0