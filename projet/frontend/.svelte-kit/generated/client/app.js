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
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/compagnes/add": [3],
		"/compagnes/detail/[campaign_id]": [4],
		"/compagnes/show": [5],
		"/compagnes/statues": [6],
		"/liste/Filedata": [15],
		"/liste/afficherlist": [7],
		"/liste/ajouterListe": [9],
		"/liste/ajouterprospect": [10],
		"/liste/ajouter": [8],
		"/liste/chargerprospect": [11],
		"/liste/corbeille": [12],
		"/liste/details/[list_id]": [13],
		"/liste/dnc": [14],
		"/liste/fileliste/[id]": [16],
		"/liste/list-details/[list_id]": [17],
		"/liste/modifier/[id]": [18],
		"/liste/prospects": [19],
		"/liste/recherchelist": [20],
		"/users/add": [21],
		"/users/copy": [22],
		"/users/detail": [23],
		"/users/list": [24],
		"/users/search": [25],
		"/users/stats": [26]
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