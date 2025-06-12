import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const processedFiles = new Set<string>();

  function getFormattingOptions(
    doc: vscode.TextDocument
  ): vscode.FormattingOptions {
    const cfg = vscode.workspace.getConfiguration("editor", doc.uri);
    return {
      tabSize: cfg.get<number>("tabSize", 4),
      insertSpaces: cfg.get<boolean>("insertSpaces", true),
    };
  }

  const formatAndSave = async (uri: vscode.Uri) => {
    if (processedFiles.has(uri.fsPath)) {
      return;
    }
    processedFiles.add(uri.fsPath);

    try {
      const document = await vscode.workspace.openTextDocument(uri);

      const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
        "vscode.executeFormatDocumentProvider",
        document.uri,
        getFormattingOptions(document)
      );

      if (edits && edits.length > 0) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, edits);
        await vscode.workspace.applyEdit(workspaceEdit);
        await document.save();
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
