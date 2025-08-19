#!/usr/bin/env python3
"""
Debug script for Kubernetes security context validation.
"""

import sys
import os
from pathlib import Path

# Add the features/steps directory to the path
sys.path.insert(0, str(Path.cwd() / 'features' / 'steps'))

from container_security_steps import SecurityValidator

class MockContext:
    def __init__(self):
        self.security_validator = None
        self.current_deployment = None
        self.deployment_config = None

def test_postgres_security_context():
    """Test PostgreSQL deployment security context validation."""
    print("Testing PostgreSQL deployment security context...")
    
    context = MockContext()
    context.security_validator = SecurityValidator(context)
    
    try:
        # Test step 1: Check if PostgreSQL deployment exists
        postgres_deployment = Path.cwd() / 'k8s' / 'postgres-deployment.yaml'
        print(f"Checking if PostgreSQL deployment exists: {postgres_deployment}")
        assert postgres_deployment.exists(), "PostgreSQL deployment manifest not found"
        context.current_deployment = 'k8s/postgres-deployment.yaml'
        print("✓ PostgreSQL deployment manifest exists")
        
        # Test step 2: Load and validate security context
        print("Loading deployment configuration...")
        context.deployment_config = context.security_validator.load_yaml_file(context.current_deployment)
        print("✓ Deployment configuration loaded")
        
        # Test step 3: Verify pod runs as non-root user (999)
        print("Checking pod security context...")
        spec = context.deployment_config['spec']['template']['spec']
        
        # Check pod-level security context
        assert 'securityContext' in spec, "No pod-level security context found"
        pod_security = spec['securityContext']
        
        print(f"Pod security context: {pod_security}")
        
        assert pod_security.get('runAsNonRoot') is True, "runAsNonRoot not set to true"
        assert pod_security.get('runAsUser') == 999, f"runAsUser not set to 999, got {pod_security.get('runAsUser')}"
        assert pod_security.get('runAsGroup') == 999, f"runAsGroup not set to 999, got {pod_security.get('runAsGroup')}"
        print("✓ Pod runs as non-root user (999)")
        
        # Test step 4: Verify readOnlyRootFilesystem
        print("Checking container security contexts...")
        containers = context.deployment_config['spec']['template']['spec']['containers']
        
        for container in containers:
            print(f"Checking container: {container['name']}")
            assert 'securityContext' in container, f"No security context in container {container['name']}"
            container_security = container['securityContext']
            print(f"Container security context: {container_security}")
            assert container_security.get('readOnlyRootFilesystem') is True, \
                f"readOnlyRootFilesystem not set to true in container {container['name']}"
        print("✓ readOnlyRootFilesystem is set to true")
        
        # Test step 5: Verify privilege escalation is disabled
        print("Checking privilege escalation...")
        for container in containers:
            container_security = container['securityContext']
            assert container_security.get('allowPrivilegeEscalation') is False, \
                f"allowPrivilegeEscalation not disabled in container {container['name']}"
        print("✓ Privilege escalation is disabled")
        
        # Test step 6: Verify all capabilities are dropped
        print("Checking capabilities...")
        for container in containers:
            container_security = container['securityContext']
            capabilities = container_security.get('capabilities', {})
            dropped_caps = capabilities.get('drop', [])
            assert 'ALL' in dropped_caps, f"ALL capabilities not dropped in container {container['name']}"
        print("✓ All capabilities are dropped")
        
        print("\n🎉 All PostgreSQL security context tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ PostgreSQL security context test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_redis_security_context():
    """Test Redis deployment security context validation."""
    print("\nTesting Redis deployment security context...")
    
    context = MockContext()
    context.security_validator = SecurityValidator(context)
    
    try:
        # Test step 1: Check if Redis deployment exists
        redis_deployment = Path.cwd() / 'k8s' / 'redis-deployment.yaml'
        print(f"Checking if Redis deployment exists: {redis_deployment}")
        assert redis_deployment.exists(), "Redis deployment manifest not found"
        context.current_deployment = 'k8s/redis-deployment.yaml'
        print("✓ Redis deployment manifest exists")
        
        # Test step 2: Load and validate security context
        print("Loading deployment configuration...")
        context.deployment_config = context.security_validator.load_yaml_file(context.current_deployment)
        print("✓ Deployment configuration loaded")
        
        # Test step 3: Verify pod runs as non-root user (999)
        print("Checking pod security context...")
        spec = context.deployment_config['spec']['template']['spec']
        
        # Check pod-level security context
        assert 'securityContext' in spec, "No pod-level security context found"
        pod_security = spec['securityContext']
        
        print(f"Pod security context: {pod_security}")
        
        assert pod_security.get('runAsNonRoot') is True, "runAsNonRoot not set to true"
        assert pod_security.get('runAsUser') == 999, f"runAsUser not set to 999, got {pod_security.get('runAsUser')}"
        assert pod_security.get('runAsGroup') == 999, f"runAsGroup not set to 999, got {pod_security.get('runAsGroup')}"
        print("✓ Pod runs as non-root user (999)")
        
        print("\n🎉 All Redis security context tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Redis security context test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Kubernetes Security Context Debug Script ===")
    
    postgres_success = test_postgres_security_context()
    redis_success = test_redis_security_context()
    
    if postgres_success and redis_success:
        print("\n🎉 All Kubernetes security tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some Kubernetes security tests failed!")
        sys.exit(1)