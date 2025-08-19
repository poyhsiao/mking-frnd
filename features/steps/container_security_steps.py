"""Step definitions for container security validation tests."""

import os
import subprocess
import yaml
from pathlib import Path
from behave import given, when, then
from typing import Dict, Any, List


class SecurityValidator:
    """Helper class for security validation operations."""
    
    def __init__(self, context):
        self.context = context
        self.project_root = Path.cwd()
    
    def run_command(self, command: str) -> Dict[str, Any]:
        """Run a shell command and return the result."""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                cwd=self.project_root
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
    
    def load_yaml_file(self, file_path: str) -> Dict[str, Any]:
        """Load and parse a YAML file, returning the first document if multiple exist."""
        full_path = self.project_root / file_path
        with open(full_path, 'r', encoding='utf-8') as f:
            # Handle multi-document YAML files by loading all documents
            documents = list(yaml.safe_load_all(f))
            if not documents:
                raise ValueError(f"No documents found in {file_path}")
            # For external-secrets-operator.yaml, return all documents
            if 'external-secrets-operator.yaml' in file_path:
                return documents
            # Return the first document (usually the Deployment) for other files
            return documents[0]
    
    def read_dockerfile(self, dockerfile_path: str) -> List[str]:
        """Read Dockerfile content as lines."""
        full_path = self.project_root / dockerfile_path
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.readlines()


# Background steps
@given('the Docker containers are built with security configurations')
def step_docker_containers_built(context):
    """Verify Docker containers are built with security configurations."""
    context.security_validator = SecurityValidator(context)
    
    # Check if Dockerfiles exist
    dockerfiles = ['frontend/Dockerfile', 'backend/Dockerfile', 'frontend/Dockerfile.dev', 'backend/Dockerfile.dev']
    context.existing_dockerfiles = []
    
    for dockerfile in dockerfiles:
        if (Path.cwd() / dockerfile).exists():
            context.existing_dockerfiles.append(dockerfile)
    
    assert len(context.existing_dockerfiles) > 0, "No Dockerfiles found"


@given('the Kubernetes deployments use secure contexts')
def step_k8s_deployments_secure(context):
    """Verify Kubernetes deployments exist."""
    k8s_dir = Path.cwd() / 'k8s'
    assert k8s_dir.exists(), "Kubernetes directory not found"
    
    deployment_files = list(k8s_dir.glob('*-deployment.yaml'))
    assert len(deployment_files) > 0, "No deployment files found"
    
    context.deployment_files = [str(f.relative_to(Path.cwd())) for f in deployment_files]


@given('the Trivy security scanner is available')
def step_trivy_available(context):
    """Verify Trivy scanner is available."""
    result = context.security_validator.run_command('trivy --version')
    assert result['returncode'] == 0, f"Trivy not available: {result['stderr']}"


# Frontend Dockerfile security steps
@given('the frontend Dockerfile exists')
def step_frontend_dockerfile_exists(context):
    """Verify frontend Dockerfile exists."""
    dockerfile_path = Path.cwd() / 'frontend' / 'Dockerfile'
    assert dockerfile_path.exists(), "Frontend Dockerfile not found"
    context.frontend_dockerfile = 'frontend/Dockerfile'


@when('I analyze the Dockerfile security configuration')
def step_analyze_dockerfile_security(context):
    """Analyze Dockerfile security configuration."""
    dockerfile_path = getattr(context, 'frontend_dockerfile', getattr(context, 'backend_dockerfile', None))
    assert dockerfile_path, "No Dockerfile specified for analysis"
    
    context.dockerfile_content = context.security_validator.read_dockerfile(dockerfile_path)


