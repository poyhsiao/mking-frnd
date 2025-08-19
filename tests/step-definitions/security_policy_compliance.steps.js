const { Given, When, Then } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// File paths
const SECURITY_POLICY_PATH = path.join(process.cwd(), 'docs/security/SECURITY_POLICY.md');
const INCIDENT_RESPONSE_PATH = path.join(
  process.cwd(),
  'docs/security/INCIDENT_RESPONSE_PLAYBOOK.md',
);
const TRAINING_MATERIALS_PATH = path.join(
  process.cwd(),
  'docs/security/SECURITY_TRAINING_MATERIALS.md',
);

// Global variables
let documentContent = '';
let currentDocument = '';

// Helper functions
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFileContent(filePath) {
  if (!fileExists(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function validateContentContains(content, searchText, errorMessage) {
  if (!content.toLowerCase().includes(searchText.toLowerCase())) {
    throw new Error(errorMessage || `Content does not contain: ${searchText}`);
  }
}

// Security Policy Document Steps
Given('the security policy document exists', function () {
  assert(fileExists(SECURITY_POLICY_PATH), 'Security policy document does not exist');
  documentContent = readFileContent(SECURITY_POLICY_PATH);
  currentDocument = 'security_policy';
});

When('I validate the document structure', function () {
  assert(documentContent.length > 0, 'Document content is empty');
});

Then('it should contain governance and organization section', function () {
  validateContentContains(documentContent, 'governance', 'Missing governance section');
});

Then('it should contain risk management section', function () {
  validateContentContains(documentContent, 'risk management', 'Missing risk management section');
});

Then('it should contain access control section', function () {
  validateContentContains(documentContent, 'access control', 'Missing access control section');
});

Then('it should contain incident response section', function () {
  validateContentContains(
    documentContent,
    'incident response',
    'Missing incident response section',
  );
});

Then('it should contain compliance framework section', function () {
  validateContentContains(documentContent, 'compliance', 'Missing compliance framework section');
});

// Incident Response Playbook Steps
Given('the incident response playbook exists', function () {
  assert(fileExists(INCIDENT_RESPONSE_PATH), 'Incident response playbook does not exist');
  documentContent = readFileContent(INCIDENT_RESPONSE_PATH);
  currentDocument = 'incident_response';
});

When('I check the playbook content', function () {
  assert(documentContent.length > 0, 'Playbook content is empty');
});

Then('it should define incident classification levels', function () {
  validateContentContains(documentContent, 'classification', 'Missing incident classification');
});

Then('it should specify team roles and responsibilities', function () {
  validateContentContains(documentContent, 'roles', 'Missing team roles');
});

Then('it should outline communication protocols', function () {
  validateContentContains(documentContent, 'communication', 'Missing communication protocols');
});

Then('it should include evidence handling procedures', function () {
  validateContentContains(documentContent, 'evidence', 'Missing evidence handling procedures');
});

Then('it should cover legal and regulatory considerations', function () {
  validateContentContains(documentContent, 'legal', 'Missing legal considerations');
});

// Security Training Materials Steps
Given('the security training materials exist', function () {
  assert(fileExists(TRAINING_MATERIALS_PATH), 'Security training materials do not exist');
  documentContent = readFileContent(TRAINING_MATERIALS_PATH);
  currentDocument = 'training_materials';
});

When('I review the training content', function () {
  assert(documentContent.length > 0, 'Training content is empty');
});

Then('it should cover security awareness training', function () {
  validateContentContains(
    documentContent,
    'security awareness',
    'Missing security awareness training',
  );
});

Then('it should include secure coding practices', function () {
  validateContentContains(documentContent, 'secure coding', 'Missing secure coding practices');
});

Then('it should address infrastructure security', function () {
  validateContentContains(
    documentContent,
    'infrastructure security',
    'Missing infrastructure security',
  );
});

Then('it should contain incident response training', function () {
  validateContentContains(
    documentContent,
    'incident response',
    'Missing incident response training',
  );
});

Then('it should include compliance training', function () {
  validateContentContains(documentContent, 'compliance', 'Missing compliance training');
});

// Document Metadata Steps
Given('security policy documents exist', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    assert(fileExists(doc), `Document does not exist: ${doc}`);
  });
});

When('I check document metadata', function () {
  // Prepare for metadata validation
});

Then('each document should have version information', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    validateContentContains(content, 'version', `Missing version information in ${doc}`);
  });
});

Then('each document should have last updated date', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    validateContentContains(content, 'last updated', `Missing last updated date in ${doc}`);
  });
});

