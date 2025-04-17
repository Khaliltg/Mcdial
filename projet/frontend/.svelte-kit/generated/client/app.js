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
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/compagnes/add": [3],
		"/compagnes/auto_dial": [4],
		"/compagnes/copy": [5],
		"/compagnes/detail/[campaign_id]": [6],
		"/compagnes/list_mix/show_list_mix": [7],
		"/compagnes/pause_code": [8],
		"/compagnes/show": [9],
		"/compagnes/statues": [10],
		"/liste/Filedata": [19],
		"/liste/afficherlist": [11],
		"/liste/ajouterListe": [13],
		"/liste/ajouterprospect": [14],
		"/liste/ajouter": [12],
		"/liste/chargerprospect": [15],
		"/liste/corbeille": [16],
		"/liste/details/[list_id]": [17],
		"/liste/dnc": [18],
		"/liste/fileliste/[id]": [20],
		"/liste/list-details/[list_id]": [21],
		"/liste/modifier/[id]": [22],
		"/liste/prospects": [23],
		"/liste/recherchelist": [24],
		"/phone/afficher": [25],
		"/phone/ajouter": [26],
		"/phone/copy": [27],
		"/phone/detail": [28],
		"/users/add": [29],
		"/users/copy": [30],
		"/users/detail": [31],
		"/users/list": [32],
		"/users/search": [33],
		"/users/stats": [34]
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