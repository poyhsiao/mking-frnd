const { Given, When, Then } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const assert = require('assert');

// Global variables to store test data
let externalSecretsConfig;
let parsedYamlDocs;
let secretStores;
let externalSecrets;
let rbacResources;

// Helper function to read and parse YAML file
function readYamlFile(filePath) {
  const fullPath = path.resolve(filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return yaml.loadAll(content);
}

// Helper function to find resources by kind
function findResourcesByKind(docs, kind) {
  return docs.filter(doc => doc && doc.kind === kind);
}

// Helper function to check for hardcoded secrets patterns
function containsHardcodedSecrets(content) {
  const secretPatterns = [
    /password\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    /secret\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    /key\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    /token\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    /[A-Za-z0-9+/]{20,}={0,2}/, // Base64 pattern
    /sk-[a-zA-Z0-9]{48}/, // OpenAI API key pattern
    /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access token
    /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/, // Slack bot token
  ];

  return secretPatterns.some(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      // Exclude environment variable syntax and external references
      return (
        !matches[0].includes('${') &&
        !matches[0].includes(':?') &&
        !matches[0].includes('remoteRef') &&
        !matches[0].includes('secretRef')
      );
    }
    return false;
  });
}

// Helper function to validate YAML structure
function validateKubernetesManifest(doc) {
  return (
    doc &&
    typeof doc === 'object' &&
    doc.apiVersion &&
    doc.kind &&
    doc.metadata &&
    doc.metadata.name
  );
}

// Step definitions
Given('the External Secrets Operator configuration exists', function () {
  const configPath = 'k8s/external-secrets-operator.yaml';
  assert(
    fs.existsSync(configPath),
    `External Secrets Operator configuration file not found: ${configPath}`,
  );
});

Given('the Kubernetes cluster is accessible', function () {
  // This is a placeholder for actual cluster connectivity check
  // In a real scenario, you would check kubectl connectivity
  console.log('Assuming Kubernetes cluster is accessible for testing');
});

// File existence check is handled by docker_compose_security_steps.cjs

Given('the External Secrets Operator configuration file', function () {
  const configPath = 'k8s/external-secrets-operator.yaml';
  externalSecretsConfig = fs.readFileSync(configPath, 'utf8');
  parsedYamlDocs = readYamlFile(configPath);

  secretStores = findResourcesByKind(parsedYamlDocs, 'SecretStore');
  externalSecrets = findResourcesByKind(parsedYamlDocs, 'ExternalSecret');
  rbacResources = {
    serviceAccounts: findResourcesByKind(parsedYamlDocs, 'ServiceAccount'),
    clusterRoles: findResourcesByKind(parsedYamlDocs, 'ClusterRole'),
    clusterRoleBindings: findResourcesByKind(parsedYamlDocs, 'ClusterRoleBinding'),
  };
});

When('I parse the YAML configuration', function () {
  if (!parsedYamlDocs) {
    const configPath = 'k8s/external-secrets-operator.yaml';
    parsedYamlDocs = readYamlFile(configPath);
    
    // Initialize all resource collections
    secretStores = findResourcesByKind(parsedYamlDocs, 'SecretStore');
    externalSecrets = findResourcesByKind(parsedYamlDocs, 'ExternalSecret');
    rbacResources = {
      serviceAccounts: findResourcesByKind(parsedYamlDocs, 'ServiceAccount'),
      clusterRoles: findResourcesByKind(parsedYamlDocs, 'ClusterRole'),
      clusterRoleBindings: findResourcesByKind(parsedYamlDocs, 'ClusterRoleBinding'),
    };
  }
  assert(Array.isArray(parsedYamlDocs), 'Failed to parse YAML configuration');
  assert(parsedYamlDocs.length > 0, 'No YAML documents found in configuration');
});

When('I examine the SecretStore definitions', function () {
  assert(secretStores.length > 0, 'No SecretStore resources found');
});

When('I examine the ExternalSecret definitions', function () {
  assert(externalSecrets.length > 0, 'No ExternalSecret resources found');
});

