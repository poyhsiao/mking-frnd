#!/usr/bin/env python3
"""
Debug script to simulate the full BDD test flow for External Secrets Operator RBAC validation.
This script mimics the exact behavior of the BDD test framework.
"""

import os
import sys
import yaml
from pathlib import Path
from typing import Dict, Any, List

# Add the features/steps directory to the path
sys.path.insert(0, str(Path.cwd() / 'features' / 'steps'))

class MockContext:
    """Mock context object to simulate BDD context."""
    def __init__(self):
        self.security_validator = None
        self.external_secrets_config = None
        self.rbac_resources = None

class SecurityValidator:
    """Security validator class from container_security_steps.py"""
    
    def __init__(self, context):
        self.context = context
    
    def load_yaml_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Load YAML file and return all documents."""
        try:
            with open(file_path, 'r') as file:
                documents = list(yaml.safe_load_all(file))
                # Filter out None documents
                documents = [doc for doc in documents if doc is not None]
                return documents
        except Exception as e:
            print(f"Error loading YAML file {file_path}: {e}")
            raise

def step_external_secrets_manifest_exists(context):
    """Verify external-secrets-operator manifest exists."""
    print("Step 1: Checking external-secrets-operator manifest exists...")
    
    if not hasattr(context, 'security_validator') or context.security_validator is None:
        print("  Initializing SecurityValidator...")
        context.security_validator = SecurityValidator(context)
    
    manifest_path = Path.cwd() / 'k8s' / 'external-secrets-operator.yaml'
    print(f"  Checking manifest path: {manifest_path}")
    
    if not manifest_path.exists():
        raise AssertionError("External secrets operator manifest not found")
    
    print("  Loading YAML configuration...")
    context.external_secrets_config = context.security_validator.load_yaml_file('k8s/external-secrets-operator.yaml')
    print(f"  Loaded {len(context.external_secrets_config)} documents")
    
    return True

def step_validate_rbac_config(context):
    """Validate the RBAC configuration."""
    print("\nStep 2: Validating RBAC configuration...")
    
    if isinstance(context.external_secrets_config, list):
        context.rbac_resources = context.external_secrets_config
    else:
        context.rbac_resources = [context.external_secrets_config]
    
    print(f"  RBAC resources count: {len(context.rbac_resources)}")
    for i, resource in enumerate(context.rbac_resources):
        if resource and 'kind' in resource:
            print(f"    Resource {i+1}: {resource['kind']} - {resource.get('metadata', {}).get('name', 'unnamed')}")
    
    return True

def step_use_role_not_clusterrole(context):
    """Check that Role is used instead of ClusterRole."""
    print("\nStep 3: Checking Role vs ClusterRole usage...")
    
    roles = [r for r in context.rbac_resources if r and r.get('kind') == 'Role']
    cluster_roles = [r for r in context.rbac_resources if r and r.get('kind') == 'ClusterRole']
    
    print(f"  Found {len(roles)} Role(s), {len(cluster_roles)} ClusterRole(s)")
    
    if len(roles) == 0:
        raise AssertionError("No Role found in RBAC configuration")
    
    if len(cluster_roles) > 0:
        raise AssertionError(f"Found {len(cluster_roles)} ClusterRole(s), should use Role instead")
    
    return True

def step_permissions_scoped_to_namespace(context):
    """Check that permissions are scoped to the mking-friend namespace."""
    print("\nStep 4: Checking namespace scoping...")
    
    roles = [r for r in context.rbac_resources if r and r.get('kind') == 'Role']
    role_bindings = [r for r in context.rbac_resources if r and r.get('kind') == 'RoleBinding']
    
    for role in roles:
        namespace = role.get('metadata', {}).get('namespace')
        print(f"  Role '{role.get('metadata', {}).get('name')}' namespace: {namespace}")
        if namespace != 'mking-friend':
            raise AssertionError(f"Role should be in 'mking-friend' namespace, found: {namespace}")
    
    for binding in role_bindings:
        namespace = binding.get('metadata', {}).get('namespace')
        print(f"  RoleBinding '{binding.get('metadata', {}).get('name')}' namespace: {namespace}")
        if namespace != 'mking-friend':
            raise AssertionError(f"RoleBinding should be in 'mking-friend' namespace, found: {namespace}")
    
    return True

def step_secret_access_limited(context):
    """Check that secret access is limited to specific resource names."""
    print("\nStep 5: Checking secret access limitation...")
    
    roles = [r for r in context.rbac_resources if r and r.get('kind') == 'Role']
    
    for role in roles:
        role_name = role.get('metadata', {}).get('name')
        rules = role.get('rules', [])
        print(f"  Role '{role_name}' has {len(rules)} rules")
        
        for rule in rules:
            resources = rule.get('resources', [])
            if 'secrets' in resources:
                resource_names = rule.get('resourceNames', [])
                print(f"    Found secrets rule: {rule}")
                
                if not resource_names:
                    raise AssertionError(f"Secret access should be limited to specific resource names in role {role_name}")
                
                if 'mking-friend-secrets' not in resource_names:
                    raise AssertionError(f"Secret access should include 'mking-friend-secrets', found: {resource_names}")
                
                print(f"    ✅ Secret access limited to: {resource_names}")
    
    return True

def step_no_cluster_wide_permissions(context):
    """Check that no cluster-wide permissions are granted."""
    print("\nStep 6: Checking for cluster-wide permissions...")
    
    cluster_roles = [r for r in context.rbac_resources if r and r.get('kind') == 'ClusterRole']
    cluster_role_bindings = [r for r in context.rbac_resources if r and r.get('kind') == 'ClusterRoleBinding']
    
    print(f"  Found {len(cluster_roles)} ClusterRole(s), {len(cluster_role_bindings)} ClusterRoleBinding(s)")
    
    if cluster_roles:
        raise AssertionError(f"Found {len(cluster_roles)} ClusterRole(s), no cluster-wide permissions should be granted")
    
    if cluster_role_bindings:
        raise AssertionError(f"Found {len(cluster_role_bindings)} ClusterRoleBinding(s), no cluster-wide permissions should be granted")
    
    return True

def main():
    """Main function to run the full BDD test flow."""
    print("🔍 Testing External Secrets Operator BDD full flow...\n")
    
    try:
        # Create mock context
        context = MockContext()
        
        # Run all steps in order
        step_external_secrets_manifest_exists(context)
        step_validate_rbac_config(context)
        step_use_role_not_clusterrole(context)
        step_permissions_scoped_to_namespace(context)
        step_secret_access_limited(context)
        step_no_cluster_wide_permissions(context)
        
        print("\n🎉 All BDD steps passed successfully!")
        return 0
        
    except Exception as e:
        print(f"\n❌ BDD test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())