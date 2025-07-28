#!/bin/bash

# Main script to run dead code analysis across all components
# Author: Dead Code Analysis Tool
# Description: Comprehensive dead code detection for Carbon Credit platform

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORTS_DIR="$PROJECT_ROOT/dead-code-reports"

# Create main reports directory
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🔍 Carbon Credit Platform - Dead Code Analysis${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "${YELLOW}Timestamp: $(date)${NC}"
echo -e "${YELLOW}Project Root: $PROJECT_ROOT${NC}"
echo -e "${YELLOW}Reports Directory: $REPORTS_DIR${NC}"
echo

# Function to run component analysis
run_component_analysis() {
    local component=$1
    local script_path=$2
    local description=$3
    
    echo -e "${BLUE}📊 Analyzing $component...${NC}"
    echo -e "${BLUE}$description${NC}"
    echo "----------------------------------------"
    
    if [ -f "$script_path" ]; then
        cd "$(dirname "$script_path")"
        
        # Create component-specific reports directory
        local component_reports="$REPORTS_DIR/${component,,}"
        mkdir -p "$component_reports"
        
        # Run the analysis script
        if [[ "$script_path" == *.py ]]; then
            python3 "$(basename "$script_path")" || true
        elif [[ "$script_path" == *.js ]]; then
            node "$(basename "$script_path")" || true
        fi
        
        # Copy reports to main reports directory
        if [ -d "reports" ]; then
            cp -r reports/* "$component_reports/" 2>/dev/null || true
            echo -e "${GREEN}✅ $component analysis completed${NC}"
        else
            echo -e "${YELLOW}⚠️  No reports directory found for $component${NC}"
        fi
        
        cd "$PROJECT_ROOT"
    else
        echo -e "${RED}❌ Analysis script not found: $script_path${NC}"
    fi
    
    echo
}

# 1. Analyze React Frontend
run_component_analysis \
    "Frontend" \
    "$PROJECT_ROOT/client/analyze-dead-code.js" \
    "Scanning React components, unused dependencies, and dead files"

# 2. Analyze Python Backend
run_component_analysis \
    "Backend" \
    "$PROJECT_ROOT/backend/analyze-dead-code.py" \
    "Scanning Python code for dead functions, unused imports, and variables"

# 3. Analyze Smart Contracts
run_component_analysis \
    "SmartContracts" \
    "$PROJECT_ROOT/smartContracts/analyze-dead-code.js" \
    "Scanning Solidity contracts for unused functions and variables"

# 4. Generate consolidated report
echo -e "${BLUE}📋 Generating consolidated report...${NC}"
echo "----------------------------------------"

CONSOLIDATED_REPORT="$REPORTS_DIR/consolidated-report.json"

cat > "$CONSOLIDATED_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "project": "Carbon Credit Platform",
  "analysis_type": "Dead Code Detection",
  "components": {
    "frontend": {
      "path": "$PROJECT_ROOT/client",
      "technology": "React/JavaScript",
      "reports_directory": "$REPORTS_DIR/frontend"
    },
    "backend": {
      "path": "$PROJECT_ROOT/backend",
      "technology": "Python/Flask",
      "reports_directory": "$REPORTS_DIR/backend"
    },
    "smartContracts": {
      "path": "$PROJECT_ROOT/smartContracts",
      "technology": "Solidity",
      "reports_directory": "$REPORTS_DIR/smartcontracts"
    }
  },
  "tools_used": {
    "frontend": ["unimported", "depcheck", "ts-unused-exports"],
    "backend": ["vulture", "unimport", "pyflakes"],
    "smartContracts": ["custom-analysis", "solhint"]
  },
  "reports_location": "$REPORTS_DIR"
}
EOF

# 5. Create summary
echo -e "${BLUE}📊 Analysis Summary${NC}"
echo "================================"

# Count total files analyzed
total_reports=$(find "$REPORTS_DIR" -name "*.json" -o -name "*.txt" | wc -l)
echo -e "${GREEN}📄 Total reports generated: $total_reports${NC}"

# List all generated reports
echo -e "${YELLOW}📁 Generated reports:${NC}"
find "$REPORTS_DIR" -type f \( -name "*.json" -o -name "*.txt" \) | sort | while read -r file; do
    echo "  - $(basename "$file")"
done

# 6. Generate HTML summary (if possible)
HTML_REPORT="$REPORTS_DIR/index.html"
cat > "$HTML_REPORT" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Carbon Credit Platform - Dead Code Analysis</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; }
        .component { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .reports { margin-top: 10px; }
        .report-link { display: block; margin: 5px 0; color: #0066cc; }
        .summary { background-color: #e8f5e8; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Carbon Credit Platform - Dead Code Analysis</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>Project:</strong> Carbon Credit Trading Platform</p>
    </div>

    <div class="summary">
        <h2>📊 Analysis Summary</h2>
        <p>This analysis scans the Carbon Credit platform for unused code, dead files, and potential optimizations across all components.</p>
    </div>

    <div class="component">
        <h2>🌐 Frontend (React)</h2>
        <p>Analysis of React components, unused dependencies, and dead files.</p>
        <div class="reports">
            <strong>Reports:</strong>
            <a href="frontend/summary.json" class="report-link">Summary Report</a>
            <a href="frontend/unimported-analysis.json" class="report-link">Unused Files & Dependencies</a>
            <a href="frontend/depcheck-analysis.json" class="report-link">Dependency Analysis</a>
        </div>
    </div>

    <div class="component">
        <h2>🐍 Backend (Python)</h2>
        <p>Analysis of Python Flask backend for dead functions, unused imports, and variables.</p>
        <div class="reports">
            <strong>Reports:</strong>
            <a href="backend/summary.json" class="report-link">Summary Report</a>
            <a href="backend/vulture-analysis.txt" class="report-link">Dead Code Analysis</a>
            <a href="backend/unimport-analysis.txt" class="report-link">Unused Imports</a>
            <a href="backend/pyflakes-analysis.txt" class="report-link">Code Quality Issues</a>
        </div>
    </div>

    <div class="component">
        <h2>⚡ Smart Contracts (Solidity)</h2>
        <p>Analysis of Solidity smart contracts for unused functions and variables.</p>
        <div class="reports">
            <strong>Reports:</strong>
            <a href="smartcontracts/contracts-analysis.json" class="report-link">Contract Analysis</a>
            <a href="smartcontracts/dependencies-analysis.json" class="report-link">Dependencies</a>
        </div>
    </div>

    <div class="component">
        <h2>🔧 How to Use These Reports</h2>
        <ol>
            <li><strong>Review JSON files</strong> for structured data</li>
            <li><strong>Check TXT files</strong> for detailed analysis output</li>
            <li><strong>Prioritize high-confidence issues</strong> (marked in reports)</li>
            <li><strong>Test thoroughly</strong> before removing any code</li>
        </ol>
    </div>
</body>
</html>
EOF

echo -e "${GREEN}🎉 Analysis Complete!${NC}"
echo "================================"
echo -e "${GREEN}📁 All reports saved to: $REPORTS_DIR${NC}"
echo -e "${GREEN}📄 Consolidated report: $CONSOLIDATED_REPORT${NC}"
echo -e "${GREEN}🌐 HTML summary: $HTML_REPORT${NC}"
echo
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Review the generated reports"
echo "2. Prioritize high-confidence dead code issues"
echo "3. Test thoroughly before removing any code"
echo "4. Use the findings to clean up the codebase"
echo
echo -e "${BLUE}🔍 Happy code cleaning!${NC}"