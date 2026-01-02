#!/bin/bash

# GitHub Actions Monitor Script
# Monitors workflow runs and waits for completion

echo "🚀 Starting GitHub Actions Monitor"
echo "Monitoring workflows for commit: $(git rev-parse HEAD)"
echo ""

# Function to check workflow status
check_workflows() {
    local commit_sha=$(git rev-parse HEAD)
    echo "📋 Checking workflows for commit: $commit_sha"
    echo ""

    # Get all workflow runs for the current commit
    local workflows=$(gh run list --limit 10 --json status,conclusion,headBranch,headSha,createdAt,workflowName)

    echo "🔍 Current Workflow Status:"
    echo "$workflows" | jq -r '.[] | "  - \(.workflowName): \(.status) (\(.conclusion // "in_progress"))"'

    # Check if all critical workflows are completed successfully
    local failed_count=0
    local in_progress_count=0
    local total_count=0

    while IFS= read -r line; do
        ((total_count++))
        conclusion=$(echo "$line" | jq -r '.conclusion // "in_progress"')
        status=$(echo "$line" | jq -r '.status')

        if [ "$status" = "in_progress" ]; then
            ((in_progress_count++))
        elif [ "$conclusion" != "success" ] && [ "$conclusion" != "in_progress" ]; then
            ((failed_count++))
            echo "❌ FAILED: $(echo "$line" | jq -r '.workflowName')"
        fi
    done < <(echo "$workflows" | jq -c '.[]')

    echo ""
    echo "📊 Summary:"
    echo "  Total workflows: $total_count"
    echo "  In Progress: $in_progress_count"
    echo "  Failed: $failed_count"

    # Return success if all critical workflows completed successfully
    if [ "$failed_count" -eq 0 ] && [ "$in_progress_count" -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Monitor loop
max_iterations=30
iteration=0

while [ $iteration -lt $max_iterations ]; do
    ((iteration++))
    echo "========================================="
    echo "Iteration $iteration of $max_iterations"
    echo "========================================="

    if check_workflows; then
        echo ""
        echo "✅ All workflows completed successfully!"
        exit 0
    fi

    echo ""
    echo "⏳ Waiting 30 seconds before next check..."
    sleep 30
done

echo ""
echo "⏰ Timeout reached. Some workflows may still be running."
echo "Check manually with: gh run list"
exit 1