const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('editor-cursor-animation is now active!');

  // get animation.js path
  const animationFilePath = `file://${path.join(context.extensionPath, 'out', 'animation.js')}`;

  // enable cursor animation command
  let enableDisposable = vscode.commands.registerCommand('editor-cursor-animation.enableAnimation', async function () {
    try {
      const config = vscode.workspace.getConfiguration();
      const customCssSettings = config.get('vscode_custom_css.imports') || [];

      // cursor animation isEnabled
      const isEnabled = customCssSettings.some(path =>
        path === animationFilePath ||
        path === animationFilePath.replace('file://', '')
      );

      if (!isEnabled) {
        customCssSettings.push(animationFilePath);
        await config.update('vscode_custom_css.imports', customCssSettings, vscode.ConfigurationTarget.Global);

        // excute Custom CSS and JS Loader command
        await vscode.commands.executeCommand('extension.installCustomCSS');
      } else {
        vscode.window.showInformationMessage('Cursor animation is already enabled.');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to enable cursor animation: ${error.message}`);
    }
  });

  // disable cursor animation command
  let disableDisposable = vscode.commands.registerCommand('editor-cursor-animation.disableAnimation', async function () {
    try {
      const config = vscode.workspace.getConfiguration();
      const customCssSettings = config.get('vscode_custom_css.imports') || [];

      // cursor animation isdisabled
      const isEnabled = customCssSettings.some(path =>
        path === animationFilePath ||
        path === animationFilePath.replace('file://', '')
      );

      if (isEnabled) {
        const newSettings = customCssSettings.filter(path =>
          path !== animationFilePath &&
          path !== animationFilePath.replace('file://', '')
        );
        await config.update('vscode_custom_css.imports', newSettings, vscode.ConfigurationTarget.Global);

        await vscode.commands.executeCommand('extension.installCustomCSS');
      } else {
        vscode.window.showInformationMessage('Cursor animation is already disabled.');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to disable cursor animation: ${error.message}`);
    }
  });

  context.subscriptions.push(enableDisposable);
  context.subscriptions.push(disableDisposable);
}

function deactivate() { }

module.exports = {
  activate,
  deactivate
} 
