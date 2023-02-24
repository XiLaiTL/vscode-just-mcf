// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JustMCFTaskProvider, TaskItem } from './JustMCFTask';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const rootPath =
		vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders?.map(root=>root.uri.fsPath)
			: [];
	const justMCFTaskProvider = new JustMCFTaskProvider(rootPath)
	
	vscode.commands.registerCommand('justMCFTask.run', async (node: TaskItem) => { await node.runTask(); })
	vscode.commands.registerCommand('justMCFTask.refresh',()=>justMCFTaskProvider.refresh())
	vscode.window.registerTreeDataProvider('justMCFTask',justMCFTaskProvider);

}

// This method is called when your extension is deactivated
export function deactivate() { }




/*
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-just-mcf" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-just-mcf.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Just MCF!');
	});
	context.subscriptions.push(disposable);
 */