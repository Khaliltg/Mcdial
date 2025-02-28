<script>
  // @ts-nocheck
  import Truck from "bootstrap-icons/icons/truck.svg";
  // svelte-ignore export_let_unused
  export let isOpen = false;
  
  const menuItems = [
    { 
      name: 'Tableau de bord', 
      href: '/dashboard', 
      icon: 'book', 
      description: 'Statistiques du serveur et tableau de bord'
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
        {
          name: 'Statistiques des utilisateurs',
          href: '/users/stats', 
          icon: 'clipboard',
          description: 'Afficher les statistiques des utilisateurss'
        },
        {
          name : 'statut des utilisateurs',
          href: '/users/status', 
          icon: 'stop-circle',
          description: 'Afficher l etat des utilisateurs'
        },
        {
          name : 'feuille de temps',
          href: '/users/timesheet', 
          icon: 'calendar-week',
          description: 'Gérer les temps de travail'
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
          href: '/campaigns/statuses', 
          icon: 'stop-circle',
          description: 'Gérer les états des campagnes'
        },
        {
          name : ' hotkeys',
          href: '/campaigns/hotkeys', 
          icon: 'keyboard',
          description: 'Gérer les hotkeys'
        },
        {
          name :'Recyclage Liste',
          href: '/campaigns/lead-recycle', 
          icon: 'trash',
          description: 'Gérer la suppression des leads'
        },
        {
          name :'Cadran automatique',
          href: '/campaigns/auto-alt-dial', 
          icon: 'telephone',
          description: 'Gérer le cadran automatique',
        },
        {
          name : ' List Mix',
          href: '/campaigns/list-mix', 
          icon: 'card-list',
          description: 'Gérer la liste mix'
        },
        {
          name : ' pause codes ',
          href: '/campaigns/pause-codes', 
          icon: 'pause',
          description: 'Gérer les codes de pause'
        },
        {
          name : 'Préréglages',
          href: '/campaigns/presets', 
          icon: 'arrow-left-square',
          description: 'Gérer les Préréglages'
        },
        {
          name : 'AC-CDI',
          href: '/campaigns/ac-cdi', 
          icon: 'file-code',
          description: 'Gérer les AC-CDI'
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
         href: '/lists/show', 
         icon: 'list-ul',
         description: 'Liste des listes',
        },
        {
          name : 'Ajouter une nouvelle liste',
          href: '/lists/add', 
          icon: 'plus-circle',
          description: 'Créer une nouvelle liste',
         
        },
        {
          name : ' Rechercher une nouvelle liste',
          href: '/lists/search', 
          icon: 'search',
          description: 'Rechercher une liste',
        },
        { 
          name : ' Ajouter un nouveau prospect',
         href: '/lists/add-lead', 
         icon: 'plus-circle',
         description: 'Ajouter un nouveau lead',
        },
        {
         name : 'Ajouter-Supprimer un numéro DNC',
         href: '/lists/add-delete-dnc', 
         icon :['plus-circle', 'trash'],
         description: 'Ajouter ou supprimer un numéro DNC',
        
        },
        {
          name : 'Charger de nouveaux prospects',
          href: '/lists/load-new-leads', 
          icon: 'upload',
          description: 'Charger des nouveaux leads',
        },
        
      ]
    },
    {
      name : 'scripts',
     href: null,
      icon: 'code',
      description: 'Gestion des scripts',
      children: [
        {name : 'Afficher les scripts',
          href: '/scripts/show', 
          icon: 'list-ul',
          description: 'Liste des scripts',
        },
        {name: 'Ajouter un nouveau script',
          href: '/scripts/add', 
          icon: 'plus-circle',
          description: 'Ajouter un nouveau script',
        }
        ]
    },
    {
      name : 'Entrant',
      href: null,
      icon: 'telephone-inbound-fill',
      description: 'Gestion des entrées',
      children: [
        {name : 'Afficher les groupes',
         href: '/incoming/show-in-groups', 
         icon: 'list-ul',
         description: 'Liste des groupes d entrées',
        },
        {
          name : 'Ajouter un nouveau groupe',
         href: '/incoming/add-in-group', 
         icon: 'plus-circle',
         description: 'Ajouter un nouveau groupe d entrées',
        },
        {
          name : 'Copier dans le groupe',
          href: '/incoming/copy-in-group', 
          icon: 'clipboard-plus',
          description: 'Copier un groupe d entrées',
        },
        {
          name : 'Afficher les DiDs',
          href: '/incoming/show-ids', 
          icon: 'list-ul',
          description: 'Afficher les DiDs',
        },
        {
          name : 'Ajouter un nouveau DiD',
          href: '/incoming/add-new-id', 
          icon: 'plus-circle',
          description: 'Ajouter un nouveau DiD',
        },
        {
          name : 'Copier DiD',
          href: '/incoming/copy-id', 
          icon: 'clipboard-plus',
          description: 'Copier un DiD',
        },
        {
          name : 'Afficher les menus d appel',
          href: '/incoming/show-call-menus', 
          icon: 'menu-button-wide',
          description: 'Afficher les menus d appel',
        },
        {
          name : 'Ajouter un nouveau menu d appel',
          href: '/incoming/add-new-call-menu', 
          icon: 'building-add',
          description: 'Ajouter un nouveau menu d appel',
        },
        {name : 'Copier un menu d appel',
         href: '/incoming/copy-call-menu', 
         icon: 'clipboard-plus',
         description: 'Copier un menu d appel',
        },
        { name : 'filtrer les groupes téléphoniques',
         href: '/incoming/filter', 
         icon: 'filter',
         description: 'Filter  calls',
        },
        {name : 'ajouter un groupe de téléphone filtré',
         href: '/incoming/add-filter-phone-group', 
         icon: 'telephone-plus',
         description: 'Add filter phone group',
        },
        { name :'ajouter-supprimer un numéro FPG',
         href: '/incoming/add-delete-fpg-number', 
         icon: 'plus-slash-minus',
         description: 'Add or delete a FPG number',
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
       href: '/user-groups/show', 
       icon: 'people',
       description: 'List of user groups',
      },
      
      { name :'Ajouter un nouveau groupe d utilisateurs',
       href: '/user-groups/add-user', 
       icon: 'person-add',
       description: 'Add a new user to a group',
      },
      { name : 'Rapport horaire de groupe',
       href: '/user-groups/group-hourly-report', 
       icon: 'clock',
       description: 'Group hourly report',
      },
      {
        name : 'Changement de groupe groupé',
        href: '/user-groups/bulk-group-change', 
        icon: 'arrow-down-up',
        description: 'Bulk group change'
      },
]
},
{
  name: 'Agents distants',
  href: null,
  icon: 'person-circle',
  description: 'Manage remote agents',
  children: [
    {name: 'Afficher les agents distants',
     href: '/remote-agents/show', 
     icon: 'people',
     description: 'Liste des agents distants',
    },
    { name : 'Ajouter un nouvel agent distant',
     href: '/remote-agents/add', 
     icon: 'person-plus',
     description: 'Ajouter un nouvel agent distant',
    },
    { name : 'Afficher les groupes d extensions',
     href: '/remote-agents/groups', 
     icon: 'people-group',
     description: 'Remote Agent Groups',
    },
    { name : 'Ajouter un groupe d extensions',
     href: '/remote-agents/add-group', 
     icon: 'people-group-plus',
     description: 'Ajouter un groupe d extensions',
    },
    


  ]
},
{
  name :' Admin',
  href: null,
  icon: 'ticket-perforated-fill',
  description: 'Admin panel',
  children: [
    { name: 'call time ',
    href: '/admin/call-time', 
    icon: 'clock',
    description: 'Call time settings',
  },
  {
    name : 'changements',
    href: '/admin/shifts', 
    icon: 'calendar-check',
    description: 'Shift settings',
  },
  {name : 'téléphones',
   href: '/admin/phones', 
    icon: 'phone',
    description: 'Phone settings',
  },
  {name : 'modèles',
   href: '/admin/templates', 
    icon: 'file-template',
    description: 'Template settings',
  },
  {name : 'carriers',
   href: '/admin/carriers', 
    icon: 'truck',
    description: 'Carrier settings',
  },
  {name : 'serveurs',
   href: '/admin/servers', 
    icon: 'server',
    description: 'Server settings',
  },
  {name : 'conférences',
   href: '/admin/conferences', 
    icon: 'video-camera',
    description: 'Conference settings',
  },
  {name : 'paramètres système',
   href: '/admin/system-settings', 
    icon: 'cog',
    description: 'System settings',
  },
  {name : 'étiquettes d écran',
   href: '/admin/screen-labels', 
    icon: 'edit',
    description: 'Screen labels settings',
  },
  {name : 'couleurs d écran',
   href: '/admin/screen-colors', 
    icon: 'palette',
    description: 'Screen colors settings',
  },
  {name : 'statuts de thème',
   href: '/admin/sustheme-statuses', 
    icon: 'check-square',
    description: 'Sustheme statuses settings',
  },
  {name : 'groupes de statut',
   href: '/admin/status-groups', 
    icon: 'list-ol',
    description: 'Status groups settings',
  },
  {name : 'CID groups',
   href: '/admin/cid-groups', 
    icon: 'list-ol',
    description: 'CID groups settings',
  },
  {name : 'voice mail',
   href: '/admin/voicemail', 
    icon: 'megaphone-fill',
    description: 'Voicemail settings',
  },
  {name : 'settings containers',
   href: '/admin/settings-containers', 
    icon: 'list-ul',
    description: 'Settings containers settings',
  },
  {name : 'Queue Groups',
   href: '/admin/queue-groups', 
    icon: 'list-ul',
    description: 'Queue groups settings',
  },
  

  
]
},
  
  
  

    
  ];
  
  let activeItem = '/dashboard';
  let activeParentItem = null;
  let hoveredItem = null;
  
  function toggleSubmenu(item) {
    activeParentItem = activeParentItem === item ? null : item;
  }

  function handleItemClick(item) {
    if (item.children) {
      toggleSubmenu(item);
    } else if (item.href) {
      activeItem = item.href;
      window.location.href = item.href;
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

