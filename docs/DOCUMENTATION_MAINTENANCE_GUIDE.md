# Documentation Maintenance Guide

## 📋 Overview

This guide establishes mandatory rules for maintaining bilingual documentation in the MKing Friend project. All developers must follow these standards to ensure consistency between Chinese and English versions.

## 🌐 Bilingual Documentation Requirements

### Mandatory Bilingual Documentation Policy

**Key Rule**: All documentation in the `/docs/` directory must maintain both Chinese and English versions.

**Enforcement Rule**: Every documentation creation, update, or modification must include both Chinese and English versions in the same commit. No exceptions are allowed for production documentation.

#### File Naming Convention

1. **Chinese Version**: Add `-zh` suffix to filename
   ```
   README-zh.md
   CHANGELOG-zh.md
   setup-zh.md
   api-design-zh.md
   ```

2. **English Version**: Use original filename (no suffix)
   ```
   README.md
   CHANGELOG.md
   setup.md
   api-design.md
   ```

### Synchronization Requirements

#### Content Synchronization Standards

1. **Information Parity**
   - Chinese and English versions must contain identical information
   - Technical specifications must be consistent
   - Code examples and configurations must be identical
   - Version numbers and dates must match

2. **Structural Consistency**
   - Section and paragraph structure must be identical
   - Internal document links must correspond correctly
   - Directory structure must match
   - Table of contents must align

3. **Technical Accuracy**
   - Technical terminology must be consistent
   - API endpoints and parameters must be identical
   - Configuration examples must match exactly
   - Code snippets must be identical

#### Update Timing Requirements

**Mandatory Requirement**: Both versions must be updated simultaneously:

- ✅ **Correct**: Update both Chinese and English versions in the same commit
- ❌ **Incorrect**: Update only one language version
- ❌ **Incorrect**: Update versions in different commits without coordination

#### Automated Enforcement Rules

**Zero Tolerance Policy**: The following rules will be automatically enforced:

1. **Pre-commit Validation**
   - All commits involving `/docs/` directory must include both language versions
   - Missing language versions will result in commit rejection
   - Content consistency checks are mandatory

2. **Pull Request Requirements**
   - PRs containing documentation changes must include both Chinese and English versions
   - Automated checks verify file naming conventions
   - Content synchronization validation is required

3. **Continuous Integration Checks**
   - CI pipeline validates bilingual documentation integrity
   - Content inconsistencies between versions will cause build failures
   - Missing translations will block deployment

### Developer Responsibilities

#### When Creating New Documentation

1. **Immediate Bilingual Creation**
   - Create both Chinese (`-zh.md`) and English (`.md`) versions
   - Ensure content parity from the start
   - Include both files in the same commit

2. **Content Requirements**
   - Write technical content in English first (industry standard)
   - Translate to Chinese while maintaining technical accuracy
   - Verify all code examples are identical
   - Check that all internal links work in both versions

#### When Updating Existing Documentation

1. **Simultaneous Updates**
   - Modify both language versions in the same session
   - Ensure changes are reflected identically in both versions
   - Commit both files together

2. **Change Verification**
   - Compare content between versions after updates
   - Verify technical terminology consistency
   - Check that all modifications are reflected in both versions

### Quality Assurance Checklist

#### Pre-commit Checklist

Before committing documentation changes, verify:

- [ ] Both Chinese (`-zh.md`) and English (`.md`) versions exist
- [ ] Content information is identical between versions
- [ ] Technical terminology is consistent and accurate
- [ ] Code examples are exactly the same
- [ ] Internal document links correspond correctly
- [ ] Version numbers and update dates are synchronized
- [ ] Document structure and headings are consistent
- [ ] All new sections exist in both versions
- [ ] File formatting and markdown syntax are correct

#### Translation Quality Standards

1. **Technical Terminology**
   - Use industry-standard Chinese technical terms
   - Maintain English technical accuracy
   - Provide English terms in parentheses when necessary
   - Maintain terminology consistency across all documents

2. **Code and Configuration**
   - Never translate code examples
   - Keep configuration file content in original language
   - Only translate comments when it improves clarity
   - Maintain exact formatting and indentation

3. **Links and References**
   - Internal links should point to corresponding language versions
   - External links should prefer official English documentation
   - Note language when providing Chinese-specific resources
   - Ensure all links work in both versions

### Enforcement and Compliance

#### Code Review Requirements

**Reviewers must verify**:
- Pull requests include both language versions
- Content consistency between Chinese and English versions
- Technical accuracy of translations
- Correct file naming conventions
- Link functionality in both versions

#### Violation Consequences

- **Single-language commits will be rejected**
- **Content inconsistencies between versions require resubmission**
- **Missing bilingual documentation blocks merge approval**
- **Repeated violations affect developer performance evaluations**

#### Automated Checks (Implemented)

```bash
# Available automation scripts
./scripts/check-bilingual-docs.sh          # Verify bilingual documentation integrity
./scripts/validate-doc-consistency.sh      # Planned: Advanced content consistency validation
./scripts/verify-internal-links.sh         # Planned: Internal link verification
```

