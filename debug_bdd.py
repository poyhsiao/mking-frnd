#!/usr/bin/env python3

import sys
import os
from pathlib import Path

# Add the features/steps directory to the Python path
sys.path.insert(0, str(Path.cwd() / 'features' / 'steps'))

from container_security_steps import SecurityValidator

class MockContext:
    def __init__(self):
        self.security_validator = None
        self.existing_dockerfiles = []
        self.trivy_results = {}

def test_docker_images_built():
    """Test the @given step for Docker images built."""
    print("Testing: Docker images are built")
    context = MockContext()
    
    try:
        # Import and run the step function
        from container_security_steps import step_docker_images_built
        step_docker_images_built(context)
        print("✓ Docker images built step passed")
        return True
    except Exception as e:
        print(f"✗ Docker images built step failed: {e}")
        return False

def test_trivy_scan():
    """Test the @when step for Trivy scan."""
    print("\nTesting: Trivy security scan")
    context = MockContext()
    context.security_validator = SecurityValidator(context)
    context.existing_dockerfiles = ['frontend/Dockerfile', 'backend/Dockerfile']
    
    try:
        # Import and run the step function
        from container_security_steps import step_run_trivy_scan_images
        step_run_trivy_scan_images(context)
        print("✓ Trivy scan step passed")
        print(f"Trivy results: {context.trivy_results}")
        return True
    except Exception as e:
        print(f"✗ Trivy scan step failed: {e}")
        return False

def test_no_critical_vulnerabilities():
    """Test the @then step for no critical vulnerabilities."""
    print("\nTesting: No critical vulnerabilities")
    context = MockContext()
    context.security_validator = SecurityValidator(context)
    context.existing_dockerfiles = ['frontend/Dockerfile', 'backend/Dockerfile']
    
    # First run the scan to populate results
    try:
        from container_security_steps import step_run_trivy_scan_images, step_no_critical_vulnerabilities
        step_run_trivy_scan_images(context)
        step_no_critical_vulnerabilities(context)
        print("✓ No critical vulnerabilities step passed")
        return True
    except Exception as e:
        print(f"✗ No critical vulnerabilities step failed: {e}")
        return False

if __name__ == "__main__":
    print("Debugging BDD test steps...\n")
    
    # Test each step individually
    step1_passed = test_docker_images_built()
    step2_passed = test_trivy_scan()
    step3_passed = test_no_critical_vulnerabilities()
    
    print("\n" + "="*50)
    print("Summary:")
    print(f"Docker images built: {'PASS' if step1_passed else 'FAIL'}")
    print(f"Trivy scan: {'PASS' if step2_passed else 'FAIL'}")
    print(f"No critical vulnerabilities: {'PASS' if step3_passed else 'FAIL'}")
    
    if all([step1_passed, step2_passed, step3_passed]):
        print("\n✓ All steps passed individually!")
        sys.exit(0)
    else:
        print("\n✗ Some steps failed")
        sys.exit(1)