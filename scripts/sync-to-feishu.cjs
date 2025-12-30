#!/usr/bin/env node
/**
 * 飞书文档同步脚本
 * 将 Markdown 文档同步到飞书知识库
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const CONFIG = {
  APP_ID: process.env.FEISHU_APP_ID,
  APP_SECRET: process.env.FEISHU_APP_SECRET,
  SPACE_ID: process.env.FEISHU_SPACE_ID, // 知识库空间 ID
  DOCS_DIR: process.env.DOCS_DIR || 'docs',
};

// 飞书 API 基础 URL
const FEISHU_API = 'open.feishu.cn';

/**
 * 发送 HTTPS 请求
 */
function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: FEISHU_API,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * 获取 tenant_access_token
 */
async function getTenantToken() {
  console.log('🔑 获取飞书访问令牌...');
  const res = await request('POST', '/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: CONFIG.APP_ID,
    app_secret: CONFIG.APP_SECRET,
  });

  if (res.code !== 0) {
    throw new Error(`获取 token 失败: ${res.msg}`);
  }

  console.log('✅ Token 获取成功');
  return res.tenant_access_token;
}

/**
 * 读取 Markdown 文件
 */
function readMarkdownFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...readMarkdownFiles(fullPath, baseDir));
    } else if (item.endsWith('.md')) {
      const relativePath = path.relative(baseDir, fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      files.push({
        path: relativePath,
        name: item.replace('.md', ''),
        content: content,
        dir: path.dirname(relativePath),
      });
    }
  }

  return files;
}

/**
 * 解析行内 Markdown 格式（加粗、斜体、代码、链接）
 */
function parseInlineMarkdown(text) {
  const elements = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 匹配链接 [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      elements.push({
        text_run: {
          content: linkMatch[1],
          text_element_style: {
            link: { url: linkMatch[2] },
          },
        },
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 匹配行内代码 `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      elements.push({
        text_run: {
          content: codeMatch[1],
          text_element_style: {
            inline_code: true,
          },
        },
      });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 匹配加粗 **text** 或 __text__
    const boldMatch = remaining.match(/^(\*\*|__)([^*_]+)\1/);
    if (boldMatch) {
      elements.push({
        text_run: {
          content: boldMatch[2],
          text_element_style: {
            bold: true,
          },
        },
      });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 匹配斜体 *text* 或 _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
    if (italicMatch) {
      elements.push({
        text_run: {
          content: italicMatch[2],
          text_element_style: {
            italic: true,
          },
        },
      });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 普通文本（找到下一个特殊字符或结束）
    const nextSpecial = remaining.search(/[\[`*_]/);
    if (nextSpecial === -1) {
      elements.push({ text_run: { content: remaining } });
      break;
    } else if (nextSpecial === 0) {
      // 特殊字符但不匹配模式，作为普通文本
      elements.push({ text_run: { content: remaining[0] } });
      remaining = remaining.slice(1);
    } else {
      elements.push({ text_run: { content: remaining.slice(0, nextSpecial) } });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return elements.length > 0 ? elements : [{ text_run: { content: text } }];
}

/**
 * 将 Markdown 转换为飞书文档格式
 */
function markdownToFeishuBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 代码块处理
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim() || 'plaintext';
        codeBlockContent = [];
      } else {
        // 代码块结束
        blocks.push({
          block_type: 14, // code block
          code: {
            language: mapLanguage(codeBlockLang),
            elements: [{ text_run: { content: codeBlockContent.join('\n') } }],
          },
        });
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // 标题
    if (line.startsWith('#### ')) {
      blocks.push({
        block_type: 5, // heading4
        heading4: {
          elements: parseInlineMarkdown(line.slice(5)),
        },
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        block_type: 4, // heading3
        heading3: {
          elements: parseInlineMarkdown(line.slice(4)),
        },
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        block_type: 3, // heading2
        heading2: {
          elements: parseInlineMarkdown(line.slice(3)),
        },
      });
    } else if (line.startsWith('# ')) {
      blocks.push({
        block_type: 2, // heading1
        heading1: {
          elements: parseInlineMarkdown(line.slice(2)),
        },
      });
    }
    // 有序列表
    else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      blocks.push({
        block_type: 13, // ordered list
        ordered: {
          elements: parseInlineMarkdown(content),
        },
      });
    }
    // 无序列表
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        block_type: 12, // bullet list
        bullet: {
          elements: parseInlineMarkdown(line.slice(2)),
        },
      });
    }
    // 引用
    else if (line.startsWith('> ')) {
      blocks.push({
        block_type: 17, // quote
        quote: {
          elements: parseInlineMarkdown(line.slice(2)),
        },
      });
    }
    // 分割线
    else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({
        block_type: 22, // divider
        divider: {},
      });
    }
    // 普通段落
    else if (line.trim()) {
      blocks.push({
        block_type: 2, // text/paragraph
        text: {
          elements: parseInlineMarkdown(line),
        },
      });
    }
  }

  return blocks;
}