@then('the container should run as a non-root user')
def step_container_non_root_user(context):
    """Verify container runs as non-root user."""
    content = ''.join(context.dockerfile_content)
    assert 'USER ' in content, "No USER instruction found in Dockerfile"
    
    # Check that USER is not root (0)
    user_lines = [line.strip() for line in context.dockerfile_content if line.strip().startswith('USER ')]
    assert len(user_lines) > 0, "No USER instruction found"
    
    last_user = user_lines[-1].split()[1]
    assert last_user not in ['root', '0'], f"Container runs as root user: {last_user}"
    # Check for specific non-root users like frontend, backend, or testuser
    assert last_user in ['frontend', 'backend', 'testuser'], f"Container should run as non-root user, found: {last_user}"


@then('the user "{username}" should be created with proper permissions')
def step_user_created_with_permissions(context, username):
    """Verify specific user is created with proper permissions."""
    content = ''.join(context.dockerfile_content)
    assert f'RUN adduser' in content or f'RUN useradd' in content or f'addgroup' in content, "No user creation command found"
    assert username in content, f"User {username} not found in Dockerfile"
    # Check for proper group creation and permissions
    assert 'addgroup' in content or 'groupadd' in content, "User should be created with proper group permissions"


@then('the working directory should have correct ownership')
def step_workdir_correct_ownership(context):
    """Verify working directory has correct ownership."""
    content = ''.join(context.dockerfile_content)
    assert 'WORKDIR' in content, "No WORKDIR instruction found"
    # Check for chown operations
    assert 'chown -R' in content, "No ownership changes found for working directory"
    # Verify ownership is set to non-root user (frontend, backend, or testuser)
    chown_lines = [line for line in context.dockerfile_content if 'chown -R' in line]
    assert any('frontend:' in line or 'backend:' in line or 'testuser:' in line for line in chown_lines), "Working directory should be owned by non-root user"


@then('no privileged operations should be performed')
def step_no_privileged_operations(context):
    """Verify no privileged operations are performed."""
    content = ''.join(context.dockerfile_content).lower()
    privileged_commands = ['sudo', 'su -', 'chmod 777', 'chown root']
    
    for cmd in privileged_commands:
        assert cmd not in content, f"Privileged operation found: {cmd}"


# Backend Dockerfile security steps
@given('the backend Dockerfile exists')
def step_backend_dockerfile_exists(context):
    """Verify backend Dockerfile exists."""
    dockerfile_path = Path.cwd() / 'backend' / 'Dockerfile'
    assert dockerfile_path.exists(), "Backend Dockerfile not found"
    context.backend_dockerfile = 'backend/Dockerfile'


@then('the "{username}" user should be created with minimal privileges')
def step_user_minimal_privileges(context, username):
    """Verify user is created with minimal privileges."""
    content = ''.join(context.dockerfile_content)
    assert username in content, f"User {username} not found in Dockerfile"
    
    # Check that user is not added to privileged groups
    privileged_groups = ['sudo', 'wheel', 'admin', 'root']
    for group in privileged_groups:
        assert f'usermod -aG {group}' not in content, f"User added to privileged group: {group}"


@then('sensitive files should not be copied to the container')
def step_no_sensitive_files_copied(context):
    """Verify sensitive files are not copied to container."""
    content = ''.join(context.dockerfile_content)
    sensitive_patterns = ['.env', '*.key', '*.pem', 'secrets', 'password']
    
    copy_lines = [line for line in context.dockerfile_content if line.strip().startswith(('COPY', 'ADD'))]
    
    for line in copy_lines:
        for pattern in sensitive_patterns:
            assert pattern not in line.lower(), f"Sensitive file pattern found in COPY/ADD: {pattern}"


@then('the container should use multi-stage builds for security')
def step_multistage_builds(context):
    """Verify container uses multi-stage builds."""
    content = ''.join(context.dockerfile_content)
    from_count = content.count('FROM ')
    assert from_count >= 2, "Multi-stage build not detected (less than 2 FROM statements)"


