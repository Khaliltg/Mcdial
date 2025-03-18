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
	() => import('./nodes/21')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/compagnes/add": [3],
		"/compagnes/detail/[campaign_id]": [4],
		"/compagnes/show": [5],
		"/liste/afficherlist": [6],
		"/liste/ajouterprospect": [8],
		"/liste/ajouter": [7],
		"/liste/corbeille": [9],
		"/liste/details/[list_id]": [10],
		"/liste/dnc": [11],
		"/liste/list-details/[list_id]": [12],
		"/liste/modifier/[id]": [13],
		"/liste/prospects": [14],
		"/liste/recherchelist": [15],
		"/users/add": [16],
		"/users/copy": [17],
		"/users/detail": [18],
		"/users/list": [19],
		"/users/search": [20],
		"/users/stats": [21]
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