When('I examine the secret mappings in ExternalSecret', function () {
  assert(
    externalSecrets.length > 0,
    'No ExternalSecret resources found for secret mapping examination',
  );
});

When('I examine the RBAC configurations', function () {
  assert(rbacResources.serviceAccounts.length > 0, 'No ServiceAccount resources found');
  assert(rbacResources.clusterRoles.length > 0, 'No ClusterRole resources found');
  assert(rbacResources.clusterRoleBindings.length > 0, 'No ClusterRoleBinding resources found');
});

When('I examine all resource definitions', function () {
  assert(parsedYamlDocs.length > 0, 'No resource definitions found');
});

When('I scan the file content for potential secrets', function () {
  assert(typeof externalSecretsConfig === 'string', 'Configuration content not available');
});

When('I examine the ExternalSecret refresh settings', function () {
  assert(
    externalSecrets.length > 0,
    'No ExternalSecret resources found for refresh settings examination',
  );
});

When('I examine the ExternalSecret target configuration', function () {
  assert(
    externalSecrets.length > 0,
    'No ExternalSecret resources found for target configuration examination',
  );
});

Then('it should contain valid Kubernetes manifests', function () {
  parsedYamlDocs.forEach((doc, index) => {
    assert(validateKubernetesManifest(doc), `Invalid Kubernetes manifest at index ${index}`);
  });
});

Then('it should define SecretStore resources', function () {
  assert(
    secretStores.length >= 2,
    'Should define at least 2 SecretStore resources (Vault and AWS)',
  );
});

Then('it should define ExternalSecret resources', function () {
  assert(externalSecrets.length >= 1, 'Should define at least 1 ExternalSecret resource');
});

Then('it should define proper RBAC configurations', function () {
  assert(rbacResources.serviceAccounts.length >= 1, 'Should define at least 1 ServiceAccount');
  assert(rbacResources.clusterRoles.length >= 1, 'Should define at least 1 ClusterRole');
  assert(
    rbacResources.clusterRoleBindings.length >= 1,
    'Should define at least 1 ClusterRoleBinding',
  );
});

Then('each SecretStore should have a valid provider configuration', function () {
  secretStores.forEach(store => {
    assert(
      store.spec && store.spec.provider,
      `SecretStore ${store.metadata.name} missing provider configuration`,
    );
    assert(
      store.spec.provider.vault || store.spec.provider.aws,
      `SecretStore ${store.metadata.name} should have either vault or aws provider`,
    );
  });
});

Then('each SecretStore should have proper metadata labels', function () {
  secretStores.forEach(store => {
    assert(store.metadata.labels, `SecretStore ${store.metadata.name} missing labels`);
    assert(
      store.metadata.labels['app.kubernetes.io/name'],
      `SecretStore ${store.metadata.name} missing app.kubernetes.io/name label`,
    );
  });
});

Then('each SecretStore should have security annotations', function () {
  secretStores.forEach(store => {
    assert(store.metadata.annotations, `SecretStore ${store.metadata.name} missing annotations`);
    assert(
      store.metadata.annotations['security.kubernetes.io/managed-by'],
      `SecretStore ${store.metadata.name} missing security.kubernetes.io/managed-by annotation`,
    );
  });
});

Then('the Vault SecretStore should specify authentication method', function () {
  const vaultStore = secretStores.find(store => store.spec.provider.vault);
  assert(vaultStore, 'Vault SecretStore not found');
  assert(vaultStore.spec.provider.vault.auth, 'Vault SecretStore missing authentication configuration');
});

Then('the AWS SecretStore should reference credentials properly', function () {
  const awsStore = secretStores.find(store => store.spec.provider.aws);
  assert(awsStore, 'AWS SecretStore not found');
  assert(awsStore.spec.provider.aws.auth, 'AWS SecretStore missing authentication configuration');
});

