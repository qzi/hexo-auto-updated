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
        // Create test file with updated field
        const initialContent = `---
title: Test Post
created: 2024-01-01 10:00:00
updated: 2024-01-01 10:00:00
---

# Test Content
`;
        testFilePath = path.join(tempDir, 'test-post.md');
        fs.writeFileSync(testFilePath, initialContent);

        // Open file
        const document = await vscode.workspace.openTextDocument(testFilePath);
        const editor = await vscode.window.showTextDocument(document);

        // Get updated value before save
        const beforeSave = document.getText();
        const updatedLineBefore = beforeSave.split('\n').find(line => line.startsWith('updated:'));
        
        // Make a small edit to trigger save
        await editor.edit(editBuilder => {
            const lastLine = document.lineAt(document.lineCount - 1);
            editBuilder.insert(lastLine.range.end, '\nNew line added');
        });

        // Save file
        await document.save();

        // Wait for extension to process
        await new Promise(resolve => setTimeout(resolve, 500));

        // Re-read file content
        const afterSave = fs.readFileSync(testFilePath, 'utf-8');
        const updatedLineAfter = afterSave.split('\n').find(line => line.startsWith('updated:'));

        // Verify updated field has been updated
        assert.ok(updatedLineBefore, 'Should have updated field before save');
        assert.ok(updatedLineAfter, 'Should have updated field after save');
        assert.notStrictEqual(updatedLineBefore, updatedLineAfter, 'Updated field should be changed after save');

        // Verify new timestamp format is correct (YYYY-MM-DD HH:mm:ss)
        const timePattern = /updated:\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
        assert.ok(timePattern.test(updatedLineAfter!), 'Updated field should have valid timestamp format');

        // Close editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test("Updated field should not change if line is beyond lineLimit", async () => {
        // Create a file with updated field far down (beyond default lineLimit 10)
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
        
        // updated is at line 18+, beyond default lineLimit 10, should not be updated
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

        // Verify empty updated field is filled with timestamp
        const timePattern = /updated:\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
        assert.ok(timePattern.test(updatedLine!), 'Empty updated field should be filled with timestamp');

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
});
