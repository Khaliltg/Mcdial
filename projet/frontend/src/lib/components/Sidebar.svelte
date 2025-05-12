<script>
  // @ts-nocheck
  import Truck from "bootstrap-icons/icons/truck.svg";
  // svelte-ignore export_let_unused
  export let isOpen = false;
  
  const menuItems = [
    {
          name : ' Rapport',
          href: "/rapport/rapport", 
          icon: 'file-text-fill',
          description: 'Générer un rapport',
          
        },
      
  
    { 
      name: 'Utilisateurs', 
      href: null, 
      icon: 'people-fill',
      description: 'Outils de gestion des utilisateurs',
      children: [
        { 
          name: 'Afficher les utilisateurs', 
          href: '/users/list', 
          icon: 'list-ul',
          description: 'Afficher tous les comptes d utilisateurs'
        },
        { 
          name: 'Ajouter un nouvel utilisateur', 
          href: '/users/add', 
          icon: 'person-plus-fill',
          description: 'Créer un nouveau compte utilisateur'
        },
        {
          name: 'Copier l utilisateur',
          href: '/users/copy', 
          icon: 'person',
          description: 'Copier les informations du compte utilisateur'
        },
        { 
          name: 'Rechercher un utilisateur',
          href: '/users/search', 
          icon: 'search',
          description: 'Rechercher un compte utilisateur'
        },
 
    
      ]
    },
    {
      name :'statistiques des utilisateurs',
      href: null,
      icon: 'clipboard',
      description: 'Afficher les statistiques des utilisateurs',
      children: [
        {
          name : 'statut des utilisateurs',
          href: '/users/stats', 
          icon: 'stop-circle',
          description: 'Afficher l etat des utilisateurs'
        },
      ]
    },
    
    { 
    name : ' campagnes',
      href: null,
      icon: 'bullseye',
      description: 'Gestion des campagnes',
      children: [
        {name : 'campagnes principales',
        href: '/compagnes/show', 
        icon: 'list-ul',
        description: 'Liste des campagnes principales'
        },
        {
          name : 'statuts',
          href: '/compagnes/statues', 
          icon: 'stop-circle',
          description: 'Gérer les états des campagnes'
        },
       
        {
          name : ' List Mix',
          href: '/compagnes/list_mix/show_list_mix', 
          icon: 'card-list',
          description: 'Gérer la liste mix'
        },
        {
          name : ' pause codes ',
          href: '/compagnes/pause_code', 
          icon: 'pause',
          description: 'Gérer les codes de pause'
        },
        {
          name : 'Préréglages',
          href: '/campaigns/presets', 
          icon: 'arrow-left-square',
          description: 'Gérer les Préréglages'
        },
      ]
        

    },
    {
      name : 'lists',
      href: null,
      icon: 'list-ul',
      description: 'Gestion des listes',
      children: [
        {name : 'Afficher les listes',
        href: '/liste/afficherlist', 
        icon: 'list-ul',
        description: 'Liste des listes',
        },
       
       
        { 
          name : ' Ajouter un nouveau prospect',
        href: '/liste/chargerprospect', 
        icon: 'plus-circle',
        description: 'Ajouter un nouveau lead',
        },
       
     
        
      ]
    },
   
   
  {
    name: 'Groupes d utilisateurs',
    href: null,
    icon: 'people',
    description: 'Manage user groups',
    children: [
      {name: 'Afficher les groupes d utilisateurs',
      href: '/userGroupe/afficher', 
      icon: 'people',
      description: 'List of user groups',
      },
      
      { name : 'Rapport horaire de groupe',
      href: '/userGroupe/hourlyStats', 
      icon: 'clock',
      description: 'Group hourly report',
      },
      {
        name : 'Changement de groupe groupé',
        href: '/userGroupe/bulk_userGroupe', 
        icon: 'arrow-down-up',
        description: 'Bulk group change'
      },
]
},
{
  name : 'Telephone',
  href: null,
  icon: 'telephone 1',
  description: 'Phone settings',
  children: [
    {name : 'Afficher les téléphone',
    href: '/phone/afficher', 
    icon: 'phone',
    description: 'List of phones',
    },
    { name : 'Ajouter un nouveau téléphone',
    href: '/phone/ajouter', 
    icon: 'phone',
    description: 'Add a new phone',
  },
  {
    name :'copier un téléphone existant',
    href : '/phone/copy',
    icon : 'phone',
    description : 'Copy an existing phone',
  },
]

},

{
  name :' Admin',
  href: null,
  icon: 'ticket-perforated-fill',
  description: 'Admin panel',
  children: [
   
  
  
 
  {name : 'carriers',
  href: '/admin/carrier', 
    icon: 'truck',
    description: 'Carrier settings',
  },
  {name : 'serveurs',
  href: '/admin/server', 
    icon: 'server',
    description: 'Server settings',
  },
 

]
},
  
  
  

    
  ];
  
  let activeItem = '/dashboard';
  let activeParentItem = null;
  let hoveredItem = null;
  
  import { goto } from '$app/navigation';

  function toggleSubmenu(item) {
    activeParentItem = activeParentItem === item ? null : item;
  }

  function handleItemClick(item) {
    if (item.children) {
      toggleSubmenu(item);
    } else if (item.href) {
      activeItem = item.href;
      goto(item.href);
    }
  }
