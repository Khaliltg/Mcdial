import type * as Kit from '@sveltejs/kit';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
// @ts-ignore
type MatcherParam<M> = M extends (param : string) => param is infer U ? U extends string ? U : string : string;
type RouteParams = {  };
type RouteId = '/';
type MaybeWithVoid<T> = {} extends T ? T | void : T;
export type RequiredKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K; }[keyof T];
type OutputDataShape<T> = MaybeWithVoid<Omit<App.PageData, RequiredKeys<T>> & Partial<Pick<App.PageData, keyof T & keyof App.PageData>> & Record<string, any>>
type EnsureDefined<T> = T extends null | undefined ? {} : T;
type OptionalUnion<U extends Record<string, any>, A extends keyof U = U extends U ? keyof U : never> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;
export type Snapshot<T = any> = Kit.Snapshot<T>;
type PageParentData = EnsureDefined<LayoutData>;
type LayoutRouteId = RouteId | "/" | "/admin/carrier" | "/admin/conferences" | "/admin/login" | "/admin/server" | "/agent" | "/agent/calls/history" | "/agent/calls/new" | "/agent/login" | "/compagnes/add" | "/compagnes/auto_dial" | "/compagnes/copy" | "/compagnes/detail/[campaign_id]" | "/compagnes/list_mix/show_list_mix" | "/compagnes/pause_code" | "/compagnes/show" | "/compagnes/statues" | "/liste/afficherlist" | "/liste/ajouter" | "/liste/ajouterListe" | "/liste/ajouterprospect" | "/liste/chargerprospect" | "/liste/corbeille" | "/liste/details/[list_id]" | "/liste/dnc" | "/liste/Filedata" | "/liste/fileliste/[id]" | "/liste/list-details/[list_id]" | "/liste/modifier/[id]" | "/liste/prospects" | "/liste/recherchelist" | "/login" | "/phone/afficher" | "/phone/ajouter" | "/phone/copy" | "/phone/detail" | "/rapport/agent_time_detail" | "/rapport/export-calls" | "/rapport/export-leads" | "/rapport/rapport" | "/rapport/RealTimeReport" | "/rapport/timeclock-detail" | "/stats/userStats" | "/userGroupe/afficher" | "/userGroupe/ajouter" | "/userGroupe/bulk_userGroupe" | "/userGroupe/details" | "/userGroupe/hourlyStats" | "/users/add" | "/users/copy" | "/users/detail" | "/users/list" | "/users/search" | "/users/stats" | null
type LayoutParams = RouteParams & { campaign_id?: string; list_id?: string; id?: string }
type LayoutParentData = EnsureDefined<{}>;

export type PageServerData = null;
export type PageData = Expand<PageParentData>;
export type PageProps = { data: PageData }
export type LayoutServerData = null;
export type LayoutData = Expand<LayoutParentData>;
export type LayoutProps = { data: LayoutData; children: import("svelte").Snippet }