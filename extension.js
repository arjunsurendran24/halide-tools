// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const exec = require('child_process').execSync;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "halide-tools" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableGenerateCommand = vscode.commands.registerCommand('halide-tools.createHalideGeneratorBoilerPlate', function () {
		// The code you place here will be executed every time your command is executed

		if(vscode.window.activeTextEditor) {
			const fileName = vscode.window.activeTextEditor.document.uri.fsPath;
			let generatorNameLineNumber = vscode.window.activeTextEditor.selection.active.line;
			let generatorName = vscode.window.activeTextEditor.document.lineAt(generatorNameLineNumber);
			var boilerPlate = createGeneratorBoilerPlate(generatorName.text);
			fs.writeFileSync(fileName, boilerPlate, err => {
				if(err) {
					console.error(err);
					return vscode.window.showErrorMessage("Failed to create files");
				}
			}, err => {
				if(err) {
					console.error(err);
					return vscode.window.showErrorMessage(err.error);
				}
			});
			vscode.window.showInformationMessage("Boilerplate created");	
		} else {
			const currentWorkSpace = vscode.workspace.workspaceFolders;

			if(currentWorkSpace == undefined) {
				throw Error("Workspace not defined");
			}

			const folderPath = currentWorkSpace[0].uri.path;
			let generatorName = `GeneratorName`; 
			var boilerPlate = createGeneratorBoilerPlate(generatorName);
			fs.writeFile(path.join(folderPath, "generator.cpp"), boilerPlate, err => {
				if(err) {
					console.error(err);
					return vscode.window.showErrorMessage("Failed to create files");
				}
			}, err => {
				if(err) {
					console.error(err);
					return vscode.window.showErrorMessage(err.error);
				}
			});
			vscode.window.showInformationMessage("Boilerplate created");
		}
	});

	context.subscriptions.push(disposableGenerateCommand);

	let disposableCompileGenerator = vscode.commands.registerCommand('halide-tools.compileGenerator', function () {

		const userConfiguration = vscode.workspace.getConfiguration('halide-tools');
		const compiler = userConfiguration.compilerPath;
		const cppVersion = `-std=` + userConfiguration.cppStandard;
		const noRTTI = `-fno-rtti`;
		const halideInstallDirectory = userConfiguration.halideInstallationPath;
		const generatorGenerator = halideInstallDirectory + `/share/tools/GenGen.cpp`;
		const linkerDirectories = `-L` + halideInstallDirectory + `/lib`;
		const includeDirectories = `-I` + halideInstallDirectory + `/include`;
		const halideLibrary = `-lHalide`;
		const threadLibrary = `-lpthread`;
		const dlLibrary = `-ldl`;
		

		const currentWorkSpace = vscode.workspace.workspaceFolders;

		if(currentWorkSpace == undefined) {
			throw Error("Workspace not defined");
		}

		let generatorFile = "";
		let generatedLibrary = `-ogenerator`;
		const folderPath = currentWorkSpace[0].uri.path;
		if(vscode.window.activeTextEditor) {
			generatorFile = vscode.window.activeTextEditor.document.uri.fsPath;
			generatedLibrary = `-o` + path.basename(generatorFile, '.cpp') + `_generator`;
		} else {
			generatorFile = path.join(folderPath, "generator.cpp");
		}

		vscode.window.showInformationMessage("Compilation Successful");

		let binaryDirectory = userConfiguration.binaryPath == "Same as workspace directory" ? folderPath : userConfiguration.binaryPath;

		process.chdir(binaryDirectory);

		const ls = spawn(compiler, [generatorFile, generatorGenerator, cppVersion, noRTTI, includeDirectories, linkerDirectories, halideLibrary, threadLibrary, dlLibrary, generatedLibrary]);

		ls.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
		});

		ls.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
		});

		ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
		});
	});

	context.subscriptions.push(disposableCompileGenerator);

	let disposableStaticLibraryGenerator = vscode.commands.registerCommand('halide-tools.generateStaticLibrary', function () {
	});

	context.subscriptions.push(disposableStaticLibraryGenerator);

	let disposableScheduleGenerator = vscode.commands.registerCommand('halide-tools.generateSchedule', function () {
	});

	context.subscriptions.push(disposableScheduleGenerator);

	let disposableAutoScheduleInfo = vscode.commands.registerCommand('halide-tools.getAvailableAutoSchedulers', function () {
	});

	context.subscriptions.push(disposableAutoScheduleInfo);

	let disposableWebViewer = vscode.commands.registerCommand('halide-tools.startVisualDebugging', function () {

		const panel = vscode.window.createWebviewPanel(
			'visualDebugger', // Identifies the type of the webview. Used internally
			'VisualDebugger', // Title of the panel displayed to the user
			vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
			{} // Webview options. More on these later.
		  );

		  panel.webview.html = getWebviewContent();

		  panel.onDidDispose(
			() => {
			  // When the panel is closed, cancel any future updates to the webview content
			},
			null,
			context.subscriptions
		  );
	});

	context.subscriptions.push(disposableWebViewer);

	let disposableLoweredStatementViewer = vscode.commands.registerCommand('halide-tools.getLoweredStatement', function () {

		const userConfiguration = vscode.workspace.getConfiguration('halide-tools');
		const compiler = userConfiguration.compilerPath;
		const getMoreDebugInfo = `-g`;
		const cppVersion = `-std=` + userConfiguration.cppStandard;
		const noRTTI = `-fno-rtti`;
		const halideInstallDirectory = userConfiguration.halideInstallationPath;
		const linkerDirectories = `-L` + halideInstallDirectory + `/lib`;
		const includeDirectories = `-I` + halideInstallDirectory + `/include`;
		const halideLibrary = `-lHalide`;
		const threadLibrary = `-lpthread`;
		const dlLibrary = `-ldl`;
		const output = `-odebugObj`;
		const codeGenLevel = userConfiguration.debugCodeGenLevel;

		let fileName = "";
		if(vscode.window.activeTextEditor) {
			fileName = vscode.window.activeTextEditor.document.uri.fsPath;
			let debuggerCopyOfFile = "__halide_debugger_copy.cpp"
			fs.copyFileSync(fileName, debuggerCopyOfFile);
			let activeLineNumber = vscode.window.activeTextEditor.selection.active.line;
			let activeLine = vscode.window.activeTextEditor.document.lineAt(activeLineNumber).text.split(' ');
			let funcName = "";
			for(item of activeLine) {
				if(item.includes('realize')) {
					funcName = item.split('.')[0];
				}
			}


			var data = fs.readFileSync(debuggerCopyOfFile).toString().split("\n");
			data.splice(activeLineNumber + 1, 0, funcName + `.compile_to_lowered_stmt("` + funcName + `.html", {}, HTML);`);
			var text = data.join("\n");

			fs.writeFileSync(debuggerCopyOfFile, text, function (err) {
			if (err) return console.log(err);
			});

			process.env.HL_DEBUG_CODEGEN = 2;
			let compilerArguments = [debuggerCopyOfFile, getMoreDebugInfo, cppVersion, noRTTI, includeDirectories, linkerDirectories, halideLibrary, threadLibrary, dlLibrary, output];

			let compileCommand = compiler + " " + compilerArguments.join(' ');

			const compileProcess = exec(compileCommand);

			console.log(compileProcess.toString("utf-8"));

			let libraryPath = "LD_LIBRARY_PATH=" + halideInstallDirectory + `/lib`

			try {
				fs.unlinkSync(funcName + ".html");
			} catch(err) {
				console.log(err)
			}

			try {
				fs.unlinkSync("__debugout.txt");
			} catch(err) {
				console.log(err)
			}

			try {
				fs.unlinkSync("_debugerr.txt");
			} catch(err) {
				console.log(err)
			}

			const runProcess = exec("export HL_DEBUG_CODEGEN=" + codeGenLevel.toString() + " && " + libraryPath + " ./debugObj > __debugout.txt 2> _debugerr.txt");

			console.log(runProcess.toString("utf-8"));

			const panel = vscode.window.createWebviewPanel(
				'visualDebugger', // Identifies the type of the webview. Used internally
				'Lowered Statement', // Title of the panel displayed to the user
				vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
				{} // Webview options. More on these later.
			  );
	
			  panel.webview.html = fs.readFileSync("./" + funcName + ".html").toString();
	
			  panel.onDidDispose(
				() => {
				  // When the panel is closed, cancel any future updates to the webview content
				},
				null,
				context.subscriptions
			  );


			console.log(funcName);
		} else {
			vscode.window.showErrorMessage("No active files");
		}
	});

	context.subscriptions.push(disposableLoweredStatementViewer);

	let disposablePsuedoCodeViewer = vscode.commands.registerCommand('halide-tools.getPsuedoCode', function () {

		const userConfiguration = vscode.workspace.getConfiguration('halide-tools');
		const compiler = userConfiguration.compilerPath;
		const getMoreDebugInfo = `-g`;
		const cppVersion = `-std=` + userConfiguration.cppStandard;
		const noRTTI = `-fno-rtti`;
		const halideInstallDirectory = userConfiguration.halideInstallationPath;
		const linkerDirectories = `-L` + halideInstallDirectory + `/lib`;
		const includeDirectories = `-I` + halideInstallDirectory + `/include`;
		const halideLibrary = `-lHalide`;
		const threadLibrary = `-lpthread`;
		const dlLibrary = `-ldl`;
		const output = `-odebugObj`;

		let fileName = "";
		if(vscode.window.activeTextEditor) {
			fileName = vscode.window.activeTextEditor.document.uri.fsPath;
			let debuggerCopyOfFile = "__halide_debugger_copy.cpp"
			fs.copyFileSync(fileName, debuggerCopyOfFile);
			let activeLineNumber = vscode.window.activeTextEditor.selection.active.line;
			let activeLine = vscode.window.activeTextEditor.document.lineAt(activeLineNumber).text.split(' ');
			let funcName = "";
			for(item of activeLine) {
				if(item.includes('realize')) {
					funcName = item.split('.')[0];
				}
			}


			var data = fs.readFileSync(debuggerCopyOfFile).toString().split("\n");
			data.splice(activeLineNumber + 1, 0, funcName + `.print_loop_nest();`);
			var text = data.join("\n");

			fs.writeFileSync(debuggerCopyOfFile, text, function (err) {
			if (err) return console.log(err);
			});

			try {
				fs.unlinkSync("./debugObj");
			} catch(err) {
				console.log(err)
			}

			let compilerArguments = [debuggerCopyOfFile, getMoreDebugInfo, cppVersion, noRTTI, includeDirectories, linkerDirectories, halideLibrary, threadLibrary, dlLibrary, output];

			let compileCommand = compiler + " " + compilerArguments.join(' ');

			const compileProcess = exec(compileCommand);

			console.log(compileProcess.toString("utf-8"));

			let libraryPath = "LD_LIBRARY_PATH=" + halideInstallDirectory + `/lib`

			try {
				fs.unlinkSync("__debugout.txt");
			} catch(err) {
				console.log(err)
			}

			try {
				fs.unlinkSync("_debugerr.txt");
			} catch(err) {
				console.log(err)
			}

			const runProcess = exec("export HL_DEBUG_CODEGEN=0 && " + libraryPath + " ./debugObj > __debugout.txt 2> _debugerr.txt");

			const panel = vscode.window.createWebviewPanel(
				'visualDebugger', // Identifies the type of the webview. Used internally
				'Psuedo Code', // Title of the panel displayed to the user
				vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
				{} // Webview options. More on these later.
			  );
	
			 const psuedoCode = fs.readFileSync("_debugerr.txt").toString();
			  panel.webview.html = getWebviewContentFromString(psuedoCode);
	
			  panel.onDidDispose(
				() => {
				  // When the panel is closed, cancel any future updates to the webview content
				},
				null,
				context.subscriptions
			  );


			console.log(funcName);
		} else {
			vscode.window.showErrorMessage("No active files");
		}
	});

	context.subscriptions.push(disposablePsuedoCodeViewer);

	let disposableCompileToFile = vscode.commands.registerCommand('halide-tools.compileToFile', function () {

		const userConfiguration = vscode.workspace.getConfiguration('halide-tools');
		const compiler = userConfiguration.compilerPath;
		const getMoreDebugInfo = `-g`;
		const cppVersion = `-std=` + userConfiguration.cppStandard;
		const noRTTI = `-fno-rtti`;
		const halideInstallDirectory = userConfiguration.halideInstallationPath;
		const linkerDirectories = `-L` + halideInstallDirectory + `/lib`;
		const includeDirectories = `-I` + halideInstallDirectory + `/include`;
		const halideLibrary = `-lHalide`;
		const threadLibrary = `-lpthread`;
		const dlLibrary = `-ldl`;
		const output = `-odebugObj`;

		let fileName = "";
		if(vscode.window.activeTextEditor) {
			fileName = vscode.window.activeTextEditor.document.uri.fsPath;
			let debuggerCopyOfFile = "__halide_debugger_copy.cpp"
			fs.copyFileSync(fileName, debuggerCopyOfFile);
			let selection = vscode.window.activeTextEditor.selection.start;
			let wordRange = vscode.window.activeTextEditor.document.getWordRangeAtPosition(selection);
			let funcName = vscode.window.activeTextEditor.document.getText(wordRange);
			let activeLineNumber = vscode.window.activeTextEditor.selection.active.line;
			let fileContents = fs.readFileSync(debuggerCopyOfFile).toString();
			let data = fileContents.split('\n');
			let tokens = []
			for(var i = 0; i<data.length; i++) {
				let splitted = data[i].split(" ");
				for(var split_val of splitted) {
					if(split_val.length != 0) {
						tokens.push(split_val);
					}
				}
			}
			let args = [];
			let nextIsParam = false;
			for(var i = 0; i < tokens.length; i++) {
				var item = tokens[i];
				if(item.includes("Param")) {
					nextIsParam = true;
					continue;
				}
				if(nextIsParam) {
					nextIsParam = false;
					let argumentValue = item.split(";")[0].split("(")[0];
					args.push(argumentValue);
				}
				if(item.includes(funcName) && args.length > 0) {
					break;
				}
			}

			console.log(args);

			data.splice(activeLineNumber + 1, 0, `std::vector<Argument> args(` + args.length.toString() + `);`);
			for(var i = 0; i < args.length; i++) {
				data.splice(activeLineNumber + 1 + i + 1, 0, `args[` + i.toString() +`] = ` + args[i] + `;`);
			}

			const targetOS = userConfiguration.targetOS;
			if(targetOS != "host") {
				data.splice(activeLineNumber + 1 + args.length + 1, 0, `Target target;`);
				data.splice(activeLineNumber + 1 + args.length + 2, 0, `target.os = Target::` + targetOS +`;`);
				data.splice(activeLineNumber + 1 + args.length + 3, 0, `target.arch = Target::` + userConfiguration.targetArch +`;`);
				data.splice(activeLineNumber + 1 + args.length + 4, 0, `target.bits = ` + userConfiguration.targetBits.toString() +`;`);
				data.splice(activeLineNumber + 1 + args.length + 5, 0, `std::vector<Target::Feature> features;`);
				let j = 1;
				if(userConfiguration.targetFeatures.length != 0) {
					for(var feature of userConfiguration.targetFeatures) {
						data.splice(activeLineNumber + 1 + args.length + 5 + j, 0, `features.push_back(Target::` + feature + `);`);
						j++;
					}
				}
				data.splice(activeLineNumber + 1 + args.length + 5 + j + 1, 0, `target.set_features(features);`);
				data.splice(activeLineNumber + 1 + args.length + 5 + j + 2, 0, funcName + `.compile_to_file("lib` + funcName +`", args, "` + funcName  + `", target);`);
			} else {
				data.splice(activeLineNumber + 1 + args.length + 1, 0, funcName + `.compile_to_file("lib` + funcName +`", args, "` + funcName  + `");`);
			}

			var text = data.join("\n");

			fs.writeFileSync(debuggerCopyOfFile, text, function (err) {
			if (err) return console.log(err);
			});

			let compilerArguments = [debuggerCopyOfFile, getMoreDebugInfo, cppVersion, noRTTI, includeDirectories, linkerDirectories, halideLibrary, threadLibrary, dlLibrary, output];

			let compileCommand = compiler + " " + compilerArguments.join(' ');

			

			const compileProcess = exec(compileCommand);

			console.log(compileProcess.toString("utf-8"));

			let libraryPath = "LD_LIBRARY_PATH=" + halideInstallDirectory + `/lib`

			const runProcess = exec(libraryPath + " ./debugObj");

			const folderPath = path.dirname(fileName);
			const srcHeader = `lib` + funcName + ".h";
			const srcObjectFile = `lib` + funcName + (userConfiguration.targetOS == "Windows" ? ".obj" : ".o");
			const destHeader = folderPath + `/lib` + funcName + ".h";
			const destObjectFile = folderPath + `/lib` + (funcName + userConfiguration.targetOS == "Windows" ? ".obj" : ".o");

			fs.copyFileSync(srcHeader, destHeader);
			fs.copyFileSync(srcObjectFile, destObjectFile);
		} else {
			vscode.window.showErrorMessage("No active files");
		}
	});

	context.subscriptions.push(disposableCompileToFile);

	let disposableCompileToStaticLib = vscode.commands.registerCommand('halide-tools.compileToStaticLibrary', function () {

		const userConfiguration = vscode.workspace.getConfiguration('halide-tools');
		const compiler = userConfiguration.compilerPath;
		const getMoreDebugInfo = `-g`;
		const cppVersion = `-std=` + userConfiguration.cppStandard;
		const noRTTI = `-fno-rtti`;
		const halideInstallDirectory = userConfiguration.halideInstallationPath;
		const linkerDirectories = `-L` + halideInstallDirectory + `/lib`;
		const includeDirectories = `-I` + halideInstallDirectory + `/include`;
		const halideLibrary = `-lHalide`;
		const threadLibrary = `-lpthread`;
		const dlLibrary = `-ldl`;
		const output = `-odebugObj`;

		let fileName = "";
		if(vscode.window.activeTextEditor) {
			fileName = vscode.window.activeTextEditor.document.uri.fsPath;
			let debuggerCopyOfFile = "__halide_debugger_copy.cpp"
			fs.copyFileSync(fileName, debuggerCopyOfFile);
			let selection = vscode.window.activeTextEditor.selection.start;
			let wordRange = vscode.window.activeTextEditor.document.getWordRangeAtPosition(selection);
			let funcName = vscode.window.activeTextEditor.document.getText(wordRange);
			let activeLineNumber = vscode.window.activeTextEditor.selection.active.line;
			let fileContents = fs.readFileSync(debuggerCopyOfFile).toString();
			let data = fileContents.split('\n');
			let tokens = []
			for(var i = 0; i<data.length; i++) {
				let splitted = data[i].split(" ");
				for(var split_val of splitted) {
					if(split_val.length != 0) {
						tokens.push(split_val);
					}
				}
			}
			let args = [];
			let nextIsParam = false;
			for(var i = 0; i < tokens.length; i++) {
				var item = tokens[i];
				if(item.includes("Param")) {
					nextIsParam = true;
					continue;
				}
				if(nextIsParam) {
					nextIsParam = false;
					let argumentValue = item.split(";")[0].split("(")[0];
					args.push(argumentValue);
				}
				if(item.includes(funcName) && args.length > 0) {
					break;
				}
			}

			console.log(args);

			data.splice(activeLineNumber + 1, 0, `std::vector<Argument> args(` + args.length.toString() + `);`);
			for(var i = 0; i < args.length; i++) {
				data.splice(activeLineNumber + 1 + i + 1, 0, `args[` + i.toString() +`] = ` + args[i] + `;`);
			}

			const targetOS = userConfiguration.targetOS;
			if(targetOS != "host") {
				data.splice(activeLineNumber + 1 + args.length + 1, 0, `Target target;`);
				data.splice(activeLineNumber + 1 + args.length + 2, 0, `target.os = Target::` + targetOS +`;`);
				data.splice(activeLineNumber + 1 + args.length + 3, 0, `target.arch = Target::` + userConfiguration.targetArch +`;`);
				data.splice(activeLineNumber + 1 + args.length + 4, 0, `target.bits = ` + userConfiguration.targetBits.toString() +`;`);
				data.splice(activeLineNumber + 1 + args.length + 5, 0, `std::vector<Target::Feature> features;`);
				let j = 1;
				if(userConfiguration.targetFeatures.length != 0) {
					for(var feature of userConfiguration.targetFeatures) {
						data.splice(activeLineNumber + 1 + args.length + 5 + j, 0, `features.push_back(Target::` + feature + `);`);
						j++;
					}
				}
				data.splice(activeLineNumber + 1 + args.length + 5 + j + 1, 0, `target.set_features(features);`);
				data.splice(activeLineNumber + 1 + args.length + 5 + j + 2, 0, funcName + `.compile_to_static_library("lib` + funcName +`", args, "` + funcName  + `", target);`);
			} else {
				data.splice(activeLineNumber + 1 + args.length + 1, 0, funcName + `.compile_to_static_library("lib` + funcName +`", args, "` + funcName  + `");`);
			}

			var text = data.join("\n");

			fs.writeFileSync(debuggerCopyOfFile, text, function (err) {
			if (err) return console.log(err);
			});

			let compilerArguments = [debuggerCopyOfFile, getMoreDebugInfo, cppVersion, noRTTI, includeDirectories, linkerDirectories, halideLibrary, threadLibrary, dlLibrary, output];

			let compileCommand = compiler + " " + compilerArguments.join(' ');

			try {
				fs.unlinkSync("./debugObj");
			} catch(err) {
				console.log(err)
			}

			const compileProcess = exec(compileCommand);

			console.log(compileProcess.toString("utf-8"));

			let libraryPath = "LD_LIBRARY_PATH=" + halideInstallDirectory + `/lib`

			const runProcess = exec(libraryPath + " ./debugObj");

			const folderPath = path.dirname(fileName);
			const srcHeader = `lib` + funcName + ".h";
			const srcObjectFile = `lib` + funcName + (userConfiguration.targetOS == "Windows" ? ".lib" : ".a");
			const destHeader = folderPath + `/lib` + funcName + ".h";
			const destObjectFile = folderPath + `/lib` + funcName + (userConfiguration.targetOS == "Windows" ? ".lib" : ".a");

			fs.copyFileSync(srcHeader, destHeader);
			fs.copyFileSync(srcObjectFile, destObjectFile);

		} else {
			vscode.window.showErrorMessage("No active files");
		}
	});

	context.subscriptions.push(disposableCompileToStaticLib);

	
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function createGeneratorBoilerPlate(generatorName) {
	let generatorBoilerPlate = `#include "Halide.h"
			
using namespace Halide;

class `+ generatorName + ` : public Halide::Generator<` + generatorName + `> {
public:
	void generate() {
	}

	void schedule() {
		if (auto_schedule) {

		} else {

		}
	}

};

HALIDE_REGISTER_GENERATOR(` + generatorName + `, ` + generatorName.toLowerCase() +`_generator);`;

	return generatorBoilerPlate;

}

function getWebviewContent() {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	  <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
  </body>
  </html>`;
  }

  function getWebviewContentFromString(paragraph) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body><pre>` +
	  paragraph +
  `</pre></body>
  </html>`;
  }

module.exports = {
	activate,
	deactivate
}
