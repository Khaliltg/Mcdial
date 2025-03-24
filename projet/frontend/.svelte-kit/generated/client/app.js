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
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'), // Merged Node 22
	() => import('./nodes/23')
];

export const server_loads = [];

export const dictionary = {
	"/": [2],
	"/compagnes/add": [3],
	"/compagnes/detail/[campaign_id]": [4],
	"/compagnes/show": [5],
	"/compagnes/statues": [6], // Merged entry
	"/liste/afficherlist": [7], // Adjusted index
	"/liste/ajouterprospect": [9], // Adjusted index
	"/liste/ajouter": [8],
	"/liste/chargerprospect": [10],
	"/liste/corbeille": [11], // Adjusted index
	"/liste/details/[list_id]": [12], // Adjusted index
	"/liste/dnc": [13], // Adjusted index
	"/liste/fileliste/[id]": [14],
	"/liste/list-details/[list_id]": [15], // Adjusted index
	"/liste/modifier/[id]": [16], // Adjusted index
	"/liste/prospects": [17], // Adjusted index
	"/liste/recherchelist": [18], // Adjusted index
	"/users/add": [19], // Adjusted index
	"/users/copy": [20], // Adjusted index
	"/users/detail": [21], // Adjusted index
	"/users/list": [22], // Adjusted index
	"/users/search": [23], // Adjusted index
	"/users/stats": [24] // Adjusted index
};

export const hooks = {
	handleError: (({ error }) => { console.error(error); }),
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.svelte';