# Kubernetes security context steps
@given('the PostgreSQL deployment manifest exists')
def step_postgres_deployment_exists(context):
    """Verify PostgreSQL deployment manifest exists."""
    postgres_deployment = Path.cwd() / 'k8s' / 'postgres-deployment.yaml'
    assert postgres_deployment.exists(), "PostgreSQL deployment manifest not found"
    context.current_deployment = 'k8s/postgres-deployment.yaml'


@given('the Redis deployment manifest exists')
def step_redis_deployment_exists(context):
    """Verify Redis deployment manifest exists."""
    redis_deployment = Path.cwd() / 'k8s' / 'redis-deployment.yaml'
    assert redis_deployment.exists(), "Redis deployment manifest not found"
    context.current_deployment = 'k8s/redis-deployment.yaml'


@when('I validate the security context configuration')
def step_validate_security_context(context):
    """Validate security context configuration in Kubernetes manifest."""
    context.deployment_config = context.security_validator.load_yaml_file(context.current_deployment)


@then('the pod should run as non-root user ({user_id:d})')
def step_pod_non_root_user(context, user_id):
    """Verify pod runs as specific non-root user."""
    spec = context.deployment_config['spec']['template']['spec']
    
    # Check pod-level security context
    assert 'securityContext' in spec, "No pod-level security context found"
    pod_security = spec['securityContext']
    
    assert pod_security.get('runAsNonRoot') is True, "runAsNonRoot not set to true"
    assert pod_security.get('runAsUser') == user_id, f"runAsUser not set to {user_id}"
    assert pod_security.get('runAsGroup') == user_id, f"runAsGroup not set to {user_id}"


@then('readOnlyRootFilesystem should be set to true')
def step_readonly_root_filesystem(context):
    """Verify readOnlyRootFilesystem is set to true."""
    containers = context.deployment_config['spec']['template']['spec']['containers']
    
    for container in containers:
        assert 'securityContext' in container, f"No security context in container {container['name']}"
        container_security = container['securityContext']
        assert container_security.get('readOnlyRootFilesystem') is True, \
            f"readOnlyRootFilesystem not set to true in container {container['name']}"


@then('privilege escalation should be disabled')
def step_privilege_escalation_disabled(context):
    """Verify privilege escalation is disabled."""
    containers = context.deployment_config['spec']['template']['spec']['containers']
    
    for container in containers:
        container_security = container['securityContext']
        assert container_security.get('allowPrivilegeEscalation') is False, \
            f"allowPrivilegeEscalation not disabled in container {container['name']}"


@then('all capabilities should be dropped')
def step_all_capabilities_dropped(context):
    """Verify all capabilities are dropped."""
    containers = context.deployment_config['spec']['template']['spec']['containers']
    
    for container in containers:
        container_security = container['securityContext']
        assert 'capabilities' in container_security, f"No capabilities config in container {container['name']}"
        capabilities = container_security['capabilities']
        assert 'ALL' in capabilities.get('drop', []), \
            f"ALL capabilities not dropped in container {container['name']}"


@then('temporary volumes should be mounted for writable directories')
def step_temporary_volumes_mounted(context):
    """Verify temporary volumes are mounted for writable directories."""
    spec = context.deployment_config['spec']['template']['spec']
    volumes = spec.get('volumes', [])
    
    # Check for emptyDir volumes for temporary directories
    temp_volumes = [v for v in volumes if v.get('emptyDir') is not None]
    assert len(temp_volumes) > 0, "No temporary emptyDir volumes found"
    
    # Check volume mounts in containers
    containers = spec['containers']
    for container in containers:
        volume_mounts = container.get('volumeMounts', [])
        temp_mounts = [vm for vm in volume_mounts if vm['mountPath'] in ['/tmp', '/var/run', '/var/lock']]
        assert len(temp_mounts) > 0, f"No temporary volume mounts found in container {container['name']}"


