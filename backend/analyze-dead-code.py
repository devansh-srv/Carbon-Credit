#!/usr/bin/env python3

import os
import json
import subprocess
import sys
from datetime import datetime

def print_header(title):
    print('=' * 80)
    print(f'🔍 {title}')
    print('=' * 80)

def print_section(title):
    print(f'\n📊 {title}...')
    print('-' * 50)

def run_command(command, description):
    """Run a command and capture output"""
    print_section(description)
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return '', str(e), 1

def main():
    print_header('Python Backend Dead Code Analysis')
    
    # Create reports directory
    reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    
    analysis_results = {
        'timestamp': datetime.now().isoformat(),
        'project': 'Python Backend',
        'analyzedDirectory': os.path.dirname(os.path.abspath(__file__)),
        'tools': []
    }
    
    # 1. Run vulture for dead code detection
    stdout, stderr, returncode = run_command('vulture .', 'Scanning for dead code with vulture')
    
    vulture_issues = []
    if stdout:
        print(stdout)
        vulture_issues = stdout.strip().split('\n') if stdout.strip() else []
        
    with open(os.path.join(reports_dir, 'vulture-analysis.txt'), 'w') as f:
        f.write(f"Vulture Analysis Results\n")
        f.write(f"========================\n\n")
        f.write(f"Found {len(vulture_issues)} potential dead code issues:\n\n")
        f.write(stdout)
        
    analysis_results['tools'].append({
        'name': 'vulture',
        'description': 'Dead code detection',
        'issues_found': len(vulture_issues),
        'exit_code': returncode
    })
    
    print(f"✅ Found {len(vulture_issues)} potential dead code issues")
    
    # 2. Run unimport for unused imports
    stdout, stderr, returncode = run_command('unimport --check .', 'Checking for unused imports with unimport')
    
    unimport_issues = []
    if stdout:
        print(stdout)
        unimport_issues = stdout.strip().split('\n') if stdout.strip() else []
        
    with open(os.path.join(reports_dir, 'unimport-analysis.txt'), 'w') as f:
        f.write(f"Unimport Analysis Results\n")
        f.write(f"=========================\n\n")
        f.write(f"Found {len(unimport_issues)} unused imports:\n\n")
        f.write(stdout)
        
    analysis_results['tools'].append({
        'name': 'unimport',
        'description': 'Unused imports detection',
        'issues_found': len(unimport_issues),
        'exit_code': returncode
    })
    
    print(f"✅ Found {len(unimport_issues)} unused imports")
    
    # 3. Run pyflakes for unused variables and imports
    stdout, stderr, returncode = run_command('pyflakes .', 'Checking for unused variables and imports with pyflakes')
    
    pyflakes_issues = []
    if stdout:
        print(stdout)
        pyflakes_issues = stdout.strip().split('\n') if stdout.strip() else []
        
    with open(os.path.join(reports_dir, 'pyflakes-analysis.txt'), 'w') as f:
        f.write(f"Pyflakes Analysis Results\n")
        f.write(f"=========================\n\n")
        f.write(f"Found {len(pyflakes_issues)} issues:\n\n")
        f.write(stdout)
        
    analysis_results['tools'].append({
        'name': 'pyflakes',
        'description': 'Unused variables and imports detection',
        'issues_found': len(pyflakes_issues),
        'exit_code': returncode
    })
    
    print(f"✅ Found {len(pyflakes_issues)} pyflakes issues")
    
    # 4. Generate file analysis
    print_section('Analyzing Python files in directory')
    
    python_files = []
    for root, dirs, files in os.walk('.'):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in ['__pycache__', '.git', 'venv', 'env', 'migrations']]
        
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                python_files.append(file_path)
    
    analysis_results['file_analysis'] = {
        'total_python_files': len(python_files),
        'files': python_files
    }
    
    print(f"📁 Found {len(python_files)} Python files")
    
    # 5. Save summary report
    with open(os.path.join(reports_dir, 'summary.json'), 'w') as f:
        json.dump(analysis_results, f, indent=2)
    
    # 6. Generate consolidated report
    total_issues = sum(tool['issues_found'] for tool in analysis_results['tools'])
    
    print('\n🎉 Analysis Complete!')
    print('=' * 80)
    print(f"📁 Reports saved to: {reports_dir}")
    print(f"📄 Summary report: {os.path.join(reports_dir, 'summary.json')}")
    print(f"🔍 Total issues found: {total_issues}")
    print("\nReports generated:")
    for file in os.listdir(reports_dir):
        print(f"  - {file}")
    
    # Exit with non-zero code if issues found
    if total_issues > 0:
        print(f"\n⚠️  {total_issues} potential issues found - review the reports!")
        sys.exit(1)
    else:
        print("\n✅ No issues found!")
        sys.exit(0)

if __name__ == '__main__':
    main()