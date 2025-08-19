#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 检查文档中的硬编码密钥
function validateDocumentationSecrets() {
  const deploymentGuide = path.join(__dirname, 'docs/deployment/microservices-deployment-guide-zh.md');
  
  if (!fs.existsSync(deploymentGuide)) {
    console.error('❌ 部署指南文件不存在');
    process.exit(1);
  }
  
  const content = fs.readFileSync(deploymentGuide, 'utf8');
  
  // 检查是否还有硬编码的密钥
  const hardcodedPatterns = [
    /POSTGRES_PASSWORD=(?!\$\{|\$\()/,
    /JWT_SECRET=(?!\$\{|\$\()/,
    /AWS_ACCESS_KEY_ID=(?!\$\{|\$\()/,
    /AWS_SECRET_ACCESS_KEY=(?!\$\{|\$\()/,
    /TYPESENSE_API_KEY=(?!\$\{|\$\()/,
    /password:\s*["'](?!\$\{|\$\()[^"']+["']/,
    /secret:\s*["'](?!\$\{|\$\()[^"']+["']/
  ];
  
  const base64Pattern = /[A-Za-z0-9+\/]{20,}={0,2}/;
  
  let hasHardcodedSecrets = false;
  let hasBase64Secrets = false;
  
  // 检查硬编码密钥
  hardcodedPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      console.error(`❌ 发现硬编码密钥 (模式 ${index + 1})`);
      hasHardcodedSecrets = true;
    }
  });
  
  // 检查Base64编码的密钥
   const lines = content.split('\n');
   lines.forEach((line, lineNum) => {
     // 跳过Docker配置路径和命令行参数
     if (line.includes(':/') || line.includes('--') || line.includes('./')) {
       return;
     }
     if (base64Pattern.test(line) && line.length > 50) {
       console.error(`❌ 第 ${lineNum + 1} 行可能包含Base64编码的密钥: ${line.substring(0, 50)}...`);
       hasBase64Secrets = true;
     }
   });
  
  // 检查是否使用了环境变量
  const envVarPatterns = [
    /\$\{POSTGRES_PASSWORD\}/,
    /\$\{JWT_SECRET\}/,
    /\$\{AWS_ACCESS_KEY_ID\}/,
    /\$\{AWS_SECRET_ACCESS_KEY\}/,
    /\$\{TYPESENSE_API_KEY\}/
  ];
  
  let hasEnvVars = false;
  envVarPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      hasEnvVars = true;
    }
  });
  
  if (!hasHardcodedSecrets && !hasBase64Secrets) {
    console.log('✅ 未发现硬编码密钥');
  }
  
  if (hasEnvVars) {
    console.log('✅ 检测到环境变量的使用');
  }
  
  // 检查是否有安全指导注释
  if (content.includes('# 安全提示') || content.includes('# 注意')) {
    console.log('✅ 检测到安全指导注释');
  }
  
  if (hasHardcodedSecrets || hasBase64Secrets) {
    console.error('❌ 文档安全验证失败');
    process.exit(1);
  } else {
    console.log('✅ 文档安全验证通过');
  }
}

validateDocumentationSecrets();