Then('each document should have next review date', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    validateContentContains(content, 'next review', `Missing next review date in ${doc}`);
  });
});

Then('each document should have document owner', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    validateContentContains(content, 'owner', `Missing document owner in ${doc}`);
  });
});

Then('each document should have approval information', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    validateContentContains(content, 'approved', `Missing approval information in ${doc}`);
  });
});

// Training Program Structure Steps
When('I validate the training program structure', function () {
  assert(currentDocument === 'training_materials', 'Training materials not loaded');
});

Then('it should define training schedule', function () {
  validateContentContains(documentContent, 'schedule', 'Missing training schedule');
});

Then('it should specify assessment methods', function () {
  validateContentContains(documentContent, 'assessment', 'Missing assessment methods');
});

Then('it should include completion tracking', function () {
  validateContentContains(documentContent, 'completion tracking', 'Missing completion tracking');
});

Then('it should outline knowledge retention testing', function () {
  validateContentContains(
    documentContent,
    'knowledge retention',
    'Missing knowledge retention testing',
  );
});

Then('it should measure training effectiveness', function () {
  validateContentContains(
    documentContent,
    'training effectiveness',
    'Missing training effectiveness measurement',
  );
});

// Additional simplified step definitions
When('I check team structure', function () {
  assert(currentDocument === 'incident_response', 'Incident response playbook not loaded');
});

Then('it should define incident commander role', function () {
  validateContentContains(documentContent, 'incident commander', 'Missing incident commander role');
});

Then('it should specify technical lead responsibilities', function () {
  validateContentContains(
    documentContent,
    'technical lead',
    'Missing technical lead responsibilities',
  );
});

Then('it should outline communication coordinator duties', function () {
  validateContentContains(
    documentContent,
    'communication coordinator',
    'Missing communication coordinator duties',
  );
});

Then('it should include legal advisor role', function () {
  validateContentContains(documentContent, 'legal advisor', 'Missing legal advisor role');
});

Then('it should define management liaison responsibilities', function () {
  validateContentContains(
    documentContent,
    'management liaison',
    'Missing management liaison responsibilities',
  );
});

// Security Control Framework Steps
When('I review security controls', function () {
  assert(currentDocument === 'security_policy', 'Security policy not loaded');
});

Then('it should define technical controls', function () {
  validateContentContains(documentContent, 'technical controls', 'Missing technical controls');
});

Then('it should specify administrative controls', function () {
  validateContentContains(
    documentContent,
    'administrative controls',
    'Missing administrative controls',
  );
});

Then('it should outline physical controls', function () {
  validateContentContains(documentContent, 'physical controls', 'Missing physical controls');
});

Then('it should include monitoring controls', function () {
  validateContentContains(documentContent, 'monitoring', 'Missing monitoring controls');
});

Then('it should address preventive controls', function () {
  validateContentContains(documentContent, 'preventive', 'Missing preventive controls');
});

// Compliance Framework Steps
When('I check compliance requirements', function () {
  assert(currentDocument === 'security_policy', 'Security policy not loaded');
});

Then('it should address regulatory compliance', function () {
  validateContentContains(documentContent, 'regulatory', 'Missing regulatory compliance');
});

Then('it should include industry standards', function () {
  validateContentContains(documentContent, 'standards', 'Missing industry standards');
});

Then('it should specify audit requirements', function () {
  validateContentContains(documentContent, 'audit', 'Missing audit requirements');
});

Then('it should outline reporting obligations', function () {
  validateContentContains(documentContent, 'reporting', 'Missing reporting obligations');
});

Then('it should define compliance monitoring', function () {
  validateContentContains(
    documentContent,
    'compliance monitoring',
    'Missing compliance monitoring',
  );
});

// Risk Management Steps
When('I validate risk management content', function () {
  assert(currentDocument === 'security_policy', 'Security policy not loaded');
});

Then('it should define risk assessment methodology', function () {
  validateContentContains(
    documentContent,
    'risk assessment',
    'Missing risk assessment methodology',
  );
});

Then('it should specify risk classification criteria', function () {
  validateContentContains(
    documentContent,
    'risk classification',
    'Missing risk classification criteria',
  );
});

Then('it should outline risk mitigation strategies', function () {
  validateContentContains(documentContent, 'risk mitigation', 'Missing risk mitigation strategies');
});

Then('it should include risk monitoring procedures', function () {
  validateContentContains(documentContent, 'risk monitoring', 'Missing risk monitoring procedures');
});

Then('it should address risk reporting requirements', function () {
  validateContentContains(documentContent, 'risk reporting', 'Missing risk reporting requirements');
});

