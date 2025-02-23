import type { ServerState } from '$lib/types';

/**
 * Server state that is initialized on start.
 */
let serverState: ServerState | undefined;

/**
 * Returns the server state.
 */
export function getServerState(): ServerState {
	if (serverState === undefined) {
		throw new Error('Server state has not been initialized');
	}
	return serverState;
}

/**
 * Sets the server state. Should only be called once by the server during initialization.
 */
export function setServerState(state: ServerState) {
	serverState = state;
}