/**
 * 映射编程语言到飞书支持的语言
 */
function mapLanguage(lang) {
  const langMap = {
    'js': 1, // JavaScript
    'javascript': 1,
    'ts': 2, // TypeScript
    'typescript': 2,
    'python': 3,
    'py': 3,
    'java': 4,
    'go': 5,
    'golang': 5,
    'c': 6,
    'cpp': 7,
    'c++': 7,
    'csharp': 8,
    'c#': 8,
    'php': 9,
    'ruby': 10,
    'rust': 11,
    'swift': 12,
    'kotlin': 13,
    'sql': 14,
    'shell': 15,
    'bash': 15,
    'sh': 15,
    'json': 16,
    'xml': 17,
    'html': 18,
    'css': 19,
    'yaml': 20,
    'yml': 20,
    'markdown': 21,
    'md': 21,
    'plaintext': 0,
    'text': 0,
  };
  return langMap[lang.toLowerCase()] || 0;
}

/**
 * 在知识库中创建文档
 */
async function createWikiNode(token, spaceId, title, parentNodeToken = null) {
  console.log(`📄 创建文档节点: ${title}`);

  const body = {
    obj_type: 'docx',
    node_type: 'origin',
    title: title,
  };

  if (parentNodeToken) {
    body.parent_node_token = parentNodeToken;
  }

  const res = await request(
    'POST',
    `/open-apis/wiki/v2/spaces/${spaceId}/nodes`,
    body,
    token
  );

  if (res.code !== 0) {
    console.error(`❌ 创建文档失败: ${res.msg}`);
    return null;
  }

  return res.data.node;
}

/**
 * 更新文档内容
 */
async function updateDocument(token, documentId, blocks) {
  console.log(`📝 更新文档内容: ${documentId}`);

  // 获取文档根 block
  const docRes = await request(
    'GET',
    `/open-apis/docx/v1/documents/${documentId}`,
    null,
    token
  );

  if (docRes.code !== 0) {
    console.error(`❌ 获取文档失败: ${docRes.msg}`);
    return false;
  }

  const rootBlockId = docRes.data.document.document_id;

  // 批量创建 blocks
  for (const block of blocks) {
    await request(
      'POST',
      `/open-apis/docx/v1/documents/${documentId}/blocks/${rootBlockId}/children`,
      { children: [block] },
      token
    );
  }

  return true;
}

/**
 * 获取知识库所有节点列表（支持分页）
 */
async function getWikiNodes(token, spaceId) {
  let allNodes = [];
  let pageToken = null;

  do {
    let url = `/open-apis/wiki/v2/spaces/${spaceId}/nodes?page_size=50`;
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }

    const res = await request('GET', url, null, token);

    if (res.code !== 0) {
      console.error(`❌ 获取节点列表失败: ${res.msg}`);
      return allNodes;
    }

    if (res.data.items) {
      allNodes = allNodes.concat(res.data.items);
    }
    pageToken = res.data.page_token;
  } while (pageToken);

  return allNodes;
}

/**
 * 获取文档所有 blocks
 */
async function getDocumentBlocks(token, documentId) {
  const res = await request(
    'GET',
    `/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500`,
    null,
    token
  );

  if (res.code !== 0) {
    return [];
  }

  return res.data.items || [];
}

/**
 * 删除文档中的 block
 */
async function deleteBlock(token, documentId, blockId) {
  const res = await request(
    'DELETE',
    `/open-apis/docx/v1/documents/${documentId}/blocks/${blockId}`,
    null,
    token
  );
  return res.code === 0;
}

/**
 * 清空文档内容（保留文档本身）
 */
