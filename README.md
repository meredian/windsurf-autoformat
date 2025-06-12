# Windsurf Auto-Format

This extension automatically formats and saves files that are created or modified by external tools, such as AI agents.

## Features

This extension monitors the workspace for file changes. When a change is detected from an external source, it automatically performs the following actions:

*   **Formats the document**: Uses the default formatter configured for the file type in your workspace.
*   **Saves the document**: Persists the formatted changes to disk.

This ensures that code generated or modified by tools adheres to your project's coding standards without any manual intervention.

## How it Works

The extension uses a `FileSystemWatcher` to listen for file system events. To avoid infinite loops (format -> save -> trigger change -> format), it keeps track of files it is currently processing and ignores subsequent change events for those files until the format/save operation is complete.

It also intelligently handles editor visibility:
*   If a file is modified, it is formatted in the background.
*   If the file was not already open in an editor, it will be briefly opened in preview mode for formatting and then closed automatically, leaving your editor layout undisturbed.

## Requirements

There are no external requirements. The extension uses the formatters already configured in your VS Code workspace.

## Known Issues

There are no known issues at this time.

## Release Notes

### 0.0.1

Initial release.
*   Added automatic formatting and saving for newly created and modified files.
*   Includes a robust test suite to ensure reliability.

