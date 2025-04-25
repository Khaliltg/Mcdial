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
	() => import('./nodes/43'),
	() => import('./nodes/44'),
	() => import('./nodes/45'),
	() => import('./nodes/46'),
	() => import('./nodes/47'),
	() => import('./nodes/48'),
	() => import('./nodes/49'),
	() => import('./nodes/50')
];

export const server_loads = [];

export const dictionary = {
	"/": [~4],
	"/admin/conferences": [5,[2]],
	"/admin/dashboard": [~6,[2]],
	"/admin/login": [7,[2]],
	"/agent": [8,[3]],
	"/agent/calls/history": [9,[3]],
	"/agent/calls/new": [10,[3]],
	"/agent/dashboard": [11,[3]],
	"/agent/login": [12,[3]],
	"/compagnes/add": [13],
	"/compagnes/auto_dial": [14],
	"/compagnes/copy": [15],
	"/compagnes/detail/[campaign_id]": [16],
	"/compagnes/list_mix/show_list_mix": [17],
	"/compagnes/pause_code": [18],
	"/compagnes/show": [19],
	"/compagnes/statues": [20],
	"/liste/Filedata": [21],
	"/liste/afficherlist": [22],
	"/liste/ajouterListe": [24],
	"/liste/ajouterprospect": [25],
	"/liste/ajouter": [23],
	"/liste/chargerprospect": [26],
	"/liste/corbeille": [27],
	"/liste/details/[list_id]": [28],
	"/liste/dnc": [29],
	"/liste/fileliste/[id]": [30],
	"/liste/list-details/[list_id]": [31],
	"/liste/modifier/[id]": [32],
	"/liste/prospects": [33],
	"/liste/recherchelist": [34],
	"/login": [35],
	"/phone/afficher": [36],
	"/phone/ajouter": [37],
	"/phone/copy": [38],
	"/phone/detail": [39],
	"/stats/userStats": [40],
	"/userGroupe/afficher": [41],
	"/userGroupe/ajouter": [42],
	"/userGroupe/bulk_userGroupe": [43],
	"/userGroupe/details": [44],
	"/users/add": [45],
	"/users/copy": [46],
	"/users/detail": [47],
	"/users/list": [48],
	"/users/search": [49],
	"/users/stats": [50]
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