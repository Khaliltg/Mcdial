import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Allow login page always
  if (event.url.pathname === '/login') return resolve(event);

  // Try to read token from cookies (SSR) or from localStorage (client)
  let token = event.cookies.get('token');
  let user_level = Number(event.cookies.get('user_level'));

  // If not logged in, redirect to login
  if (!token) {
    throw redirect(302, '/login');
  }

  // Admin-only routes (add more as needed)
  const adminRoutes = [
    '/compagnes/add',
    '/compagnes/detail',
    '/userGroupe',
    '/users',
    '/stats/userStats',
    // Add more admin-only routes here
  ];
  if (adminRoutes.some((r) => event.url.pathname.startsWith(r)) && user_level !== 1) {
    throw redirect(302, '/');
  }

  return resolve(event);
};
