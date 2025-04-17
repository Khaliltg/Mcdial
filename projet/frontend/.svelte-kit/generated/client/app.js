import * as client_hooks from '../../../src/hooks.client.ts';


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
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37'),
	() => import('./nodes/38'),
	() => import('./nodes/39'),
	() => import('./nodes/40'),
	() => import('./nodes/41')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/admin/conferences": [3],
		"/compagnes/add": [4],
		"/compagnes/auto_dial": [5],
		"/compagnes/copy": [6],
		"/compagnes/detail/[campaign_id]": [7],
		"/compagnes/list_mix/show_list_mix": [8],
		"/compagnes/pause_code": [9],
		"/compagnes/show": [10],
		"/compagnes/statues": [11],
		"/liste/Filedata": [12],
		"/liste/afficherlist": [13],
		"/liste/ajouterListe": [15],
		"/liste/ajouterprospect": [16],
		"/liste/ajouter": [14],
		"/liste/chargerprospect": [17],
		"/liste/corbeille": [18],
		"/liste/details/[list_id]": [19],
		"/liste/dnc": [20],
		"/liste/fileliste/[id]": [21],
		"/liste/list-details/[list_id]": [22],
		"/liste/modifier/[id]": [23],
		"/liste/prospects": [24],
		"/liste/recherchelist": [25],
		"/login": [26],
		"/phone/afficher": [27],
		"/phone/ajouter": [28],
		"/phone/copy": [29],
		"/phone/detail": [30],
		"/stats/userStats": [31],
		"/userGroupe/afficher": [32],
		"/userGroupe/ajouter": [33],
		"/userGroupe/bulk_userGroupe": [34],
		"/userGroupe/details": [35],
		"/users/add": [36],
		"/users/copy": [37],
		"/users/detail": [38],
		"/users/list": [39],
		"/users/search": [40],
		"/users/stats": [41]
	};

export const hooks = {
	handleError: client_hooks.handleError || (({ error }) => { console.error(error) }),
	init: client_hooks.init,
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.svelte';