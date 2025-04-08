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
	() => import('./nodes/26'),
	() => import('./nodes/27')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/compagnes/add": [3],
		"/compagnes/copy": [4],
		"/compagnes/detail/[campaign_id]": [5],
		"/compagnes/list_mix/show_list_mix": [6],
		"/compagnes/pause_code": [7],
		"/compagnes/show": [8],
		"/compagnes/statues": [9],
		"/liste/afficherlist": [10],
		"/liste/ajouterprospect": [12],
		"/liste/ajouter": [11],
		"/liste/chargerprospect": [13],
		"/liste/corbeille": [14],
		"/liste/details/[list_id]": [15],
		"/liste/dnc": [16],
		"/liste/fileliste/[id]": [17],
		"/liste/list-details/[list_id]": [18],
		"/liste/modifier/[id]": [19],
		"/liste/prospects": [20],
		"/liste/recherchelist": [21],
		"/users/add": [22],
		"/users/copy": [23],
		"/users/detail": [24],
		"/users/list": [25],
		"/users/search": [26],
		"/users/stats": [27]
	};

export const hooks = {
	handleError: ({ error }) => { console.error(error); },
	reroute: () => {},
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.svelte';