// Business Continuity Steps
When('I check business continuity content', function () {
  assert(currentDocument === 'security_policy', 'Security policy not loaded');
});

Then('it should define business impact analysis', function () {
  validateContentContains(documentContent, 'business impact', 'Missing business impact analysis');
});

Then('it should specify recovery time objectives', function () {
  validateContentContains(documentContent, 'recovery time', 'Missing recovery time objectives');
});

Then('it should outline disaster recovery procedures', function () {
  validateContentContains(
    documentContent,
    'disaster recovery',
    'Missing disaster recovery procedures',
  );
});

Then('it should include backup and restore processes', function () {
  validateContentContains(documentContent, 'backup', 'Missing backup and restore processes');
});

Then('it should address crisis communication plans', function () {
  validateContentContains(
    documentContent,
    'crisis communication',
    'Missing crisis communication plans',
  );
});

// Security Awareness Training Steps
When('I review awareness training content', function () {
  assert(currentDocument === 'training_materials', 'Training materials not loaded');
});

Then('it should cover phishing awareness', function () {
  validateContentContains(documentContent, 'phishing', 'Missing phishing awareness');
});

Then('it should include password security', function () {
  validateContentContains(documentContent, 'password', 'Missing password security');
});

Then('it should address social engineering', function () {
  validateContentContains(documentContent, 'social engineering', 'Missing social engineering');
});

Then('it should cover physical security', function () {
  validateContentContains(documentContent, 'physical security', 'Missing physical security');
});

Then('it should include data protection principles', function () {
  validateContentContains(documentContent, 'data protection', 'Missing data protection principles');
});

// Technical Security Training Steps
When('I check technical training content', function () {
  assert(currentDocument === 'training_materials', 'Training materials not loaded');
});

Then('it should cover secure coding practices', function () {
  validateContentContains(documentContent, 'secure coding', 'Missing secure coding practices');
});

Then('it should include OWASP Top 10', function () {
  validateContentContains(documentContent, 'OWASP', 'Missing OWASP Top 10');
});

Then('it should address secret management', function () {
  validateContentContains(documentContent, 'secret management', 'Missing secret management');
});

Then('it should cover container security', function () {
  validateContentContains(documentContent, 'container security', 'Missing container security');
});

Then('it should include infrastructure security', function () {
  validateContentContains(
    documentContent,
    'infrastructure security',
    'Missing infrastructure security',
  );
});

// Documentation Accessibility Steps
When('I check document accessibility', function () {
  // Prepare for accessibility validation
});

Then('documents should be in readable format', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    assert(content.length > 100, `Document too short: ${doc}`);
  });
});

Then('documents should have clear structure', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    validateContentContains(content, '#', `Missing headings in ${doc}`);
  });
});

Then('documents should use consistent formatting', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    assert(content.includes('##'), `Inconsistent formatting in ${doc}`);
  });
});

Then('documents should include table of contents', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    const headingCount = (content.match(/^#+\s/gm) || []).length;
    assert(headingCount >= 5, `Insufficient structure in ${doc}`);
  });
});

Then('documents should have proper headings', function () {
  const documents = [SECURITY_POLICY_PATH, INCIDENT_RESPONSE_PATH, TRAINING_MATERIALS_PATH];
  documents.forEach(doc => {
    const content = readFileContent(doc);
    validateContentContains(content, '# ', `Missing main heading in ${doc}`);
  });
});

// Policy Update and Maintenance Steps
When('I check policy management content', function () {
  assert(currentDocument === 'security_policy', 'Security policy not loaded');
});

Then('it should define update procedures', function () {
  validateContentContains(documentContent, 'update', 'Missing update procedures');
});

Then('it should specify review cycles', function () {
  validateContentContains(documentContent, 'review', 'Missing review cycles');
});

Then('it should outline change approval process', function () {
  validateContentContains(documentContent, 'approval', 'Missing change approval process');
});

Then('it should include version control procedures', function () {
  validateContentContains(documentContent, 'version', 'Missing version control procedures');
});

Then('it should address communication of changes', function () {
  validateContentContains(documentContent, 'communication', 'Missing communication of changes');
});

// Training Effectiveness Measurement Steps
When('I validate effectiveness measurement', function () {
  assert(currentDocument === 'training_materials', 'Training materials not loaded');
});

Then('it should measure behavioral change', function () {
  validateContentContains(
    documentContent,
    'behavioral change',
    'Missing behavioral change measurement',
  );
});

Then('it should track incident reduction', function () {
  validateContentContains(
    documentContent,
    'incident reduction',
    'Missing incident reduction tracking',
  );
});
