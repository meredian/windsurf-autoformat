import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Helper function to poll for file content changes
const waitForFileContent = (
  filePath: string,
  expectedContent: string,
  timeout: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const interval = 500; // Check every 500ms
    const endTime = Date.now() + timeout;

    const checkFile = () => {
      if (!fs.existsSync(filePath)) {
        if (Date.now() > endTime) {
          return reject(
            new Error(`Timeout waiting for file creation: ${filePath}`)
          );
        }
        setTimeout(checkFile, interval);
        return;
      }

      const actualContent = fs.readFileSync(filePath, "utf-8");
      if (actualContent === expectedContent) {
        return resolve();
      }

      if (Date.now() > endTime) {
        return reject(
          new Error(
            `File content did not match expected content within ${timeout}ms.\nExpected: "${expectedContent}"\nActual: "${actualContent}"`
          )
        );
      }

      setTimeout(checkFile, interval);
    };
    checkFile();
  });
};

suite("Extension Test Suite", function () {
  this.timeout(20000); // Generous timeout for the whole suite

  suiteSetup(async function () {
    // Ensure the TS language server is warmed up by opening a TS file.
    // This is crucial for making sure the formatter is ready.
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      assert.fail("No workspace folder open for setup");
    }
    const workspaceFolder = workspaceFolders[0].uri.fsPath;
    const dummyFilePath = path.join(workspaceFolder, "dummy.ts");
    if (!fs.existsSync(dummyFilePath)) {
      fs.writeFileSync(dummyFilePath, 'console.log("warmup");');
    }
    const doc = await vscode.workspace.openTextDocument(dummyFilePath);
    await vscode.window.showTextDocument(doc);

    // Give it a moment to fully activate after opening the document
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  test("Should format a new file on creation", async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      assert.fail("No workspace folder open");
    }
    const workspaceFolder = workspaceFolders[0].uri.fsPath;
    const testFilePath = path.join(workspaceFolder, "test.ts");

    // Ensure file doesn't exist before test
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    const unformattedContent = "const x = 1"; // No semicolon
    const expectedFormattedContent = "const x = 1;"; // Semicolon added by formatter

    try {
      // Create the file, which should trigger the extension
      fs.writeFileSync(testFilePath, unformattedContent, "utf-8");

      // Poll for the formatted content, giving the extension time to act
      await waitForFileContent(testFilePath, expectedFormattedContent, 10000);

      // Final check to be certain
      const finalContent = fs.readFileSync(testFilePath, "utf-8");
      assert.strictEqual(
        finalContent,
        expectedFormattedContent,
        "File content was not formatted as expected."
      );
    } catch (error: any) {
      assert.fail(error.message);
    } finally {
      // Cleanup the test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  suiteTeardown(() => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const workspaceFolder = workspaceFolders[0].uri.fsPath;
      const dummyFilePath = path.join(workspaceFolder, "dummy.ts");
      if (fs.existsSync(dummyFilePath)) {
        fs.unlinkSync(dummyFilePath);
      }
    }
  });
});
