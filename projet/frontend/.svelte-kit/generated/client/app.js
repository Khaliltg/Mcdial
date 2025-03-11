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
	() => import('./nodes/18')
];

export const server_loads = [];

export const dictionary = {
		"/": [[2]](http://stackoverflow.com/questions/9233936/),
		"/compagnes/add": [[3]](https://github.com/topics/conflict-resolution?l=javascript),
		"/compagnes/detail/[campaign_id]":,
		"/compagnes/show":,
		"/liste/afficherlist":,
		"/liste/ajouterprospect":,
		"/liste/ajouter":,
		"/liste/dnc":,
		"/liste/details/[list_id]":, // Merged route
		"/liste/list-details/[list_id]":, // Merged route
		"/liste/prospects":,
		"/liste/recherchelist":,
		"/users/add":,
		"/users/copy":,
		"/users/detail":,
		"/users/list":,
		"/users/search":
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