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
	() => import('./nodes/39')
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
	"/liste/Filedata": [12,19,20], // merged all node indices for this route
	"/liste/afficherlist": [11,12],
	"/liste/ajouterListe": [13,14],
	"/liste/ajouterprospect": [14,15],
	"/liste/ajouter": [12,13],
	"/liste/chargerprospect": [15,16],
	"/liste/corbeille": [16,17],
	"/liste/details/[list_id]": [17,18],
	"/liste/dnc": [18,19],
	"/liste/fileliste/[id]": [20],
	"/liste/list-details/[list_id]": [21],
	"/liste/modifier/[id]": [22],
	"/liste/prospects": [23],
	"/liste/recherchelist": [24],
	"/login": [25],
	"/phone/afficher": [26],
	"/phone/ajouter": [27],
	"/phone/copy": [28],
	"/stats/userStats": [29],
	"/userGroupe/afficher": [30],
	"/userGroupe/ajouter": [31],
	"/userGroupe/bulk_userGroupe": [32],
	"/userGroupe/details": [33],
	"/users/add": [34],
	"/users/copy": [35],
	"/users/detail": [36],
	"/users/list": [37],
	"/users/search": [38],
	"/users/stats": [39]
};

export const hooks = {
	handleError: client_hooks.handleError || (({ error }) => { console.error(error); }),
	init: client_hooks.init,
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.svelte';