**Active Automation:**
- **Pre-commit Hook**: Automatically validates bilingual documentation on every commit
- **Bilingual Checker**: Verifies file naming conventions and missing translations
- **Content Consistency**: Basic structural validation between language versions

**Setup Instructions:**
```bash
# Scripts are automatically executable after project setup
# Test the bilingual documentation checker
./scripts/check-bilingual-docs.sh

# Pre-commit hook is automatically installed
# For manual installation if needed:
chmod +x .git/hooks/pre-commit
```

### Maintenance Responsibilities

#### Role-based Responsibilities

1. **Documentation Creator**
   - Must provide both Chinese and English versions
   - Ensure initial content parity
   - Verify all links and references work

2. **Documentation Modifier**
   - Must update both versions simultaneously
   - Maintain content consistency
   - Verify changes are reflected in both languages

3. **Code Reviewer**
   - Must check bilingual documentation integrity
   - Verify content consistency between versions
   - Ensure technical accuracy of translations

4. **Project Maintainer**
   - Regularly audit bilingual documentation status
   - Identify and resolve inconsistency issues
   - Update maintenance procedures as needed

### Documentation Workflow

#### Standard Workflow for New Documentation

1. **Planning Phase**
   ```bash
   # Create both files simultaneously
   touch docs/new-feature.md
   touch docs/new-feature-zh.md
   ```

2. **Content Creation**
   - Write English version first (technical standard)
   - Translate to Chinese while maintaining accuracy
   - Verify code examples are identical
   - Check internal links work in both versions

3. **Review and Commit**
   ```bash
   # Commit both files together
   git add docs/new-feature.md docs/new-feature-zh.md
   git commit -m "docs: add new feature documentation (EN/ZH)"
   ```

#### Standard Workflow for Documentation Updates

1. **Preparation**
   - Open both language versions
   - Plan changes to ensure consistency

2. **Modification**
   - Update English version first
   - Apply same changes to Chinese version
   - Verify technical accuracy

3. **Validation**
   - Compare consistency between both versions
   - Check all links and references
   - Verify code examples match

4. **Commit**
   ```bash
   git add docs/updated-file.md docs/updated-file-zh.md
   git commit -m "docs: update feature documentation (EN/ZH)"
   ```

### Tools and Resources

#### Recommended Tools

1. **Diff Tools**
   - Use `diff` or `vimdiff` to compare versions
   - VS Code "Compare Files" feature
   - Online diff tools for detailed comparison

2. **Translation Resources**
   - Technical terminology dictionaries
   - Industry-standard Chinese technical terms
   - Consistent terminology reference tables

3. **Link Validation**
   - Markdown link checkers
   - Internal link validation scripts
   - Automated link testing tools

#### Helper Scripts

**Currently Available:**
```bash
# Bilingual documentation validation
./scripts/check-bilingual-docs.sh
```

**Future Development Plans:**
```bash
# Additional utility scripts (planned)
./scripts/create-bilingual-doc.sh <filename>
./scripts/sync-doc-versions.sh <filename>
./scripts/validate-bilingual-consistency.sh
```

**Script Documentation:**
For detailed usage instructions, see: [Scripts README](../scripts/README.md)

### Exception Handling

#### Temporary Single-language Documentation

In rare cases where immediate bilingual creation is not possible:

1. **Create Tracking Issue**
   - Document missing language version
   - Set completion deadline
   - Assign translation responsibility

2. **Add Placeholder**
   ```markdown
   # [Document Title]
   
   **Translation Status**: 🚧 English version pending
   **Expected Completion**: [Date]
   **Assigned to**: [Developer]
   
   [Chinese content...]
   ```

3. **Prioritize Completion**
   - Complete missing version within 48 hours
   - Update tracking issue when completed
   - Remove placeholder content

### Monitoring and Reporting

#### Regular Audits

**Monthly Documentation Audit**:
- Identify missing language versions
- Check content consistency between versions
- Verify link functionality
- Update maintenance procedures

#### Metrics Tracking

- Bilingual documentation coverage percentage
- Average time to complete missing translations
- Number of consistency issues found
- Developer compliance rates

### Future Enhancements

#### Planned Improvements

1. **Automated Validation**
   - Pre-commit hooks for bilingual checks
   - CI/CD integration for documentation validation
   - Automated consistency checking

2. **Translation Assistance**
   - Translation memory systems
   - Terminology management tools
   - Automated translation suggestions

3. **Documentation Management**
   - Centralized documentation dashboard
   - Real-time synchronization status
   - Automated reporting systems

---

## 📝 Change Tracking Integration

This guide integrates with change tracking requirements in `DEVELOPMENT_STANDARDS.md`:

- All documentation changes must be logged in `CHANGELOG.md` (both versions)
- Bilingual documentation updates are mandatory for all commits
- Documentation maintenance is part of the development workflow

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Maintainer**: Development Team  
**Status**: ✅ Enforced  
**Related Documentation**:
- [Development Standards](./development/DEVELOPMENT_STANDARDS.md)
- [Development Standards (Chinese)](./development/DEVELOPMENT_STANDARDS-zh.md)