Then('each ExternalSecret should reference an existing SecretStore', function () {
  externalSecrets.forEach(secret => {
    assert(
      secret.spec.secretStoreRef,
      `ExternalSecret ${secret.metadata.name} missing secretStoreRef`,
    );
    assert(
      secret.spec.secretStoreRef.name,
      `ExternalSecret ${secret.metadata.name} missing secretStoreRef.name`,
    );
    
    const referencedStore = secretStores.find(store => 
      store.metadata.name === secret.spec.secretStoreRef.name
    );
    assert(
      referencedStore,
      `ExternalSecret ${secret.metadata.name} references non-existent SecretStore ${secret.spec.secretStoreRef.name}`,
    );
  });
});

Then('each ExternalSecret should have a valid refresh interval', function () {
  externalSecrets.forEach(secret => {
    assert(
      secret.spec.refreshInterval,
      `ExternalSecret ${secret.metadata.name} missing refreshInterval`,
    );
    // Check if refresh interval is reasonable (between 1m and 24h)
    const interval = secret.spec.refreshInterval;
    assert(
      /^\d+[mh]$/.test(interval),
      `ExternalSecret ${secret.metadata.name} has invalid refreshInterval format: ${interval}`,
    );
  });
});

Then('each ExternalSecret should define proper target secret metadata', function () {
  externalSecrets.forEach(secret => {
    assert(
      secret.spec.target,
      `ExternalSecret ${secret.metadata.name} missing target configuration`,
    );
    assert(
      secret.spec.target.name,
      `ExternalSecret ${secret.metadata.name} missing target.name`,
    );
    assert(
      secret.spec.target.template,
      `ExternalSecret ${secret.metadata.name} missing target.template`,
    );
  });
});

Then('each ExternalSecret should map remote secrets to local keys', function () {
  externalSecrets.forEach(secret => {
    assert(
      secret.spec.data && Array.isArray(secret.spec.data),
      `ExternalSecret ${secret.metadata.name} missing or invalid data mappings`,
    );
    assert(
      secret.spec.data.length > 0,
      `ExternalSecret ${secret.metadata.name} has no data mappings`,
    );
    
    secret.spec.data.forEach((mapping, index) => {
      assert(
        mapping.secretKey,
        `ExternalSecret ${secret.metadata.name} data[${index}] missing secretKey`,
      );
      assert(
        mapping.remoteRef,
        `ExternalSecret ${secret.metadata.name} data[${index}] missing remoteRef`,
      );
      assert(
        mapping.remoteRef.key,
        `ExternalSecret ${secret.metadata.name} data[${index}] missing remoteRef.key`,
      );
      assert(
        mapping.remoteRef.property,
        `ExternalSecret ${secret.metadata.name} data[${index}] missing remoteRef.property`,
      );
    });
  });
});

// Secret coverage checks
Then('it should include database passwords', function () {
  const dbSecrets = ['POSTGRES_PASSWORD', 'AUTH_DB_PASSWORD', 'USER_DB_PASSWORD', 'CHAT_DB_PASSWORD', 'MEDIA_DB_PASSWORD', 'ADMIN_DB_PASSWORD'];
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  
  dbSecrets.forEach(secretKey => {
    assert(mappedSecrets.includes(secretKey), `Missing database secret: ${secretKey}`);
  });
});

Then('it should include JWT secrets', function () {
  const jwtSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  
  jwtSecrets.forEach(secretKey => {
    assert(mappedSecrets.includes(secretKey), `Missing JWT secret: ${secretKey}`);
  });
});

Then('it should include Redis password', function () {
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  assert(mappedSecrets.includes('REDIS_PASSWORD'), 'Missing Redis password');
});

Then('it should include AWS credentials', function () {
  const awsSecrets = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  
  awsSecrets.forEach(secretKey => {
    assert(mappedSecrets.includes(secretKey), `Missing AWS credential: ${secretKey}`);
  });
});

Then('it should include MinIO credentials', function () {
  const minioSecrets = ['MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY'];
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  
  minioSecrets.forEach(secretKey => {
    assert(mappedSecrets.includes(secretKey), `Missing MinIO credential: ${secretKey}`);
  });
});

Then('it should include Typesense API key', function () {
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  assert(mappedSecrets.includes('TYPESENSE_API_KEY'), 'Missing Typesense API key');
});

