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

let client: LanguageClient;

export async function activate() {
	if (client) {
		await client.stop();
	}

	const lsp = await lookpath("gofs");
	if (!lsp) {
		vscode.window.showErrorMessage("cannot find gofs in PATH");
		return;
	}

	const serverOptions: ServerOptions = {
		run: {
			command:  lsp,
			transport: TransportKind.stdio,
			args: [
				"lsp"
			]
		},
		debug: {
			command: lsp,
			transport: TransportKind.stdio,
			args: [
				"lsp",
			]
		}
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', pattern: '**/*.{templ,go}' }],
	};

	client = new LanguageClient(
		'gofs',
		'gofs',
		serverOptions,
		clientOptions
	);

	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
