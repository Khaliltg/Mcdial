type OutputDataShape<T> = MaybeWithVoid<Omit<App.PageData, RequiredKeys<T>> & Partial<T>>;
type EnsureDefined<T> = T extends null | undefined ? {} : T;
type OptionalUnion<U extends Record<string, any>, A extends keyof U = U extends U ? keyof U : never> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;
export type Snapshot<T = any> = Kit.Snapshot<T>;
type PageServerParentData = EnsureDefined<LayoutServerData>;
type PageParentData = EnsureDefined<LayoutData>;

type LayoutRouteId = RouteId | "/" | "/admin/conferences" | "/admin/dashboard" | "/admin/login" | "/admin/carrier" | "/agent" | "/agent/calls/history" | "/agent/calls/new" | "/agent/dashboard" | "/agent/login" | "/compagnes/add" | "/compagnes/auto_dial" | "/compagnes/copy" | "/compagnes/detail/[campaign_id]" | "/compagnes/list_mix/show_list_mix" | "/compagnes/pause_code" | "/compagnes/show" | "/compagnes/statues" | "/liste/Filedata" | "/liste/afficherlist" | "/liste/ajouter" | "/liste/ajouterListe" | "/liste/ajouterprospect" | "/liste/chargerprospect" | "/liste/corbeille" | "/liste/details/[list_id]" | "/liste/dnc" | "/liste/fileliste/[id]" | "/liste/list-details/[list_id]" | "/liste/modifier/[id]" | "/liste/prospects" | "/liste/recherchelist" | "/login" | "/phone/afficher" | "/phone/ajouter" | "/phone/copy" | "/phone/detail" | "/stats/userStats" | "/userGroupe/afficher" | "/userGroupe/ajouter" | "/userGroupe/bulk_userGroupe" | "/userGroupe/details" | "/users/add" | "/users/copy" | "/users/detail" | "/users/list" | "/users/search" | "/users/stats" | null;

type LayoutParams = RouteParams & { campaign_id?: string; list_id?: string; id?: string };
type LayoutParentData = EnsureDefined<{}>;

export type PageServerLoad<OutputData extends OutputDataShape<PageServerParentData> = OutputDataShape<PageServerParentData>> = Kit.ServerLoad<RouteParams, PageServerParentData, OutputData, RouteId>;
export type PageServerLoadEvent = Parameters<PageServerLoad>[0];
export type ActionData = unknown;
export type PageServerData = null;
export type PageData = Expand<PageParentData>;
export type PageProps = { data: PageData };
export type Action<OutputData extends Record<string, any> | void = Record<string, any> | void> = Kit.Action<RouteParams, OutputData, RouteId>;
export type Actions<OutputData extends Record<string, any> | void = Record<string, any> | void> = Kit.Actions<RouteParams, OutputData, RouteId>;
export type LayoutServerData = null;
export type LayoutData = Expand<LayoutParentData>;
export type LayoutProps = { data: LayoutData; children: import("svelte").Snippet };
export type RequestEvent = Kit.RequestEvent<RouteParams, RouteId>;