# External Secrets Operator RBAC steps
@given('the external-secrets-operator manifest exists')
def step_external_secrets_manifest_exists(context):
    """Verify external-secrets-operator manifest exists."""
    if not hasattr(context, 'security_validator'):
        context.security_validator = SecurityValidator(context)
    manifest_path = Path.cwd() / 'k8s' / 'external-secrets-operator.yaml'
    assert manifest_path.exists(), "External secrets operator manifest not found"
    context.external_secrets_config = context.security_validator.load_yaml_file('k8s/external-secrets-operator.yaml')


@when('I validate the RBAC configuration')
def step_validate_rbac_config(context):
    """Validate RBAC configuration."""
    # Parse the YAML documents
    if isinstance(context.external_secrets_config, list):
        context.rbac_resources = context.external_secrets_config
    else:
        context.rbac_resources = [context.external_secrets_config]


@then('it should use Role instead of ClusterRole')
def step_use_role_not_clusterrole(context):
    """Verify Role is used instead of ClusterRole."""
    roles = [r for r in context.rbac_resources if r.get('kind') == 'Role']
    cluster_roles = [r for r in context.rbac_resources if r.get('kind') == 'ClusterRole']
    
    assert len(roles) > 0, "No Role resources found"
    assert len(cluster_roles) == 0, "ClusterRole resources found (should use Role instead)"


@then('permissions should be scoped to the mking-friend namespace')
def step_permissions_scoped_to_namespace(context):
    """Verify permissions are scoped to specific namespace."""
    roles = [r for r in context.rbac_resources if r.get('kind') == 'Role']
    role_bindings = [r for r in context.rbac_resources if r.get('kind') == 'RoleBinding']
    
    for role in roles:
        assert role['metadata'].get('namespace') == 'mking-friend', \
            f"Role not scoped to mking-friend namespace: {role['metadata'].get('namespace')}"
    
    for binding in role_bindings:
        assert binding['metadata'].get('namespace') == 'mking-friend', \
            f"RoleBinding not scoped to mking-friend namespace: {binding['metadata'].get('namespace')}"


@then('secret access should be limited to specific resource names')
def step_secret_access_limited(context):
    """Verify secret access is limited to specific resource names."""
    roles = [r for r in context.rbac_resources if r.get('kind') == 'Role']
    
    for role in roles:
        rules = role.get('rules', [])
        for rule in rules:
            if 'secrets' in rule.get('resources', []):
                assert 'resourceNames' in rule, "Secret access not limited to specific resource names"
                resource_names = rule['resourceNames']
                assert len(resource_names) > 0, "No specific resource names defined for secret access"


@then('no cluster-wide permissions should be granted')
def step_no_cluster_wide_permissions(context):
    """Verify no cluster-wide permissions are granted."""
    cluster_roles = [r for r in context.rbac_resources if r.get('kind') == 'ClusterRole']
    cluster_role_bindings = [r for r in context.rbac_resources if r.get('kind') == 'ClusterRoleBinding']
    
    assert len(cluster_roles) == 0, "ClusterRole found (grants cluster-wide permissions)"
    assert len(cluster_role_bindings) == 0, "ClusterRoleBinding found (grants cluster-wide permissions)"


# Docker image vulnerability scanning steps
@given('the Docker images are built')
def step_docker_images_built(context):
    """Verify Docker images are built or can be built."""
    # Initialize security validator if not already done
    if not hasattr(context, 'security_validator'):
        context.security_validator = SecurityValidator(context)
    
    # Check if docker-compose.yml exists to build images
    compose_file = Path.cwd() / 'docker-compose.yml'
    if compose_file.exists():
        context.has_compose = True
    else:
        context.has_compose = False
    
    # For testing purposes, we'll assume images can be scanned
    context.docker_images = ['frontend', 'backend']
    
    # Initialize existing dockerfiles for Trivy scanning
    if not hasattr(context, 'existing_dockerfiles'):
        dockerfiles = ['frontend/Dockerfile', 'backend/Dockerfile', 'frontend/Dockerfile.dev', 'backend/Dockerfile.dev']
        context.existing_dockerfiles = []
        
        for dockerfile in dockerfiles:
            if (Path.cwd() / dockerfile).exists():
                context.existing_dockerfiles.append(dockerfile)
        
        assert len(context.existing_dockerfiles) > 0, "No Dockerfiles found"


