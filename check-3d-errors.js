#!/usr/bin/env node

// 检查3D模式相关错误的脚本
import http from 'http';

async function checkPage() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // 检查是否有Three.js相关的脚本
        const hasThree = data.includes('three') || data.includes('Three');
        const hasR3F = data.includes('react-three') || data.includes('@react-three');
        const hasCanvas = data.includes('Canvas');
        
        console.log('页面检查结果:');
        console.log('  - 包含Three.js:', hasThree ? '✅' : '❌');
        console.log('  - 包含React Three Fiber:', hasR3F ? '✅' : '❌');
        console.log('  - 包含Canvas:', hasCanvas ? '✅' : '❌');
        
        // 检查脚本标签
        const scriptMatches = data.match(/<script[^>]*src="([^"]+)"[^>]*>/g) || [];
        console.log('\n脚本文件:');
        scriptMatches.forEach(match => {
          const srcMatch = match.match(/src="([^"]+)"/);
          if (srcMatch) {
            console.log('  -', srcMatch[1]);
          }
        });
        
        resolve({ hasThree, hasR3F, hasCanvas });
      });
    }).on('error', reject);
  });
}

async function checkAPI() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/teams/android-dev-team/members', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const members = JSON.parse(data);
          console.log('\nAPI检查结果:');
          console.log('  - 成员数量:', members.length);
          if (members.length > 0) {
            console.log('  - 第一个成员:', JSON.stringify(members[0], null, 2));
            console.log('  - 成员字段:', Object.keys(members[0]).join(', '));
          }
          resolve(members);
        } catch (e) {
          console.error('API响应解析失败:', e.message);
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

async function checkJSFile() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/assets/index.js', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasThree = data.includes('three') || data.includes('THREE');
        const hasR3F = data.includes('react-three') || data.includes('@react-three/fiber');
        const hasMembers3D = data.includes('Members3D') || data.includes('members3D');
        
        console.log('\nJavaScript文件检查:');
        console.log('  - 包含Three.js:', hasThree ? '✅' : '❌');
        console.log('  - 包含React Three Fiber:', hasR3F ? '✅' : '❌');
        console.log('  - 包含Members3D:', hasMembers3D ? '✅' : '❌');
        console.log('  - 文件大小:', (data.length / 1024).toFixed(2), 'KB');
        
        // 检查是否有明显的错误模式
        if (data.includes('Cannot read') || data.includes('undefined')) {
          console.log('  ⚠️  文件中包含可能的错误模式');
        }
        
        resolve({ hasThree, hasR3F, hasMembers3D });
      });
    }).on('error', (err) => {
      console.error('无法加载JS文件:', err.message);
      resolve({ hasThree: false, hasR3F: false, hasMembers3D: false });
    });
  });
}

async function main() {
  console.log('🔍 开始检查3D模式相关问题...\n');
  
  try {
    await checkPage();
    await checkAPI();
    await checkJSFile();
    
    console.log('\n✅ 检查完成');
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

main();
