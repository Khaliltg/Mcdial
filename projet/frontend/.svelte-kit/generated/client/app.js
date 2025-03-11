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
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/compagnes/add": [3],
		"/compagnes/show": [4],
		"/dashboard": [5],
		"/liste/afficherlist": [6],
		"/liste/ajouterprospect": [8],
		"/liste/ajouter": [7],
		"/liste/dnc": [9],
		"/liste/list-details/[list_id]": [10],
		"/liste/prospects": [11],
		"/liste/recherchelist": [12],
		"/users/add": [13],
		"/users/copy": [14],
		"/users/detail": [15],
		"/users/list": [16],
		"/users/search": [17],
		"/users/stats": [18]
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