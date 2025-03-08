const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('editor-cursor-animation is now active!');

  // 获取插件内 animation.js 文件的路径，添加 file:// 前缀
  const animationFilePath = `file://${path.join(context.extensionPath, 'src', 'animation.js')}`;

  // 注册启用动画命令
  let enableDisposable = vscode.commands.registerCommand('editor-cursor-animation.enableAnimation', async function () {
    try {
      // 获取 VS Code 设置
      const config = vscode.workspace.getConfiguration();
      const customCssSettings = config.get('vscode_custom_css.imports') || [];

      // 检查动画是否已经启用
      const isEnabled = customCssSettings.some(path =>
        path === animationFilePath ||
        path === animationFilePath.replace('file://', '')
      );

      if (!isEnabled) {
        // 添加动画
        customCssSettings.push(animationFilePath);
        await config.update('vscode_custom_css.imports', customCssSettings, vscode.ConfigurationTarget.Global);

        // 直接执行 Custom CSS and JS Loader 的重新加载命令
        await vscode.commands.executeCommand('extension.installCustomCSS');
      } else {
        vscode.window.showInformationMessage('Cursor animation is already enabled.');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to enable cursor animation: ${error.message}`);
    }
  });

  // 注册禁用动画命令
  let disableDisposable = vscode.commands.registerCommand('editor-cursor-animation.disableAnimation', async function () {
    try {
      // 获取 VS Code 设置
      const config = vscode.workspace.getConfiguration();
      const customCssSettings = config.get('vscode_custom_css.imports') || [];

      // 检查动画是否已经启用
      const isEnabled = customCssSettings.some(path =>
        path === animationFilePath ||
        path === animationFilePath.replace('file://', '')
      );

      if (isEnabled) {
        // 移除动画
        const newSettings = customCssSettings.filter(path =>
          path !== animationFilePath &&
          path !== animationFilePath.replace('file://', '')
        );
        await config.update('vscode_custom_css.imports', newSettings, vscode.ConfigurationTarget.Global);

        // 直接执行 Custom CSS and JS Loader 的重新加载命令
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