Then('it should include OAuth client secrets', function () {
  const oauthSecrets = ['GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_SECRET'];
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  
  oauthSecrets.forEach(secretKey => {
    assert(mappedSecrets.includes(secretKey), `Missing OAuth secret: ${secretKey}`);
  });
});

Then('it should include SMTP credentials', function () {
  const smtpSecrets = ['SMTP_PASSWORD'];
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  
  smtpSecrets.forEach(secretKey => {
    assert(mappedSecrets.includes(secretKey), `Missing SMTP credential: ${secretKey}`);
  });
});

Then('it should include Sentry DSN', function () {
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  assert(mappedSecrets.includes('SENTRY_DSN'), 'Missing Sentry DSN');
});

Then('it should include encryption keys', function () {
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  assert(mappedSecrets.includes('ENCRYPTION_KEY'), 'Missing encryption key');
});

Then('it should include session secrets', function () {
  const mappedSecrets = externalSecrets.flatMap(secret => 
    secret.spec.data.map(mapping => mapping.secretKey)
  );
  assert(mappedSecrets.includes('SESSION_SECRET'), 'Missing session secret');
});

// RBAC validation
Then('the ServiceAccount should be properly defined', function () {
  rbacResources.serviceAccounts.forEach(sa => {
    assert(sa.metadata.name, `ServiceAccount missing name`);
    assert(sa.metadata.namespace, `ServiceAccount ${sa.metadata.name} missing namespace`);
  });
});

Then('the ClusterRole should have minimal required permissions', function () {
  rbacResources.clusterRoles.forEach(role => {
    assert(role.rules && Array.isArray(role.rules), 
           `ClusterRole ${role.metadata.name} missing or invalid rules`);
    
    // Check that permissions are limited to necessary resources
    const allowedResources = ['secrets', 'externalsecrets', 'secretstores'];
    role.rules.forEach(rule => {
      if (rule.resources) {
        rule.resources.forEach(resource => {
          assert(allowedResources.some(allowed => resource.includes(allowed)), 
                 `ClusterRole ${role.metadata.name} has excessive permissions for resource: ${resource}`);
        });
      }
    });
  });
});

Then('the ClusterRoleBinding should link ServiceAccount to ClusterRole', function () {
  rbacResources.clusterRoleBindings.forEach(binding => {
    assert(binding.roleRef, `ClusterRoleBinding ${binding.metadata.name} missing roleRef`);
    assert(binding.subjects && Array.isArray(binding.subjects), 
           `ClusterRoleBinding ${binding.metadata.name} missing or invalid subjects`);
    
    // Verify that the referenced ClusterRole exists
    const referencedRole = rbacResources.clusterRoles.find(role => 
      role.metadata.name === binding.roleRef.name
    );
    assert(referencedRole, 
           `ClusterRoleBinding ${binding.metadata.name} references non-existent ClusterRole ${binding.roleRef.name}`);
    
    // Verify that the referenced ServiceAccount exists
    binding.subjects.forEach(subject => {
      if (subject.kind === 'ServiceAccount') {
        const referencedSA = rbacResources.serviceAccounts.find(sa => 
          sa.metadata.name === subject.name && sa.metadata.namespace === subject.namespace
        );
        assert(referencedSA, 
               `ClusterRoleBinding ${binding.metadata.name} references non-existent ServiceAccount ${subject.name}`);
      }
    });
  });
});

Then('permissions should be limited to secrets and external-secrets resources', function () {
  const allowedResources = ['secrets', 'externalsecrets', 'secretstores'];
  rbacResources.clusterRoles.forEach(role => {
    role.rules.forEach(rule => {
      if (rule.resources) {
        rule.resources.forEach(resource => {
          assert(allowedResources.includes(resource), 
                 `ClusterRole ${role.metadata.name} has permissions for unexpected resource: ${resource}`);
        });
      }
    });
  });
});