async function clearDocumentContent(token, documentId) {
  const blocks = await getDocumentBlocks(token, documentId);

  // 跳过第一个 block（通常是 page block，不能删除）
  const blocksToDelete = blocks.filter(b => b.block_type !== 1);

  for (const block of blocksToDelete) {
    await deleteBlock(token, documentId, block.block_id);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * 删除知识库节点
 */
async function deleteWikiNode(token, spaceId, nodeToken) {
  const res = await request(
    'DELETE',
    `/open-apis/wiki/v2/spaces/${spaceId}/nodes/${nodeToken}`,
    null,
    token
  );

  return res.code === 0;
}

/**
 * 清空知识库所有节点
 */
async function cleanWikiSpace(token, spaceId) {
  console.log('🗑️  清空知识库...');
  const nodes = await getWikiNodes(token, spaceId);
  console.log(`   找到 ${nodes.length} 个节点需要删除`);

  let deleted = 0;
  for (const node of nodes) {
    const success = await deleteWikiNode(token, spaceId, node.node_token);
    if (success) {
      console.log(`   🗑️  已删除: ${node.title}`);
      deleted++;
    } else {
      console.log(`   ❌ 删除失败: ${node.title}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`✅ 清空完成，删除了 ${deleted} 个节点\n`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const forceMode = args.includes('--force') || args.includes('-f');
  const updateMode = args.includes('--update') || args.includes('-u');
  const cleanOnly = args.includes('--clean');

  console.log('🚀 开始同步文档到飞书知识库...\n');

  if (forceMode) {
    console.log('⚠️  强制模式：将先清空知识库再重新同步\n');
  }

  if (updateMode) {
    console.log('📝 更新模式：将更新已存在文档的内容\n');
  }

  // 检查配置
  if (!CONFIG.APP_ID || !CONFIG.APP_SECRET) {
    console.error('❌ 请设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量');
    process.exit(1);
  }

  if (!CONFIG.SPACE_ID) {
    console.error('❌ 请设置 FEISHU_SPACE_ID 环境变量');
    process.exit(1);
  }

  try {
    // 获取 token
    const token = await getTenantToken();

    // 如果是清空模式或强制模式，先删除所有节点
    if (cleanOnly || forceMode) {
      await cleanWikiSpace(token, CONFIG.SPACE_ID);
      if (cleanOnly) {
        console.log('✅ 清空完成，退出');
        process.exit(0);
      }
    }

    // 读取 Markdown 文件
    const docsPath = path.resolve(CONFIG.DOCS_DIR);
    console.log(`\n📂 扫描文档目录: ${docsPath}`);

    if (!fs.existsSync(docsPath)) {
      console.error(`❌ 目录不存在: ${docsPath}`);
      process.exit(1);
    }

    const files = readMarkdownFiles(docsPath);
    console.log(`📚 找到 ${files.length} 个 Markdown 文件\n`);

    // 获取现有节点（用于避免重复创建）
    const existingNodes = await getWikiNodes(token, CONFIG.SPACE_ID);
    const existingNodesMap = new Map(existingNodes.map((n) => [n.title, n]));

    // 按目录分组
    const dirMap = new Map();
    for (const file of files) {
      const dir = file.dir || '.';
      if (!dirMap.has(dir)) {
        dirMap.set(dir, []);
      }
      dirMap.get(dir).push(file);
    }

    // 统计
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // 同步文件
    for (const [dir, dirFiles] of dirMap) {
      console.log(`\n📁 处理目录: ${dir}`);

      for (const file of dirFiles) {
        const title = file.name;
        const existingNode = existingNodesMap.get(title);

        if (existingNode) {
          if (updateMode) {
            // 更新模式：清空并重写内容
            console.log(`📝 更新文档: ${title}`);
            try {
              await clearDocumentContent(token, existingNode.obj_token);
              const blocks = markdownToFeishuBlocks(file.content);
              const success = await updateDocument(token, existingNode.obj_token, blocks);
              if (success) {
                console.log(`✅ 更新成功: ${title}`);
                updated++;
              } else {
                console.log(`❌ 更新失败: ${title}`);
                failed++;
              }
            } catch (e) {
              console.log(`❌ 更新失败: ${title} - ${e.message}`);
              failed++;
            }
          } else {
            console.log(`⏭️  跳过已存在: ${title}`);
            skipped++;
          }
        } else {
          // 创建新文档
          const node = await createWikiNode(token, CONFIG.SPACE_ID, title);

          if (node) {
            const blocks = markdownToFeishuBlocks(file.content);
            const success = await updateDocument(token, node.obj_token, blocks);

            if (success) {
              console.log(`✅ 创建成功: ${title}`);
              created++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        }

        // 避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // 输出统计
    console.log('\n' + '='.repeat(50));
    console.log('📊 同步完成统计:');
    console.log(`   ✅ 新建: ${created}`);
    console.log(`   📝 更新: ${updated}`);
    console.log(`   ⏭️  跳过: ${skipped}`);
    console.log(`   ❌ 失败: ${failed}`);
    console.log('='.repeat(50));

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  }
}

main();
