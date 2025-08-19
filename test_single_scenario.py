#!/usr/bin/env python3

import sys
import os
from pathlib import Path

# Add the features/steps directory to the Python path
sys.path.insert(0, str(Path.cwd() / 'features' / 'steps'))

from container_security_steps import SecurityValidator

class MockContext:
    def __init__(self):
        pass

def run_vulnerability_scan_scenario():
    """Run the complete vulnerability scan scenario step by step."""
    print("Running Docker images pass vulnerability scanning scenario...\n")
    
    context = MockContext()
    
    try:
        # Step 1: Docker containers are built with security configurations
        print("Step 1: Docker containers are built with security configurations")
        from container_security_steps import step_docker_containers_built
        step_docker_containers_built(context)
        print("✓ Passed\n")
        
        # Step 2: Kubernetes deployments use secure contexts
        print("Step 2: Kubernetes deployments use secure contexts")
        from container_security_steps import step_k8s_deployments_secure
        step_k8s_deployments_secure(context)
        print("✓ Passed\n")
        
        # Step 3: Trivy security scanner is available
        print("Step 3: Trivy security scanner is available")
        from container_security_steps import step_trivy_available
        step_trivy_available(context)
        print("✓ Passed\n")
        
        # Step 4: Docker images are built
        print("Step 4: Docker images are built")
        from container_security_steps import step_docker_images_built
        step_docker_images_built(context)
        print("✓ Passed\n")
        
        # Step 5: Run Trivy security scan on all images
        print("Step 5: Run Trivy security scan on all images")
        from container_security_steps import step_run_trivy_scan_images
        step_run_trivy_scan_images(context)
        print("✓ Passed\n")
        
        # Step 6: No critical vulnerabilities should be found
        print("Step 6: No critical vulnerabilities should be found")
        from container_security_steps import step_no_critical_vulnerabilities
        step_no_critical_vulnerabilities(context)
        print("✓ Passed\n")
        
        # Step 7: High severity vulnerabilities should be documented
        print("Step 7: High severity vulnerabilities should be documented")
        from container_security_steps import step_high_severity_documented
        step_high_severity_documented(context)
        print("✓ Passed\n")
        
        # Step 8: Base images should be from trusted sources
        print("Step 8: Base images should be from trusted sources")
        from container_security_steps import step_base_images_trusted
        step_base_images_trusted(context)
        print("✓ Passed\n")
        
        # Step 9: Images should use minimal attack surface
        print("Step 9: Images should use minimal attack surface")
        from container_security_steps import step_minimal_attack_surface
        step_minimal_attack_surface(context)
        print("✓ Passed\n")
        
        print("🎉 All steps passed! The vulnerability scanning scenario is working correctly.")
        return True
        
    except Exception as e:
        print(f"✗ Failed at current step: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_vulnerability_scan_scenario()
    sys.exit(0 if success else 1)