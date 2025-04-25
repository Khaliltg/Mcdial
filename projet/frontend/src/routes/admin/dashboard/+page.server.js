/** @type {import('./$types').PageServerLoad} */
export async function load() {
  return {
    // Vous pouvez ajouter des données ici qui seront disponibles dans la page
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies }) => {
    // Actions pour le formulaire si nécessaire
    return { success: true };
  }
};
