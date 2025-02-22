import type { RequestHandler } from './$types';

let x = 0

export const GET: RequestHandler = () => {
	return new Response(String(x++), { status: 200 });
};