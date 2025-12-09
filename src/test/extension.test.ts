//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite("Extension Tests", () => {

    let tempDir: string;
    let testFilePath: string;

    setup(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-test-'));
    });

    teardown(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test("Updated field should be updated on save", async () => {
        // 创建测试文件，包含 updated 字段
        const initialContent = `---
title: Test Post
created: 2024-01-01 10:00:00
updated: 2024-01-01 10:00:00
---

# Test Content
`;
        testFilePath = path.join(tempDir, 'test-post.md');
        fs.writeFileSync(testFilePath, initialContent);

        // 打开文件
        const document = await vscode.workspace.openTextDocument(testFilePath);
        const editor = await vscode.window.showTextDocument(document);

        // 获取保存前的 updated 值
        const beforeSave = document.getText();
        const updatedLineBefore = beforeSave.split('\n').find(line => line.startsWith('updated:'));
        
        // 做一个小修改触发保存
        await editor.edit(editBuilder => {
            const lastLine = document.lineAt(document.lineCount - 1);
            editBuilder.insert(lastLine.range.end, '\nNew line added');
        });

        // 保存文件
        await document.save();

        // 等待一小段时间让扩展处理
        await new Promise(resolve => setTimeout(resolve, 500));

        // 重新读取文件内容
        const afterSave = fs.readFileSync(testFilePath, 'utf-8');
        const updatedLineAfter = afterSave.split('\n').find(line => line.startsWith('updated:'));

        // 验证 updated 字段已被更新
        assert.ok(updatedLineBefore, 'Should have updated field before save');
        assert.ok(updatedLineAfter, 'Should have updated field after save');
        assert.notStrictEqual(updatedLineBefore, updatedLineAfter, 'Updated field should be changed after save');

        // 验证新的时间戳格式正确 (YYYY-MM-DD HH:mm:ss)
        const timePattern = /updated:\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
        assert.ok(timePattern.test(updatedLineAfter!), 'Updated field should have valid timestamp format');

        // 关闭编辑器
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test("Updated field should not change if line is beyond lineLimit", async () => {
        // 创建一个 updated 在很后面的文件（超过默认 lineLimit 10）
        let content = '---\ntitle: Test\n---\n';
        for (let i = 0; i < 15; i++) {
            content += `Line ${i}\n`;
        }
        content += 'updated: 2024-01-01 10:00:00\n';

        testFilePath = path.join(tempDir, 'test-beyond-limit.md');
        fs.writeFileSync(testFilePath, content);

        const document = await vscode.workspace.openTextDocument(testFilePath);
        const editor = await vscode.window.showTextDocument(document);

        const beforeSave = document.getText();

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(5, 0), 'Modified\n');
        });

        await document.save();
        await new Promise(resolve => setTimeout(resolve, 500));

        const afterSave = fs.readFileSync(testFilePath, 'utf-8');
        
        // updated 在第 18+ 行，超过默认 lineLimit 10，不应该被更新
        const updatedBefore = beforeSave.split('\n').find(line => line.startsWith('updated:'));
        const updatedAfter = afterSave.split('\n').find(line => line.startsWith('updated:'));
        
        assert.strictEqual(updatedBefore, updatedAfter, 'Updated field beyond lineLimit should not change');

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test("Empty updated field should be filled with current time", async () => {
        const initialContent = `---
title: Test Post
updated: 
---
`;
        testFilePath = path.join(tempDir, 'test-empty-updated.md');
        fs.writeFileSync(testFilePath, initialContent);

        const document = await vscode.workspace.openTextDocument(testFilePath);
        const editor = await vscode.window.showTextDocument(document);

        await editor.edit(editBuilder => {
            const lastLine = document.lineAt(document.lineCount - 1);
            editBuilder.insert(lastLine.range.end, '\nContent');
        });

        await document.save();
        await new Promise(resolve => setTimeout(resolve, 500));

        const afterSave = fs.readFileSync(testFilePath, 'utf-8');
        const updatedLine = afterSave.split('\n').find(line => line.startsWith('updated:'));

        // 验证空的 updated 字段被填充了时间
        const timePattern = /updated:\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
        assert.ok(timePattern.test(updatedLine!), 'Empty updated field should be filled with timestamp');

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
});