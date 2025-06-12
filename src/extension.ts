import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const processedFiles = new Set<string>();

  const formatAndSave = async (uri: vscode.Uri) => {
    if (processedFiles.has(uri.fsPath)) {
      return;
    }
    processedFiles.add(uri.fsPath);

    try {
      const previouslyVisible = vscode.window.visibleTextEditors.some(
        (editor) => editor.document.uri.fsPath === uri.fsPath
      );

      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document, {
        preview: true,
        preserveFocus: true,
      });

      await vscode.commands.executeCommand("editor.action.formatDocument");
      await document.save();

      if (!previouslyVisible) {
        await vscode.commands.executeCommand(
          "workbench.action.closeActiveEditor"
        );
      }
    } catch (e) {
      console.error(`Auto-format failed for ${uri.fsPath}:`, e);
    } finally {
      processedFiles.delete(uri.fsPath);
    }
  };

  const watcher = vscode.workspace.createFileSystemWatcher("**/*");

  watcher.onDidCreate(formatAndSave);

  watcher.onDidChange((uri) => {
    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.fsPath === uri.fsPath
    );
    if (!document || !document.isDirty) {
      formatAndSave(uri);
    }
  });

  context.subscriptions.push(watcher);
}

export function deactivate() {}
