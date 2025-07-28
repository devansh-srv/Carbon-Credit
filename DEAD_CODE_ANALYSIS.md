# Dead Code Analysis Tool

This tool provides comprehensive dead code detection for the Carbon Credit platform, analyzing unused code, dead files, and potential optimizations across all components.

## Overview

The dead code analysis tool scans three main components:
- **Frontend (React)** - React components, unused dependencies, and dead files
- **Backend (Python)** - Dead functions, unused imports, and variables
- **Smart Contracts (Solidity)** - Unused functions and variables

## Quick Start

Run the complete analysis across all components:

```bash
./analyze-dead-code.sh
```

This will generate a comprehensive report in the `dead-code-reports/` directory.

## Component-Specific Analysis

### Frontend Analysis (React)

```bash
cd client
npm run analyze:dead-code
```

**Tools used:**
- `unimported` - finds unused files and dependencies
- `depcheck` - analyzes dependency usage
- `ts-unused-exports` - finds unused exports

**Generated reports:**
- `reports/unimported-analysis.txt` - Unused files and dependencies
- `reports/depcheck-analysis.json` - Dependency analysis
- `reports/summary.json` - Analysis summary

### Backend Analysis (Python)

```bash
cd backend
python3 analyze-dead-code.py
```

**Tools used:**
- `vulture` - finds dead code
- `unimport` - finds unused imports
- `pyflakes` - identifies unused variables

**Generated reports:**
- `reports/vulture-analysis.txt` - Dead code analysis
- `reports/unimport-analysis.txt` - Unused imports
- `reports/pyflakes-analysis.txt` - Code quality issues
- `reports/summary.json` - Analysis summary

### Smart Contracts Analysis (Solidity)

```bash
cd smartContracts
node analyze-dead-code.js
```

**Tools used:**
- Custom analysis for functions and variables
- `depcheck` for dependency analysis
- `solhint` (if available) for linting

**Generated reports:**
- `reports/contracts-analysis.json` - Contract analysis
- `reports/dependencies-analysis.json` - Dependencies

## Understanding the Reports

### Report Structure

Each component generates reports in its local `reports/` directory:
- **JSON files** - Structured data for programmatic use
- **TXT files** - Human-readable detailed output
- **summary.json** - High-level overview of findings

### Confidence Levels

The analysis tools provide confidence levels for findings:
- **High confidence (90-100%)** - Safe to remove
- **Medium confidence (60-89%)** - Review carefully
- **Low confidence (0-59%)** - Requires manual verification

### Common Findings

#### Frontend (React)
- **Unused dependencies** - Libraries not imported anywhere
- **Dead files** - Files not imported by any component
- **Unused exports** - Functions/components exported but not used

#### Backend (Python)
- **Dead functions** - Functions never called
- **Unused imports** - Imports not used in the file
- **Unused variables** - Variables declared but never used

#### Smart Contracts (Solidity)
- **Unused functions** - Functions never called
- **Unused variables** - State variables never accessed
- **Unused events** - Events never emitted

## Installation Requirements

### Frontend
```bash
cd client
npm install
```

The analysis tools are already included in devDependencies.

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Smart Contracts
```bash
cd smartContracts
npm install
```

For enhanced Solidity analysis, install solhint globally:
```bash
npm install -g solhint
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Dead Code Analysis
  run: |
    chmod +x ./analyze-dead-code.sh
    ./analyze-dead-code.sh
  
- name: Upload Analysis Reports
  uses: actions/upload-artifact@v3
  with:
    name: dead-code-reports
    path: dead-code-reports/
```

## Best Practices

### Before Removing Code

1. **Review confidence levels** - Prioritize high-confidence findings
2. **Test thoroughly** - Run all tests after removing code
3. **Check documentation** - Ensure removed code isn't documented as API
4. **Consider deprecation** - For public APIs, consider deprecation first

### Regular Maintenance

1. **Run analysis regularly** - Include in CI/CD pipeline
2. **Set thresholds** - Fail builds if too many issues found
3. **Track improvements** - Monitor dead code metrics over time
4. **Team review** - Have team members review findings

## Troubleshooting

### Common Issues

**"Tool not found" errors:**
- Ensure all dependencies are installed
- Check that node_modules/.bin is in PATH for frontend tools
- Verify Python packages are installed for backend tools

**"Permission denied" errors:**
- Run `chmod +x analyze-dead-code.sh` to make script executable
- Ensure script files have proper permissions

**"No issues found" but code seems unused:**
- Tools may have false negatives
- Manual review is still recommended
- Consider adding to ignore lists for known false positives

### Advanced Configuration

Create `.unimportedrc.json` in the frontend directory:
```json
{
  "ignore": ["src/reportWebVitals.js", "src/setupTests.js"],
  "ignorePatterns": ["**/*.test.js", "**/*.spec.js"]
}
```

Create `pyproject.toml` in the backend directory:
```toml
[tool.vulture]
min_confidence = 80
paths = ["app"]
exclude = ["migrations/"]
```

## Contributing

To improve the dead code analysis:

1. Add new analysis tools to the respective scripts
2. Enhance report generation and formatting
3. Add support for additional file types
4. Improve confidence scoring algorithms

## Support

For issues or questions:
1. Check the generated reports for detailed findings
2. Review the tool documentation linked in each script
3. Consult the project README for general setup issues