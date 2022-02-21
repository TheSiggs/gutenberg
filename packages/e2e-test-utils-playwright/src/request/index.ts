/**
 * External dependencies
 */
import fs from 'fs/promises';
import path from 'path';
import { request } from '@playwright/test';
import type { APIRequestContext, Cookie } from '@playwright/test';

/**
 * Internal dependencies
 */
import { WP_ADMIN_USER, WP_BASE_URL } from '../config';
import type { User } from './login';
import { login } from './login';
import { setupRest, rest, getMaxBatchSize, batchRest } from './rest';
import { getPluginsMap, activatePlugin, deactivatePlugin } from './plugins';
import { activateTheme } from './themes';
import { deleteAllBlocks } from './blocks';
import { deleteAllPosts } from './posts';
import { deleteAllWidgets } from './widgets';

interface StorageState {
	cookies: Cookie[];
	nonce: string;
	rootURL: string;
}

class RequestUtils {
	request: APIRequestContext;
	user: User;
	maxBatchSize?: number;
	storageState?: StorageState;
	storageStatePath?: string;
	baseURL?: string;

	pluginsMap: Record< string, string > | null = null;

	static async setup( {
		user = WP_ADMIN_USER,
		storageStatePath,
		baseURL = WP_BASE_URL,
	}: {
		user?: User;
		storageStatePath?: string;
		baseURL?: string;
	} ) {
		let storageState: StorageState | undefined;
		if ( storageStatePath ) {
			await fs.mkdir( path.dirname( storageStatePath ), {
				recursive: true,
			} );

			storageState = JSON.parse(
				await fs.readFile( storageStatePath, 'utf-8' )
			);
		}

		const requestContext = await request.newContext( {
			baseURL,
			storageState: storageState && {
				cookies: storageState.cookies,
				origins: [],
			},
		} );

		const requestUtils = new RequestUtils( user, requestContext, {
			storageState,
			storageStatePath,
			baseURL,
		} );

		if ( ! storageState ) {
			await requestUtils.login();
			await requestUtils.setupRest();
		}

		return requestUtils;
	}

	constructor(
		user: User,
		requestContext: APIRequestContext,
		{
			storageState,
			storageStatePath,
			baseURL,
		}: {
			storageState?: StorageState;
			storageStatePath?: string;
			baseURL?: string;
		} = {}
	) {
		this.user = user;
		this.request = requestContext;
		this.storageStatePath = storageStatePath;
		this.storageState = storageState;
		this.baseURL = baseURL;
	}

	login = login;
	setupRest = setupRest;
	rest = rest;
	getMaxBatchSize = getMaxBatchSize;
	batchRest = batchRest;
	getPluginsMap = getPluginsMap;
	activatePlugin = activatePlugin;
	deactivatePlugin = deactivatePlugin;
	activateTheme = activateTheme;
	deleteAllBlocks = deleteAllBlocks;
	deleteAllPosts = deleteAllPosts;
	deleteAllWidgets = deleteAllWidgets;
}

export type { StorageState };
export { RequestUtils };