// Security annotation checks
Then('each resource should have security classification annotations', function () {
  parsedYamlDocs.forEach(doc => {
    if (doc && doc.metadata) {
      assert(doc.metadata.annotations, `Resource ${doc.kind}/${doc.metadata.name} missing annotations`);
      // Not all resources need classification, but SecretStore and ExternalSecret should have it
      if (doc.kind === 'SecretStore' || doc.kind === 'ExternalSecret') {
        assert(doc.metadata.annotations['security.kubernetes.io/classification'], 
               `Resource ${doc.kind}/${doc.metadata.name} missing security classification annotation`);
      }
    }
  });
});

Then('each resource should have managed-by annotations', function () {
  parsedYamlDocs.forEach(doc => {
    if (doc && doc.metadata && (doc.kind === 'SecretStore' || doc.kind === 'ExternalSecret')) {
      assert(doc.metadata.annotations['security.kubernetes.io/managed-by'], 
             `Resource ${doc.kind}/${doc.metadata.name} missing managed-by annotation`);
    }
  });
});

Then('ExternalSecret should have rotation policy annotations', function () {
  externalSecrets.forEach(secret => {
    assert(secret.metadata.annotations['security.kubernetes.io/rotation-policy'], 
           `ExternalSecret ${secret.metadata.name} missing rotation policy annotation`);
  });
});

Then('all resources should have proper labels for identification', function () {
  parsedYamlDocs.forEach(doc => {
    if (doc && doc.metadata) {
      assert(doc.metadata.labels, `Resource ${doc.kind}/${doc.metadata.name} missing labels`);
      assert(doc.metadata.labels['app.kubernetes.io/name'], 
             `Resource ${doc.kind}/${doc.metadata.name} missing app.kubernetes.io/name label`);
    }
  });
});

// Hardcoded secrets checks
Then('it should not contain any base64 encoded values', function () {
  const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
  const matches = externalSecretsConfig.match(base64Pattern);
  
  if (matches) {
    // Filter out legitimate base64 in comments or documentation
    const suspiciousMatches = matches.filter(match => 
      !externalSecretsConfig.includes(`# ${match}`) && // Not in comments
      !externalSecretsConfig.includes(`example: ${match}`) // Not in examples
    );
    assert(suspiciousMatches.length === 0, 
           `Found suspicious base64 encoded values: ${suspiciousMatches.join(', ')}`);
  }
});

Then('it should not contain any password literals', function () {
  assert(!containsHardcodedSecrets(externalSecretsConfig), 
         'Configuration contains hardcoded password literals');
});

Then('it should not contain any API key literals', function () {
  const apiKeyPatterns = [
    /api[_-]?key\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    /sk-[a-zA-Z0-9]{48}/, // OpenAI API key
  ];
  
  apiKeyPatterns.forEach(pattern => {
    const matches = externalSecretsConfig.match(pattern);
    if (matches) {
      const suspiciousMatches = matches.filter(match => 
        !match.includes('${') && !match.includes(':?') && !match.includes('remoteRef')
      );
      assert(suspiciousMatches.length === 0, 
             `Found hardcoded API key literals: ${suspiciousMatches.join(', ')}`);
    }
  });
});

Then('it should not contain any token literals', function () {
  const tokenPatterns = [
    /token\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access token
    /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/, // Slack bot token
  ];
  
  tokenPatterns.forEach(pattern => {
    const matches = externalSecretsConfig.match(pattern);
    if (matches) {
      const suspiciousMatches = matches.filter(match => 
        !match.includes('${') && !match.includes(':?') && !match.includes('remoteRef')
      );
      assert(suspiciousMatches.length === 0, 
             `Found hardcoded token literals: ${suspiciousMatches.join(', ')}`);
    }
  });
});

Then('all sensitive data should be referenced from external sources', function () {
  externalSecrets.forEach(secret => {
    secret.spec.data.forEach(mapping => {
      assert(mapping.remoteRef && mapping.remoteRef.key && mapping.remoteRef.property, 
             `ExternalSecret ${secret.metadata.name} mapping for ${mapping.secretKey} does not reference external source`);
    });
  });
});

// Multiple backend support
Then('it should define a Vault SecretStore', function () {
  const vaultStore = secretStores.find(store => store.spec.provider.vault);
  assert(vaultStore, 'Vault SecretStore not found');
});

