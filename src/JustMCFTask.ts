import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface TaskItemObject{
	label: string,
	task: "mcf init" | "mcf build",
	sourcePath?: string,
	targetPath?: string,
}


function initJustMCFTask( workspaceRoot: string) {
	const settingPath = path.join(workspaceRoot, "./.vscode/justmcf-task.json")
	const settingPathFather = path.join(workspaceRoot, "./.vscode")
	if (pathExists(settingPath)) { return }
	if (!pathExists(settingPathFather)) {
		fs.mkdirSync(settingPathFather,{recursive:true})
	}
	const initTask:TaskItemObject[] = [
		{
			label: "Init Project",
			task: "mcf init",
			sourcePath: workspaceRoot
		},
		{
			label: "Build Project",
			task: "mcf build",
			sourcePath: workspaceRoot,
			targetPath: path.join(workspaceRoot,`../${path.basename(workspaceRoot)}_output/`)
		}
	]
	fs.writeFileSync(settingPath,JSON.stringify(initTask,null,"  "),'utf-8')

}
function readJustMCFTask(workspaceRoot: string):TaskItem[] {
	const settingPath = path.join(workspaceRoot, "./.vscode/justmcf-task.json")
	if (!pathExists(settingPath)) { initJustMCFTask(workspaceRoot) }
	const jsonObj = JSON.parse(fs.readFileSync(settingPath, 'utf-8')) as TaskItemObject[];
	const defaultPathObj = {
		sourcePath: workspaceRoot,
		targetPath: path.join(workspaceRoot,`../${path.basename(workspaceRoot)}_output/`)
	}

	
	return jsonObj.map(item => {
		const mixObj = { ...defaultPathObj, ...item }
		let tooltip =""
		switch (mixObj.task) {
			case 'mcf init': tooltip = `${mixObj.label}: 
source: ${mixObj.sourcePath}`; break;
			case 'mcf build': tooltip = `${mixObj.label}: 
source: ${mixObj.sourcePath}
target: ${mixObj.targetPath}`; break;
		}
		
		return new TaskItem(
			mixObj.label,tooltip,mixObj.task,mixObj.sourcePath,mixObj.targetPath,
			vscode.TreeItemCollapsibleState.None
		)
	})
}

export class JustMCFTaskProvider implements vscode.TreeDataProvider<TaskItem> {
	constructor(private workspaceRoots: string[]) {
		for (const workspaceRoot of workspaceRoots) {
			const dataPath = path.join(workspaceRoot, "./data/")
			const packMcmetaPath = path.join(workspaceRoot, "./pack.mcmeta")
			if (pathExists(dataPath) && pathExists(packMcmetaPath)) {
				initJustMCFTask(workspaceRoot)
				vscode.commands.executeCommand('setContext','justMCFTask.show',true)
			}
		}
	}


	private _onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined | void> = new vscode.EventEmitter<TaskItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined | void> = this._onDidChangeTreeData.event;

	refresh() {
		this._onDidChangeTreeData.fire()
	}

	getTreeItem(element: TaskItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TaskItem): Thenable<TaskItem[]> {
		if (this.workspaceRoots.length===0) {
			vscode.window.showInformationMessage('Empty Workspace');
			return Promise.resolve([]);
		}
		if (element) {//child
			return Promise.resolve(readJustMCFTask(element.sourcePath))
		} else {//root
			return Promise.resolve(
				this.workspaceRoots.map(workspaceRoot => {
					return new TaskItem(
						path.basename(workspaceRoot).toUpperCase(),`Project: ${workspaceRoot}`,"workspace",workspaceRoot,"",
						vscode.TreeItemCollapsibleState.Expanded
					)
				})
			)
		}
		return Promise.resolve([]);
	}

}

function pathExists(p: string): boolean {
	try {
		fs.accessSync(p);
	} catch (err) {
		return false;
	}
	return true;
}

export class TaskItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly tooltip: string,
		public readonly description: string,
		public readonly sourcePath: string,
		public readonly targetPath: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.contextValue = description !== "workspace" ? "task" : "workspace"
		this.iconPath = 	description !== "workspace" ?  new vscode.ThemeIcon("tools") : new vscode.ThemeIcon("inbox")
	}

	async runTask() {
		
		const { build, init } = await import('just-mcf');
		switch (this.description) {
			case 'mcf init': {
				await init(this.sourcePath!!).catch(err => {
					console.error(err)
					vscode.window.showErrorMessage(err)
				})
				vscode.window.showInformationMessage(`Initialize Successfully!`, `Check mcf.mcmeta`).then((item) => {
					if (item === "Check mcf.mcmeta") {
						vscode.window.showTextDocument(vscode.Uri.file(`${this.sourcePath}/mcf.mcmeta`))
					}
				})
			} break;
			case 'mcf build': {
				await build(this.sourcePath!!,this.targetPath!!).catch(err => {
					console.error(err)
					vscode.window.showErrorMessage(err)
				})
				vscode.window.showInformationMessage(`Build Successfully! Target Path: ${this.targetPath}`)
			} break;
		}
	}
}