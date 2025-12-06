#!/bin/bash

set -euo pipefail

# Check if GitHub CLI and jq are installed
if ! command -v gh &> /dev/null || ! command -v jq &> /dev/null; then
    echo "Error: GitHub CLI (gh) and jq are required."
    echo "Install gh: https://cli.github.com/"
    echo "Install jq: https://stedolan.github.io/jq/"
    exit 1
fi

# Check if GITHUB_TOKEN is available
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    echo "Error: GITHUB_TOKEN environment variable is required"
    echo "Set it in your workflow with: env: GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}"
    exit 1
fi

# Authenticate with GitHub CLI
gh auth login --with-token < /dev/null

# Determine if we should delete existing labels
DELETE_EXISTING="${DELETE_EXISTING:-false}"

echo "Starting GitHub labels management..."

# Function to check if we have sufficient permissions
check_permissions() {
    echo "Checking GitHub permissions..."
    if ! gh auth status > /dev/null 2>&1; then
        echo "❌ Failed to authenticate with GitHub. Check your GITHUB_TOKEN."
        return 1
    fi
    
    # Test permissions by trying to list labels
    if ! gh label list > /dev/null 2>&1; then
        echo "❌ Insufficient permissions to manage labels. Ensure your token has 'issues: write' and 'pull-requests: write' permissions."
        return 1
    fi
    
    echo "✅ GitHub authentication and permissions verified."
    return 0
}

# Function to delete all existing labels
delete_existing_labels() {
    echo "Deleting all existing labels..."
    
    # Get all label names and delete them
    if ! label_names=$(gh label list --json name --jq '.[].name' 2>/dev/null); then
        echo "⚠️ Failed to retrieve existing labels. Skipping deletion."
        return 0
    fi
    
    if [[ -n "$label_names" ]]; then
        echo "$label_names" | while IFS= read -r label; do
            if [[ -n "$label" && "$label" != "null" ]]; then
                echo "Deleting label: $label"
                if gh label delete "$label" --yes 2>/dev/null; then
                    echo "✅ Deleted: $label"
                else
                    echo "⚠️ Failed to delete: $label (may not have sufficient permissions)"
                fi
            fi
        done
        echo "Label deletion process completed."
    else
        echo "No labels found to delete."
    fi
}

# Function to create a single label with error handling
create_label() {
    local name="$1"
    local color="$2"
    local description="$3"
    
    echo "Creating label: $name"
    if gh label create "$name" --color "$color" --description "$description" --force 2>/dev/null; then
        echo "✅ Created: $name"
        return 0
    else
        echo "⚠️ Failed to create: $name (may already exist or insufficient permissions)"
        return 1
    fi
}

# Main execution
main() {
    # Check permissions first
    if ! check_permissions; then
        echo "❌ Permission check failed. Aborting label management."
        exit 1
    fi
    
    # Delete existing labels if requested
    if [[ "$DELETE_EXISTING" == "true" ]]; then
        delete_existing_labels
    else
        echo "Skipping label deletion (DELETE_EXISTING=$DELETE_EXISTING)"
    fi
    
    # Create new labels
    echo "Creating labels..."
    
    local success_count=0
    local total_count=0
    
    # Array of labels to create: name, color, description
    declare -a labels=(
        "bug|d73a4a|Something isn't working"
        "feature|a2eeef|New feature request"
        "documentation|0075ca|Improvements or additions to documentation"
        "question|d876e3|Further information is requested"
        "discussion|8b949e|Open-ended conversation or design discussion"
        "security|b60205|Security-related issue"
        "priority: high|b60205|Critical, needs immediate attention"
        "priority: medium|fbca04|Important but not urgent"
        "priority: low|0e8a16|Low urgency, can wait"
        "blocked|e4e669|Cannot proceed due to dependency/blocker"
        "status: in progress|1d76db|Currently being worked on"
        "status: needs review|dbab09|Waiting for review"
        "status: needs triage|e4e669|Needs categorization or investigation"
        "status: duplicate|cccccc|Duplicate of another issue/PR"
        "status: wontfix|ffffff|Not planned to be fixed or implemented"
        "refactor|0366d6|Code improvements without behavior change"
        "performance|5319e7|Performance-related improvement"
        "tests|f4c542|Related to automated/manual tests"
        "chore|fef2c0|Maintenance task, tooling update, cleanup"
        "deps|cfd3d7|Dependency updates or changes"
    )
    
    # Create each label
    for label_info in "${labels[@]}"; do
        total_count=$((total_count + 1))
        IFS='|' read -r name color description <<< "$label_info"
        
        if create_label "$name" "$color" "$description"; then
            success_count=$((success_count + 1))
        fi
    done
    
    echo ""
    echo "Label creation summary:"
    echo "✅ Successfully created: $success_count/$total_count labels"
    
    if [[ $success_count -eq $total_count ]]; then
        echo "🎉 All labels created successfully!"
    elif [[ $success_count -gt 0 ]]; then
        echo "⚠️ Some labels failed to create. This may be due to insufficient permissions or labels already existing."
    else
        echo "❌ No labels were created. Check your GitHub token permissions."
    fi
    
    # Show final label count
    if final_count=$(gh label list --json name --jq 'length' 2>/dev/null); then
        echo "📊 Total labels in repository: $final_count"
    fi
}

# Run main function
main "$@"
