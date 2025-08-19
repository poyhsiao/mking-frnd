#!/usr/bin/env python3

import yaml
from pathlib import Path

def load_yaml_file(file_path: str):
    """Load YAML file and handle multi-document files."""
    with open(file_path, 'r') as file:
        documents = list(yaml.safe_load_all(file))
        if len(documents) == 1:
            return documents[0]
        return documents

def test_external_secrets_rbac():
    """Test External Secrets Operator RBAC configuration."""
    print("Testing External Secrets Operator RBAC configuration...")
    
    # Load the manifest
    manifest_path = Path.cwd() / 'k8s' / 'external-secrets-operator.yaml'
    if not manifest_path.exists():
        print("❌ External secrets operator manifest not found")
        return False
    
    config = load_yaml_file('k8s/external-secrets-operator.yaml')
    print(f"✅ Loaded manifest with {len(config) if isinstance(config, list) else 1} documents")
    
    # Parse the YAML documents
    if isinstance(config, list):
        rbac_resources = config
    else:
        rbac_resources = [config]
    
    print(f"Found {len(rbac_resources)} resources")
    for i, resource in enumerate(rbac_resources):
        kind = resource.get('kind', 'Unknown')
        name = resource.get('metadata', {}).get('name', 'Unknown')
        print(f"  {i+1}. {kind}: {name}")
    
    # Test 1: Should use Role instead of ClusterRole
    print("\n1. Testing Role vs ClusterRole...")
    roles = [r for r in rbac_resources if r.get('kind') == 'Role']
    cluster_roles = [r for r in rbac_resources if r.get('kind') == 'ClusterRole']
    
    print(f"   Found {len(roles)} Role(s)")
    print(f"   Found {len(cluster_roles)} ClusterRole(s)")
    
    if len(roles) > 0:
        print("   ✅ Role resources found")
    else:
        print("   ❌ No Role resources found")
        return False
    
    if len(cluster_roles) == 0:
        print("   ✅ No ClusterRole resources found (good)")
    else:
        print("   ❌ ClusterRole resources found (should use Role instead)")
        return False
    
    # Test 2: Permissions should be scoped to namespace
    print("\n2. Testing namespace scoping...")
    role_bindings = [r for r in rbac_resources if r.get('kind') == 'RoleBinding']
    
    for role in roles:
        namespace = role['metadata'].get('namespace')
        print(f"   Role '{role['metadata']['name']}' namespace: {namespace}")
        if namespace != 'mking-friend':
            print(f"   ❌ Role not scoped to mking-friend namespace: {namespace}")
            return False
    
    for binding in role_bindings:
        namespace = binding['metadata'].get('namespace')
        print(f"   RoleBinding '{binding['metadata']['name']}' namespace: {namespace}")
        if namespace != 'mking-friend':
            print(f"   ❌ RoleBinding not scoped to mking-friend namespace: {namespace}")
            return False
    
    print("   ✅ All RBAC resources properly scoped to mking-friend namespace")
    
    # Test 3: Secret access should be limited to specific resource names
    print("\n3. Testing secret access limitations...")
    for role in roles:
        rules = role.get('rules', [])
        print(f"   Role '{role['metadata']['name']}' has {len(rules)} rule(s)")
        
        for i, rule in enumerate(rules):
            resources = rule.get('resources', [])
            print(f"     Rule {i+1}: resources = {resources}")
            
            if 'secrets' in resources:
                print(f"     Rule {i+1} accesses secrets")
                if 'resourceNames' in rule:
                    resource_names = rule['resourceNames']
                    print(f"     ✅ Secret access limited to: {resource_names}")
                    if len(resource_names) == 0:
                        print("     ❌ No specific resource names defined for secret access")
                        return False
                else:
                    print("     ❌ Secret access not limited to specific resource names")
                    return False
    
    # Test 4: No cluster-wide permissions
    print("\n4. Testing cluster-wide permissions...")
    cluster_role_bindings = [r for r in rbac_resources if r.get('kind') == 'ClusterRoleBinding']
    
    print(f"   Found {len(cluster_role_bindings)} ClusterRoleBinding(s)")
    
    if len(cluster_roles) == 0:
        print("   ✅ No ClusterRole found")
    else:
        print("   ❌ ClusterRole found (grants cluster-wide permissions)")
        return False
    
    if len(cluster_role_bindings) == 0:
        print("   ✅ No ClusterRoleBinding found")
    else:
        print("   ❌ ClusterRoleBinding found (grants cluster-wide permissions)")
        return False
    
    print("\n🎉 All External Secrets Operator RBAC tests passed!")
    return True

if __name__ == '__main__':
    success = test_external_secrets_rbac()
    exit(0 if success else 1)