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
	() => import('./nodes/41'),
	() => import('./nodes/42'),
	() => import('./nodes/43')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/admin/carrier": [3],
		"/admin/conferences": [4],
		"/admin/server": [5],
		"/compagnes/add": [6],
		"/compagnes/auto_dial": [7],
		"/compagnes/copy": [8],
		"/compagnes/detail/[campaign_id]": [9],
		"/compagnes/list_mix/show_list_mix": [10],
		"/compagnes/pause_code": [11],
		"/compagnes/show": [12],
		"/compagnes/statues": [13],
		"/liste/Filedata": [22],
		"/liste/afficherlist": [14],
		"/liste/ajouterListe": [16],
		"/liste/ajouterprospect": [17],
		"/liste/ajouter": [15],
		"/liste/chargerprospect": [18],
		"/liste/corbeille": [19],
		"/liste/details/[list_id]": [20],
		"/liste/dnc": [21],
		"/liste/fileliste/[id]": [23],
		"/liste/list-details/[list_id]": [24],
		"/liste/modifier/[id]": [25],
		"/liste/prospects": [26],
		"/liste/recherchelist": [27],
		"/login": [28],
		"/phone/afficher": [29],
		"/phone/ajouter": [30],
		"/phone/copy": [31],
		"/phone/detail": [32],
		"/stats/userStats": [33],
		"/userGroupe/afficher": [34],
		"/userGroupe/ajouter": [35],
		"/userGroupe/bulk_userGroupe": [36],
		"/userGroupe/details": [37],
		"/users/add": [38],
		"/users/copy": [39],
		"/users/detail": [40],
		"/users/list": [41],
		"/users/search": [42],
		"/users/stats": [43]
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