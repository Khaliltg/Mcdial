<script>
  // @ts-nocheck
  
  // svelte-ignore export_let_unused
  export let isOpen = false;
  
  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: 'book', 
      description: 'Server Stats and Dashboard'
    },
    { 
      name: 'Users', 
      href: null, 
      icon: 'people-fill',
      description: 'User management tools',
      children: [
        { 
          name: 'Show Users', 
          href: '/users/list', 
          icon: 'list-ul',
          description: 'View all user accounts'
        },
        { 
          name: 'Add new User', 
          href: '/users/add', 
          icon: 'person-plus-fill',
          description: 'Create new user account'
        },
        {
          name: 'Copy User',
          href: '/users/copy', 
          icon: 'person',
          description: 'Copy user account information'
        },
        { 
          name: 'Search For A User',
          href: '/users/search', 
          icon: 'search',
          description: 'Search for a user account'
        },
        {
          name: 'User Stats',
          href: '/users/stats', 
          icon: 'bi-bar-chart',
          description: 'View user statistics'
        },
      ]
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: 'gear-fill',
      description: 'Application configuration'
    },
    { 
      name: 'Help Center', 
      href: '/help', 
      icon: 'question-circle',
      description: 'Get assistance and documentation'
    },
    { 
      name: 'Feedback', 
      href: '/feedback', 
      icon: 'chat-text',
      description: 'Share your thoughts and suggestions'
    }
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
</style>