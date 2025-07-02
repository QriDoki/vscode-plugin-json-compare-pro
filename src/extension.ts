// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { sortJsonRecursively } from './sortJson.js';
import { formatJson } from './formatJson.js';

// 存储配置
let diffConfig: any = {};

// 自定义内容提供者
class JsonCompareContentProvider implements vscode.TextDocumentContentProvider {
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	readonly onDidChange = this._onDidChange.event;

	provideTextDocumentContent(uri: vscode.Uri): string {
		// 从 URI 中解析文件路径
		const filePath = uri.query;
		if (!filePath) {
			return 'Error: No file path provided';
		}

		try {
			const content = fs.readFileSync(filePath, 'utf8');
			// 解析 JSON 内容
			const jsonObj = JSON.parse(content);
			
			// 使用 sortJsonRecursively 和 formatJson 处理
			const sortedJson = sortJsonRecursively(jsonObj, diffConfig);
			const formattedJson = formatJson(sortedJson, 2);
			
			return formattedJson;
		} catch (error) {
			return `Error reading or parsing file: ${error}`;
		}
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "json-compare-pro" is now active!');

	// 注册内容提供者
	const provider = new JsonCompareContentProvider();
	const providerRegistration = vscode.workspace.registerTextDocumentContentProvider('json-compare-pro', provider);
	context.subscriptions.push(providerRegistration);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('json-compare-pro.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from json-compare-pro!');
	});

	// 注册比较两个文件的命令
	const compareThisTwoDisposable = vscode.commands.registerCommand('json-compare-pro.compareThisTwo', async (uri: vscode.Uri, uris: vscode.Uri[]) => {
		console.log('compareThisTwo command called');
		console.log('uri:', uri);
		console.log('uris:', uris);
		
		try {
			// 获取选中的文件列表
			const selectedFiles = uris && uris.length > 0 ? uris : (uri ? [uri] : []);
			console.log('selectedFiles:', selectedFiles);
			
			// 检查是否刚好选择了两个文件
			if (selectedFiles.length !== 2) {
				vscode.window.showErrorMessage(`请选择刚好两个 JSON 文件进行比较。当前选择了 ${selectedFiles.length} 个文件。`);
				return;
			}

			// 检查文件是否都是 JSON 文件
			for (const file of selectedFiles) {
				if (!file.fsPath.endsWith('.json')) {
					vscode.window.showErrorMessage('请选择 JSON 文件进行比较');
					return;
				}
			}

			// 弹出输入框让用户输入 diffConfig JSON
			const userInput = await vscode.window.showInputBox({
				prompt: '请输入 diffConfig JSON 配置（可选，留空使用默认配置）',
				placeHolder: '例如: {"arraySortKey": {"$.users[*]": "$.name"}}',
				ignoreFocusOut: true
			});

			// 解析用户输入的配置
			try {
				if (userInput && userInput.trim()) {
					diffConfig = JSON.parse(userInput);
					console.log('使用用户配置:', diffConfig);
				} else {
					diffConfig = {}; // 使用默认配置
					console.log('使用默认配置');
				}
			} catch (parseError) {
				vscode.window.showErrorMessage(`配置 JSON 格式错误: ${parseError}`);
				return;
			}

			const [file1, file2] = selectedFiles;

			// 创建虚拟 URI
			const leftUri = vscode.Uri.parse(`json-compare-pro://left?${file1.fsPath}`);
			const rightUri = vscode.Uri.parse(`json-compare-pro://right?${file2.fsPath}`);

			// 设置差异编辑器标题
			const leftTitle = `${path.basename(file1.fsPath)} (Left)`;
			const rightTitle = `${path.basename(file2.fsPath)} (Right)`;
			const title = `JSON Compare: ${path.basename(file1.fsPath)} ↔ ${path.basename(file2.fsPath)}`;

			// 打开差异编辑器
			await vscode.commands.executeCommand(
				'vscode.diff',
				leftUri,
				rightUri,
				title,
				{
					preview: false,
					viewColumn: vscode.ViewColumn.Active
				}
			);

			const configInfo = Object.keys(diffConfig).length > 0 ? ' (使用自定义配置)' : ' (使用默认配置)';
			vscode.window.showInformationMessage(`正在比较: ${leftTitle} 和 ${rightTitle}${configInfo}`);
			
		} catch (error) {
			vscode.window.showErrorMessage(`比较文件时出错: ${error}`);
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(compareThisTwoDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
