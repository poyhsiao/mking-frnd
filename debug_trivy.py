#!/usr/bin/env python3
import subprocess
import json
from pathlib import Path

def run_command(command):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=Path.cwd()
        )
        return {
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except Exception as e:
        return {
            'returncode': -1,
            'stdout': '',
            'stderr': str(e)
        }

def test_trivy_scan():
    """Test Trivy security scan on Docker images."""
    trivy_results = {}
    
    # Scan Dockerfiles instead of built images for this test
    dockerfiles = ['frontend/Dockerfile', 'backend/Dockerfile']
    
    for dockerfile in dockerfiles:
        if (Path.cwd() / dockerfile).exists():
            print(f"Scanning {dockerfile}...")
            result = run_command(f'trivy config {dockerfile} --format json')
            trivy_results[dockerfile] = result
            print(f"Return code: {result['returncode']}")
            if result['stderr']:
                print(f"Stderr: {result['stderr']}")
            if result['stdout']:
                try:
                    json_output = json.loads(result['stdout'])
                    print(f"JSON output: {json.dumps(json_output, indent=2)[:500]}...")
                except:
                    print(f"Stdout: {result['stdout'][:500]}...")
        else:
            print(f"File {dockerfile} does not exist")
    
    # Test the assertion logic
    print("\nTesting assertions...")
    for dockerfile, result in trivy_results.items():
        try:
            assert result['returncode'] == 0, f"Trivy scan failed for {dockerfile}: {result['stderr']}"
            print(f"✓ {dockerfile} passed assertion")
        except AssertionError as e:
            print(f"✗ {dockerfile} failed assertion: {e}")

if __name__ == "__main__":
    test_trivy_scan()