</script>



<div class="bg-white border-end h-100 shadow-sm font-inter">
  <div class="d-flex flex-column h-100">
    <div class="px-3 pt-3">
      <div class="list-group list-group-flush">
        {#each menuItems as item}
          <div>
            <div 
              class={`
                list-group-item list-group-item-action 
                d-flex justify-content-between align-items-center 
                cursor-pointer
                ${activeItem === item.href ? 'active' : ''}
                py-3 px-0 border-0
                font-regular
                position-relative
                hover-effect
              `}
              on:mouseenter={() => hoveredItem = item}
              on:mouseleave={() => hoveredItem = null}
              on:click={() => handleItemClick(item)}
              role="button"
              tabindex="0"
            >
              <div class="d-flex align-items-center">
                <i class="bi bi-{item.icon} me-3 text-muted fs-5"></i>
                <div>
                  <span class="font-regular fs-6 d-block">{item.name}</span>
                  {#if hoveredItem === item}
                    <small class="text-muted fs-7 description-tooltip">
                      {item.description}
                    </small>
                  {/if}
                </div>
              </div>
              {#if item.badge}
                <span class="badge bg-primary rounded-pill font-light fs-7">
                  {item.badge}
                </span>
              {/if}
              {#if item.children}
                <i class={`bi bi-chevron-${activeParentItem === item ? 'down' : 'right'} ms-2`}></i>
              {/if}
            </div>

            {#if item.children && activeParentItem === item}
              <div class="list-group list-group-flush ps-4 submenu-animation">
                {#each item.children as childItem}
                  <div 
                    class={`
                      list-group-item list-group-item-action 
                      d-flex align-items-center 
                      ${activeItem === childItem.href ? 'active' : ''}
                      py-3 px-0 border-0
                      font-regular
                      position-relative
                      hover-effect
                      cursor-pointer
                    `}
                    on:mouseenter={() => hoveredItem = childItem}
                    on:mouseleave={() => hoveredItem = null}
                    on:click={() => handleItemClick(childItem)}
                    role="button"
                    tabindex="0"
                  >
                    <i class="bi bi-{childItem.icon} me-3 text-muted fs-5"></i>
                    <div>
                      <span class="font-regular fs-6 d-block">{childItem.name}</span>
                      {#if hoveredItem === childItem}
                        <small class="text-muted fs-7 description-tooltip">
                          {childItem.description}
                        </small>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  
  .list-group-item-action.active {
    background-color: rgba(0, 123, 255, 0.1);
    color: #007bff;
  }

  .list-group-item-action.active i {
    color: #007bff;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .font-inter {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .fs-7 {
    font-size: 0.75rem;
  }

  .hover-effect {
    transition: all 0.3s ease;
  }

  .hover-effect:hover {
    background-color: rgba(0, 123, 255, 0.05);
    transform: translateX(5px);
  }

  .description-tooltip {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .hover-effect:hover .description-tooltip {
    opacity: 1;
    max-height: 50px;
  }

  .submenu-animation {
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
  
</style>