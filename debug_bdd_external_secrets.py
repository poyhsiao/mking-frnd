#!/usr/bin/env python3

import yaml
from pathlib import Path

class SecurityValidator:
    def __init__(self, context):
        self.context = context
    
    def load_yaml_file(self, file_path: str):
        """Load YAML file and handle multi-document files."""
        with open(file_path, 'r') as file:
            documents = list(yaml.safe_load_all(file))
            if len(documents) == 1:
                return documents[0]
            return documents

class MockContext:
    def __init__(self):
        self.security_validator = SecurityValidator(self)
        self.external_secrets_config = None
        self.rbac_resources = None

def step_external_secrets_manifest_exists(context):
    """Verify external-secrets-operator manifest exists."""
    manifest_path = Path.cwd() / 'k8s' / 'external-secrets-operator.yaml'
    assert manifest_path.exists(), "External secrets operator manifest not found"
    context.external_secrets_config = context.security_validator.load_yaml_file('k8s/external-secrets-operator.yaml')
    print(f"✅ Loaded external secrets config: {type(context.external_secrets_config)}")
    if isinstance(context.external_secrets_config, list):
        print(f"   Found {len(context.external_secrets_config)} documents")

def step_validate_rbac_config(context):
    """Validate RBAC configuration."""
    # Parse the YAML documents
    if isinstance(context.external_secrets_config, list):
        context.rbac_resources = context.external_secrets_config
    else:
        context.rbac_resources = [context.external_secrets_config]
    print(f"✅ RBAC resources parsed: {len(context.rbac_resources)} resources")

def step_use_role_not_clusterrole(context):
    """Verify Role is used instead of ClusterRole."""
    roles = [r for r in context.rbac_resources if r.get('kind') == 'Role']
    cluster_roles = [r for r in context.rbac_resources if r.get('kind') == 'ClusterRole']
    
    print(f"   Found {len(roles)} Role(s), {len(cluster_roles)} ClusterRole(s)")
    
    assert len(roles) > 0, "No Role resources found"
    assert len(cluster_roles) == 0, "ClusterRole resources found (should use Role instead)"
    print("✅ Role vs ClusterRole test passed")

def step_permissions_scoped_to_namespace(context):
    """Verify permissions are scoped to specific namespace."""
    roles = [r for r in context.rbac_resources if r.get('kind') == 'Role']
    role_bindings = [r for r in context.rbac_resources if r.get('kind') == 'RoleBinding']
    
    for role in roles:
        namespace = role['metadata'].get('namespace')
        print(f"   Role namespace: {namespace}")
        assert namespace == 'mking-friend', \
            f"Role not scoped to mking-friend namespace: {namespace}"
    
    for binding in role_bindings:
        namespace = binding['metadata'].get('namespace')
        print(f"   RoleBinding namespace: {namespace}")
        assert namespace == 'mking-friend', \
            f"RoleBinding not scoped to mking-friend namespace: {namespace}"
    print("✅ Namespace scoping test passed")

def step_secret_access_limited(context):
    """Verify secret access is limited to specific resource names."""
    roles = [r for r in context.rbac_resources if r.get('kind') == 'Role']
    
    for role in roles:
        rules = role.get('rules', [])
        print(f"   Role '{role['metadata']['name']}' has {len(rules)} rules")
        for rule in rules:
            if 'secrets' in rule.get('resources', []):
                print(f"     Found secrets rule: {rule}")
                assert 'resourceNames' in rule, "Secret access not limited to specific resource names"
                resource_names = rule['resourceNames']
                assert len(resource_names) > 0, "No specific resource names defined for secret access"
                print(f"     ✅ Secret access limited to: {resource_names}")
    print("✅ Secret access limitation test passed")

def step_no_cluster_wide_permissions(context):
    """Verify no cluster-wide permissions are granted."""
    cluster_roles = [r for r in context.rbac_resources if r.get('kind') == 'ClusterRole']
    cluster_role_bindings = [r for r in context.rbac_resources if r.get('kind') == 'ClusterRoleBinding']
    
    print(f"   Found {len(cluster_roles)} ClusterRole(s), {len(cluster_role_bindings)} ClusterRoleBinding(s)")
    
    assert len(cluster_roles) == 0, "ClusterRole found (grants cluster-wide permissions)"
    assert len(cluster_role_bindings) == 0, "ClusterRoleBinding found (grants cluster-wide permissions)"
    print("✅ No cluster-wide permissions test passed")

def test_external_secrets_bdd_steps():
    """Test all BDD steps for External Secrets Operator."""
    print("Testing External Secrets Operator BDD steps...\n")
    
    context = MockContext()
    
    try:
        print("1. Testing manifest exists step...")
        step_external_secrets_manifest_exists(context)
        
        print("\n2. Testing RBAC config validation step...")
        step_validate_rbac_config(context)
        
        print("\n3. Testing Role vs ClusterRole step...")
        step_use_role_not_clusterrole(context)
        
        print("\n4. Testing namespace scoping step...")
        step_permissions_scoped_to_namespace(context)
        
        print("\n5. Testing secret access limitation step...")
        step_secret_access_limited(context)
        
        print("\n6. Testing no cluster-wide permissions step...")
        step_no_cluster_wide_permissions(context)
        
        print("\n🎉 All BDD steps passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ BDD step failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_external_secrets_bdd_steps()
    exit(0 if success else 1)