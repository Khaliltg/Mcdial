import { goto } from '$app/navigation';
import { redirect } from '@sveltejs/kit';

// This runs before every navigation on the client
export async function handle({ event, resolve }) {
  // Allow login page always
  if (event.url.pathname === '/login') return resolve(event);

  const token = localStorage.getItem('token');
  const user_level = Number(localStorage.getItem('user_level'));

  // If not logged in, redirect to login
  if (!token) {
    // Let the server-side handle redirect
    return resolve(event);
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
    // Let the server-side handle redirect
    return resolve(event);
  }

  return resolve(event);
}