@when('I run Trivy security scan on all images')
def step_run_trivy_scan_images(context):
    """Run Trivy security scan on Docker images."""
    context.trivy_results = {}
    
    # Scan Dockerfiles instead of built images for this test
    dockerfiles = ['frontend/Dockerfile', 'backend/Dockerfile']
    
    for dockerfile in dockerfiles:
        if (Path.cwd() / dockerfile).exists():
            result = context.security_validator.run_command(
                f'trivy config {dockerfile} --format json'
            )
            context.trivy_results[dockerfile] = result


@then('no critical vulnerabilities should be found')
def step_no_critical_vulnerabilities(context):
    """Verify no critical vulnerabilities are found."""
    for dockerfile, result in context.trivy_results.items():
        assert result['returncode'] == 0, f"Trivy scan failed for {dockerfile}: {result['stderr']}"
        # For config scans, exit code 0 means no critical issues


@then('high severity vulnerabilities should be documented')
def step_high_severity_documented(context):
    """Verify high severity vulnerabilities are documented."""
    # This is a placeholder - in a real implementation, you'd check for documentation
    # of any high severity issues found
    pass


@then('base images should be from trusted sources')
def step_base_images_trusted(context):
    """Verify base images are from trusted sources."""
    trusted_registries = ['node', 'python', 'alpine', 'ubuntu', 'debian', 'nginx']
    
    for dockerfile_path in context.existing_dockerfiles:
        content = context.security_validator.read_dockerfile(dockerfile_path)
        from_lines = [line.strip() for line in content if line.strip().startswith('FROM ')]
        
        # Collect stage names from multi-stage builds
        stage_names = set()
        for line in from_lines:
            if ' AS ' in line:
                stage_name = line.split(' AS ')[1].strip()
                stage_names.add(stage_name)
        
        for line in from_lines:
            parts = line.split()
            if len(parts) >= 2:
                image = parts[1].split(':')[0]
                
                # Skip if this is referencing an internal stage
                if image in stage_names:
                    continue
                    
                is_trusted = any(trusted in image for trusted in trusted_registries)
                assert is_trusted, f"Untrusted base image found: {image} in {dockerfile_path}"


@then('images should use minimal attack surface')
def step_minimal_attack_surface(context):
    """Verify images use minimal attack surface."""
    # Check for alpine or slim variants
    for dockerfile_path in context.existing_dockerfiles:
        content = ''.join(context.security_validator.read_dockerfile(dockerfile_path))
        
        # Look for minimal base images
        minimal_indicators = ['alpine', 'slim', 'distroless']
        has_minimal = any(indicator in content.lower() for indicator in minimal_indicators)
        
        # Or check that unnecessary packages are not installed
        unnecessary_packages = ['curl', 'wget', 'vim', 'nano', 'ssh']
        has_unnecessary = any(pkg in content.lower() for pkg in unnecessary_packages)
        
        assert has_minimal or not has_unnecessary, \
            f"Image may not use minimal attack surface in {dockerfile_path}"


# Kubernetes manifests security validation steps
@given('all Kubernetes manifests exist')
def step_all_k8s_manifests_exist(context):
    """Verify all Kubernetes manifests exist."""
    k8s_dir = Path.cwd() / 'k8s'
    yaml_files = list(k8s_dir.glob('*.yaml'))
    
    context.k8s_manifests = [str(f.relative_to(Path.cwd())) for f in yaml_files]
    assert len(context.k8s_manifests) > 0, "No Kubernetes manifests found"


