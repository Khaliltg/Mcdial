export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16')
];

export const server_loads = [0];

export const dictionary = {
		"/(sidebar)": [8,[3]],
		"/authentication/[slug]": [15],
		"/(sidebar)/crud/products": [9,[3]],
		"/(sidebar)/crud/users": [10,[3]],
		"/(sidebar)/dashboard": [11,[3]],
		"/errors/[code]": [16],
		"/(sidebar)/layouts/sidebar": [12,[3]],
		"/(no-sidebar)/layouts/stacked": [5,[2]],
		"/(no-layout)/pages/pricing": [4],
		"/(no-sidebar)/pages/[slug]": [6,[2]],
		"/(sidebar)/playground/sidebar": [13,[3]],
		"/(no-sidebar)/playground/stacked": [7,[2]],
		"/(sidebar)/settings": [14,[3]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.svelte';