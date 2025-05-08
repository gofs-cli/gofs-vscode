/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { lookpath } from "lookpath";
import * as vscode from "vscode";
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let clients: Map<string, LanguageClient> = new Map();

export async function activate() {
	if (clients.size > 0) {
		for (const client of clients.values()) {
			await client.stop();
		}
		clients.clear();
	}

	const gofs = await lookpath("gofs");
	if (!gofs) {
		vscode.window.showErrorMessage("cannot find gofs in PATH");
		return;
	}

	// Find all go.mod files in the workspace
	const goModFiles = await vscode.workspace.findFiles('**/go.mod');
	if (goModFiles.length === 0) {
		vscode.window.showErrorMessage("No Go modules found in the workspace.");
		return;
	}

	for (const goModFile of goModFiles) {
		const moduleDir = vscode.Uri.joinPath(goModFile, '..').fsPath;

		const serverOptions: ServerOptions = {
			run: {
				command: gofs,
				transport: TransportKind.stdio,
				args: ["lsp"]
			},
			debug: {
				command: gofs,
				transport: TransportKind.stdio,
				args: ["lsp", "--debug"]
			}
		};

		const clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: 'file', pattern: `${moduleDir}/**/*.{templ,go}` }],
			workspaceFolder: { uri: vscode.Uri.file(moduleDir), name: moduleDir, index: 0 }
		};

		const client = new LanguageClient(
			`gofs-${moduleDir}`,
			`gofs (${moduleDir})`,
			serverOptions,
			clientOptions
		);

		client.start();
		clients.set(moduleDir, client);
	}
}

export function deactivate(): Thenable<void> | undefined {
	const stopPromises = Array.from(clients.values()).map(client => client.stop());
	return Promise.all(stopPromises).then(() => undefined);
}