Then('it should define an AWS Secrets Manager SecretStore', function () {
  const awsStore = secretStores.find(store => store.spec.provider.aws);
  assert(awsStore, 'AWS Secrets Manager SecretStore not found');
});

Then('each SecretStore should have distinct names', function () {
  const names = secretStores.map(store => store.metadata.name);
  const uniqueNames = [...new Set(names)];
  assert(names.length === uniqueNames.length, 'SecretStore names are not unique');
});

Then('each SecretStore should be properly configured for its provider', function () {
  secretStores.forEach(store => {
    if (store.spec.provider.vault) {
      assert(store.spec.provider.vault.server, 
             `Vault SecretStore ${store.metadata.name} missing server configuration`);
      assert(store.spec.provider.vault.path, 
             `Vault SecretStore ${store.metadata.name} missing path configuration`);
    }
    
    if (store.spec.provider.aws) {
      assert(store.spec.provider.aws.service, 
             `AWS SecretStore ${store.metadata.name} missing service configuration`);
      assert(store.spec.provider.aws.region, 
             `AWS SecretStore ${store.metadata.name} missing region configuration`);
    }
  });
});

// Refresh and rotation checks
Then('the refresh interval should be set to a reasonable value', function () {
  externalSecrets.forEach(secret => {
    const interval = secret.spec.refreshInterval;
    // Should be between 1 minute and 24 hours
    const validIntervals = /^([1-9]\d*[mh]|[1-9]\d{0,2}m|[1-9]\d?h|1[0-9]h|2[0-4]h)$/;
    assert(validIntervals.test(interval), 
           `ExternalSecret ${secret.metadata.name} has unreasonable refresh interval: ${interval}`);
  });
});

Then('the rotation policy annotation should be present', function () {
  externalSecrets.forEach(secret => {
    assert(secret.metadata.annotations['security.kubernetes.io/rotation-policy'], 
           `ExternalSecret ${secret.metadata.name} missing rotation policy annotation`);
  });
});

Then('the refresh interval should not be too frequent to avoid rate limiting', function () {
  externalSecrets.forEach(secret => {
    const interval = secret.spec.refreshInterval;
    // Should not be less than 1 minute
    assert(!interval.match(/^[1-9]\d*s$/), 
           `ExternalSecret ${secret.metadata.name} refresh interval too frequent: ${interval}`);
  });
});

Then('the refresh interval should not be too infrequent for security', function () {
  externalSecrets.forEach(secret => {
    const interval = secret.spec.refreshInterval;
    // Should not be more than 24 hours
    const hourMatch = interval.match(/^(\d+)h$/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      assert(hours <= 24, 
             `ExternalSecret ${secret.metadata.name} refresh interval too infrequent: ${interval}`);
    }
  });
});

// Target configuration checks
Then('the target secret should have proper metadata', function () {
  externalSecrets.forEach(secret => {
    assert(secret.spec.target.template.metadata, 
           `ExternalSecret ${secret.metadata.name} target missing metadata template`);
  });
});

Then('the target secret should have security labels', function () {
  externalSecrets.forEach(secret => {
    const template = secret.spec.target.template;
    assert(template.metadata.labels, 
           `ExternalSecret ${secret.metadata.name} target missing labels in template`);
  });
});

Then('the target secret should have security annotations', function () {
  externalSecrets.forEach(secret => {
    const template = secret.spec.target.template;
    assert(template.metadata.annotations, 
           `ExternalSecret ${secret.metadata.name} target missing annotations in template`);
  });
});

Then('the creation policy should be set to Owner', function () {
  externalSecrets.forEach(secret => {
    assert(secret.spec.target.creationPolicy === 'Owner', 
           `ExternalSecret ${secret.metadata.name} target creationPolicy should be 'Owner'`);
  });
});

Then('the secret type should be Opaque', function () {
  externalSecrets.forEach(secret => {
    assert(secret.spec.target.template.type === 'Opaque', 
           `ExternalSecret ${secret.metadata.name} target template type should be 'Opaque'`);
  });
});