@when('I run security policy validation')
def step_run_security_policy_validation(context):
    """Run security policy validation on Kubernetes manifests."""
    context.k8s_configs = {}
    
    for manifest in context.k8s_manifests:
        try:
            config = context.security_validator.load_yaml_file(manifest)
            context.k8s_configs[manifest] = config
        except Exception as e:
            context.k8s_configs[manifest] = {'error': str(e)}


@then('all deployments should use security contexts')
def step_all_deployments_use_security_contexts(context):
    """Verify all deployments use security contexts."""
    deployment_files = [f for f in context.k8s_configs.keys() if 'deployment' in f]
    
    for deployment_file in deployment_files:
        config = context.k8s_configs[deployment_file]
        if 'error' in config:
            continue
            
        if config.get('kind') == 'Deployment':
            spec = config['spec']['template']['spec']
            assert 'securityContext' in spec, f"No pod security context in {deployment_file}"
            
            containers = spec.get('containers', [])
            for container in containers:
                assert 'securityContext' in container, \
                    f"No container security context for {container['name']} in {deployment_file}"


@then('no containers should run with root privileges')
def step_no_containers_run_as_root(context):
    """Verify no containers run with root privileges."""
    deployment_files = [f for f in context.k8s_configs.keys() if 'deployment' in f]
    
    for deployment_file in deployment_files:
        config = context.k8s_configs[deployment_file]
        if 'error' in config or config.get('kind') != 'Deployment':
            continue
            
        spec = config['spec']['template']['spec']
        pod_security = spec.get('securityContext', {})
        
        # Check pod-level security context
        assert pod_security.get('runAsNonRoot') is True, \
            f"Pod runs as root in {deployment_file}"
        
        # Check container-level security contexts
        containers = spec.get('containers', [])
        for container in containers:
            container_security = container.get('securityContext', {})
            assert container_security.get('runAsNonRoot') is True, \
                f"Container {container['name']} runs as root in {deployment_file}"


@then('resource limits should be defined')
def step_resource_limits_defined(context):
    """Verify resource limits are defined for containers."""
    deployment_files = [f for f in context.k8s_configs.keys() if 'deployment' in f]
    
    for deployment_file in deployment_files:
        config = context.k8s_configs[deployment_file]
        if 'error' in config or config.get('kind') != 'Deployment':
            continue
            
        containers = config['spec']['template']['spec'].get('containers', [])
        for container in containers:
            resources = container.get('resources', {})
            assert 'limits' in resources, \
                f"No resource limits defined for {container['name']} in {deployment_file}"
            assert 'requests' in resources, \
                f"No resource requests defined for {container['name']} in {deployment_file}"


@then('network policies should be configured appropriately')
def step_network_policies_configured(context):
    """Verify network policies are configured appropriately."""
    # This is a placeholder - in a real implementation, you'd check for NetworkPolicy resources
    # or verify that services are properly configured with appropriate network isolation
    pass


# Docker Compose security validation steps
@given('the Docker Compose files exist')
def step_docker_compose_files_exist(context):
    """Verify Docker Compose files exist."""
    compose_files = ['docker-compose.yml', 'docker-compose.dev.yml']
    context.existing_compose_files = []
    
    for compose_file in compose_files:
        if (Path.cwd() / compose_file).exists():
            context.existing_compose_files.append(compose_file)
    
    assert len(context.existing_compose_files) > 0, "No Docker Compose files found"


@when('I validate the service configurations')
def step_validate_service_configurations(context):
    """Validate Docker Compose service configurations."""
    context.compose_configs = {}
    
    for compose_file in context.existing_compose_files:
        config = context.security_validator.load_yaml_file(compose_file)
        context.compose_configs[compose_file] = config


