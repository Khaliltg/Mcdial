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
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32')
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
		"/liste/Filedata": [10],
		"/liste/afficherlist": [11],
		"/liste/ajouterListe": [13],
		"/liste/ajouterprospect": [14],
		"/liste/ajouter": [12],
		"/liste/chargerprospect": [15],
		"/liste/corbeille": [16],
		"/liste/details/[list_id]": [17],
		"/liste/dnc": [18],
		"/liste/fileliste/[id]": [19],
		"/liste/list-details/[list_id]": [20],
		"/liste/modifier/[id]": [21],
		"/liste/prospects": [22],
		"/liste/recherchelist": [23],
		"/phone/afficher": [24],
		"/phone/ajouter": [25],
		"/phone/copy": [26],
		"/users/add": [27],
		"/users/copy": [28],
		"/users/detail": [29],
		"/users/list": [30],
		"/users/search": [31],
		"/users/stats": [32]
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