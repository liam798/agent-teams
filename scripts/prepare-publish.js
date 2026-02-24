#!/usr/bin/env node

/**
 * 发布前准备脚本：清理测试文件
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

function removeTestFiles(dir) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      removeTestFiles(fullPath);
      // 如果目录为空，删除它
      try {
        const remaining = fs.readdirSync(fullPath);
        if (remaining.length === 0) {
          fs.rmdirSync(fullPath);
        }
      } catch {
        // 忽略错误
      }
    } else if (entry.isFile()) {
      // 删除测试文件
      if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
        fs.unlinkSync(fullPath);
        console.log(`删除: ${fullPath}`);
      }
    }
  }
}

console.log('清理测试文件...');
removeTestFiles(distDir);
console.log('清理完成！');
