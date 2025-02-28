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
	() => import('./nodes/12')
];

export const server_loads = [];

export const dictionary = {
	"/": [2],
	"/dashboard": [5],
	"/liste/afficherlist": [4],
	"/liste/ajouterprospect": [6],
	"/liste/ajouter": [5],
	"/liste/dnc": [7],
	"/liste/prospects": [8],
	"/liste/recherchelist": [9],
	"/users": [6],
	"/users/add": [7],
	"/users/list": [8],
	"/compagnes/add": [3],
	"/compagnes/show": [4]
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
