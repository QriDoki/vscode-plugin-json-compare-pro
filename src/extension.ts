// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { preProcess } from './preprocess/preprocess';


// 注意: 内存泄露
let diffConfigs: any = {}

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
			const preProcessed = preProcess(jsonObj, diffConfigs[filePath])
			
			return preProcessed;
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
		console.log('Hello World command executed');
		vscode.window.showInformationMessage('Hello World from json-compare-pro! 123');
	});

	const compareWithConfig = vscode.commands.registerCommand('json-compare-pro.compareWithConfig', async (uri: vscode.Uri) => {
		const configPath = uri.fsPath;
		const configDir = path.dirname(configPath);
		console.log(`配置文件路径: ${configPath}`);
		console.log(`配置文件所在目录: ${configDir}`);
		
		const configContent = fs.readFileSync(configPath, 'utf-8');
		const config = JSON.parse(configContent);

		const { leftFilesPattern, rightFilesPattern, diffConfig = {} } = config;
		console.log(`左侧文件模式 (leftFilesPattern): ${leftFilesPattern}`);
		console.log(`右侧文件模式 (rightFilesPattern): ${rightFilesPattern}`);
		console.log(`比较配置 (diffConfig): ${JSON.stringify(diffConfig)}`);

		if (!leftFilesPattern || !rightFilesPattern) {
			vscode.window.showErrorMessage('leftFilesPattern and rightFilesPattern are required in the config file.');
			return;
		}

		// Find all files recursively in the config directory
		const allFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(configDir, '**/*.json'));
		console.log(`找到的所有 JSON 文件数量: ${allFiles.length}`);
		console.log(`所有找到的 JSON 文件: ${allFiles.map(f => path.relative(configDir, f.fsPath)).join(', ')}`);
		
		const leftFilesPatternRegex = new RegExp(leftFilesPattern);
		console.log(`使用正则表达式: ${leftFilesPatternRegex}`);

		// Filter files based on the provided regex
		const files = allFiles.filter(file => {
			const relativePath = path.relative(configDir, file.fsPath);
			const isMatch = leftFilesPatternRegex.test(relativePath);
			console.log(`测试文件: ${relativePath}, 匹配结果: ${isMatch}`);
			return isMatch;
		});
		console.log(`匹配到的左侧文件数量: ${files.length}`);
		console.log(`匹配到的左侧文件: ${files.map(f => path.relative(configDir, f.fsPath)).join(', ')}`);

		for (const file of files) {
			const leftPath = file.fsPath;
			const leftRelativePath = path.relative(configDir, leftPath);
			console.log(`处理左侧文件: ${leftRelativePath}`);
			
			const regex = new RegExp(leftFilesPattern);
			const match = leftRelativePath.match(regex);
			console.log(`正则匹配结果: ${JSON.stringify(match)}`);

			if (match) {
				let rightRelativePath = rightFilesPattern;
				console.log(`替换前的右侧路径模式: ${rightRelativePath}`);
				for (let i = 1; i < match.length; i++) {
					console.log(`替换 $${i} 为 ${match[i]}`);
					rightRelativePath = rightRelativePath.replace(`$${i}`, match[i]);
				}
				console.log(`替换后的右侧相对路径: ${rightRelativePath}`);
				const rightPath = path.resolve(configDir, rightRelativePath);
				console.log(`右侧文件绝对路径: ${rightPath}`);

				if (fs.existsSync(rightPath)) {
					compare([vscode.Uri.file(leftPath), vscode.Uri.file(rightPath)], diffConfig);
				} else {
					console.log(`右侧文件不存在: ${rightPath}`);
				}
			} else {
				console.log(`文件 ${leftRelativePath} 匹配成功，但无法提取分组。`);
			}
		}
		
		if (files.length === 0) {
			console.log(`警告: 没有找到符合 ${leftFilesPattern} 的文件。`);
		}
	});

	let compare = async (selectedFiles: vscode.Uri[], diffConfig: {}) =>{
		try {
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

			const [file1, file2] = selectedFiles;
			
			diffConfigs[file1.fsPath] = diffConfig;
			diffConfigs[file2.fsPath] = diffConfig;
			
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
		
	}
	let compareFromSelectedTwoFile = async (uri: vscode.Uri, uris: vscode.Uri[]) => {
		console.log('compareThisTwo command called');
		console.log('uri:', uri);
		console.log('uris:', uris);
		
		try {
			// 获取选中的文件列表
			const selectedFiles = uris && uris.length > 0 ? uris : (uri ? [uri] : []);
			console.log('selectedFiles:', selectedFiles);
			

			// 弹出输入框让用户输入 diffConfig JSON
			const userInput = await vscode.window.showInputBox({
				prompt: '请输入 diffConfig JSON 配置（可选，留空使用默认配置）',
				placeHolder: '例如: {"arraySortKey": {"$.users[*]": "$.name"}}',
				ignoreFocusOut: true
			});

			// 解析用户输入的配置
			let diffConfig: any = {}
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
			compare(selectedFiles, diffConfig);
		} catch (error) {
			vscode.window.showErrorMessage(`比较文件时出错: ${error}`);
		}
	}

	// 注册比较两个文件的命令
	const compareThisTwoDisposable = vscode.commands.registerCommand('json-compare-pro.compareThisTwo', compareFromSelectedTwoFile);

	context.subscriptions.push(disposable, compareWithConfig);
}

// This method is called when your extension is deactivated
export function deactivate() {}