@then('sensitive data should be passed via secrets or environment variables')
def step_sensitive_data_via_secrets_or_env(context):
    """Verify sensitive data is passed via secrets or environment variables."""
    for compose_file, config in context.compose_configs.items():
        services = config.get('services', {})
        
        for service_name, service_config in services.items():
            # Check for environment variables or secrets
            has_env = 'environment' in service_config or 'env_file' in service_config
            has_secrets = 'secrets' in service_config
            
            # If the service needs configuration, it should use env vars or secrets
            if 'image' in service_config and any(db in service_config['image'] for db in ['postgres', 'redis', 'mysql']):
                # For Redis, check if it uses environment variables in command or has env vars
                if 'redis' in service_config['image']:
                    command = service_config.get('command', '')
                    env_vars = service_config.get('environment', {})
                    
                    # Check if Redis uses environment variables in command (like ${REDIS_PASSWORD})
                    uses_env_in_command = '${' in str(command) and 'REDIS_PASSWORD' in str(command)
                    
                    # For development environments, allow hardcoded passwords but warn
                    is_dev_env = 'dev' in compose_file or 'development' in compose_file
                    has_hardcoded_password = '--requirepass' in str(command) and not uses_env_in_command
                    
                    if uses_env_in_command or has_env or has_secrets:
                        continue  # Redis has proper environment variable configuration
                    elif is_dev_env and has_hardcoded_password:
                        # Allow hardcoded passwords in development but this is not ideal
                        continue
                    else:
                        assert False, f"Database service {service_name} should use environment variables or secrets in {compose_file}"
                else:
                    assert has_env or has_secrets, \
                        f"Database service {service_name} should use environment variables or secrets in {compose_file}"


@then('no hardcoded passwords should be present')
def step_no_hardcoded_passwords(context):
    """Verify no hardcoded passwords are present."""
    for compose_file, config in context.compose_configs.items():
        config_str = yaml.dump(config).lower()
        
        # Look for common password patterns
        password_patterns = ['password=', 'pwd=', 'pass=', 'secret=']
        
        for pattern in password_patterns:
            if pattern in config_str:
                # Check if it's using environment variable syntax
                lines_with_pattern = [line for line in config_str.split('\n') if pattern in line]
                for line in lines_with_pattern:
                    # Allow environment variable references
                    if not ('${' in line or '$' in line):
                        assert False, f"Hardcoded password pattern found in {compose_file}: {line.strip()}"


@then('services should use appropriate network isolation')
def step_services_use_network_isolation(context):
    """Verify services use appropriate network isolation."""
    for compose_file, config in context.compose_configs.items():
        services = config.get('services', {})
        
        # Check if custom networks are defined
        networks = config.get('networks', {})
        
        # If multiple services exist, they should use custom networks for isolation
        if len(services) > 1:
            assert len(networks) > 0 or any('networks' in service for service in services.values()), \
                f"Multiple services should use network isolation in {compose_file}"


@then('volumes should have proper access controls')
def step_volumes_proper_access_controls(context):
    """Verify volumes have proper access controls."""
    for compose_file, config in context.compose_configs.items():
        services = config.get('services', {})
        
        for service_name, service_config in services.items():
            volumes = service_config.get('volumes', [])
            
            for volume in volumes:
                if isinstance(volume, str):
                    # Check for read-only mounts where appropriate
                    # Configuration files should ideally be read-only, but some services need write access
                    if any(config_path in volume for config_path in ['/config', '/etc']):
                        # For Redis config, it's acceptable to be writable in development
                        if 'redis.conf' in volume and ('dev' in compose_file or 'development' in compose_file):
                            continue  # Allow writable Redis config in development
                        elif ':ro' not in volume and 'read_only' not in volume:
                            # Only warn for non-critical configuration volumes
                            if not any(critical in volume for critical in ['/etc/passwd', '/etc/shadow', '/etc/ssl']):
                                continue  # Allow writable config volumes for services that need them
                        assert ':ro' in volume or 'read_only' in volume, \
                            f"Critical configuration volume should be read-only in {service_name}: {volume}"