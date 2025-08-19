#!/usr/bin/env python3
"""
Test a single BDD step to identify the exact failure point.
"""

import sys
import os
from pathlib import Path

# Add the features/steps directory to the path
sys.path.insert(0, str(Path.cwd() / 'features' / 'steps'))

try:
    from container_security_steps import SecurityValidator
    print("✅ Successfully imported SecurityValidator")
except ImportError as e:
    print(f"❌ Failed to import SecurityValidator: {e}")
    sys.exit(1)

class MockContext:
    def __init__(self):
        pass

def test_step():
    print("Testing the external secrets manifest exists step...")
    
    context = MockContext()
    
    # Initialize SecurityValidator
    context.security_validator = SecurityValidator(context)
    print("✅ SecurityValidator initialized")
    
    # Check manifest path
    manifest_path = Path.cwd() / 'k8s' / 'external-secrets-operator.yaml'
    print(f"Manifest path: {manifest_path}")
    print(f"Manifest exists: {manifest_path.exists()}")
    
    if not manifest_path.exists():
        print("❌ External secrets operator manifest not found")
        return False
    
    # Load YAML file
    try:
        context.external_secrets_config = context.security_validator.load_yaml_file('k8s/external-secrets-operator.yaml')
        print(f"✅ Loaded YAML config: {type(context.external_secrets_config)}")
        print(f"Number of documents: {len(context.external_secrets_config) if isinstance(context.external_secrets_config, list) else 1}")
        return True
    except Exception as e:
        print(f"❌ Failed to load YAML: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_step()
    sys.exit(0 if success else 1)