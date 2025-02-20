<script lang="ts">
    import { onMount } from "svelte";
    import axios from "axios";
    import { 
        Card, 
        Button, 
        Spinner, 
        Alert, 
        Input, 
        Tooltip,
        Badge,
        Modal,
        Dropdown,
        DropdownItem,
        Checkbox,
        Select
    } from 'flowbite-svelte';
    import { 
        UserSolid, 
        EditOutline, 
        TrashBinOutline, 
        SearchOutline,
        PlusOutline,
        DotsVerticalOutline,
        FilterOutline,
        SortOutline
    } from 'flowbite-svelte-icons';

    // Enhanced User type with more comprehensive fields
    type User = {
        user_id: number;
        user: string;
        full_name: string;
        user_level: number;
        email?: string;
        phone_login?: string;
        user_group?: string;
        status: 'active' | 'inactive' | 'suspended';
        last_login?: string;
    };

    // Advanced filtering and sorting types
    type SortField = 'user_id' | 'full_name' | 'user_level' | 'last_login';
    type SortDirection = 'asc' | 'desc';

    // State management
    let users: User[] = [];
    let filteredUsers: User[] = [];
    let loading: boolean = true;
    let error: string = "";
    
    // Search and filter states
    let searchTerm: string = "";
    let selectedStatus: string | null = null;
    let selectedUserGroup: string | null = null;
    let selectedUserLevel: number | null = null;
    
    // Sorting states
    let sortField: SortField = 'user_id';
    let sortDirection: SortDirection = 'asc';
    
    // Modal and interaction states
    let showUserModal: boolean = false;
    let showDeleteModal: boolean = false;
    let showFilterModal: boolean = false;
    let selectedUser: User | null = null;
    let activeDropdown: number | null = null;
    
    // Bulk actions
    let selectedUsers: Set<number> = new Set();
    let isSelectAllChecked: boolean = false;

    // Pagination
    let currentPage: number = 1;
    const itemsPerPage: number = 9;

    // Unique user groups and levels for filtering
    $: userGroups = [...new Set(users.map(u => u.user_group).filter(Boolean))];
    $: userLevels = [...new Set(users.map(u => u.user_level))];

    onMount(async () => {
        try {
            const response = await axios.get<User[]>("http://localhost:3000/api/admin/user/allUsers");
            users = response.data.map(user => ({
                ...user,
                status: user.status || 'active',
                last_login: user.last_login || 'Never'
            }));
            applyFiltersAndSort();
        } catch (err) {
            error = "Failed to fetch users. Please try again later.";
            console.error(err);
        } finally {
            loading = false;
        }
    });

    // Advanced filtering and sorting function
    function applyFiltersAndSort() {
        filteredUsers = users.filter(user => {
            const matchesSearch = !searchTerm || 
                user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.user.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = !selectedStatus || user.status === selectedStatus;
            
            const matchesUserGroup = !selectedUserGroup || user.user_group === selectedUserGroup;
            
            const matchesUserLevel = selectedUserLevel === null || user.user_level === selectedUserLevel;

            return matchesSearch && matchesStatus && matchesUserGroup && matchesUserLevel;
        }).sort((a, b) => {
            let comparison = 0;
            switch(sortField) {
                case 'user_id':
                    comparison = a.user_id - b.user_id;
                    break;
                case 'full_name':
                    comparison = a.full_name.localeCompare(b.full_name);
                    break;
                case 'user_level':
                    comparison = a.user_level - b.user_level;
                    break;
                case 'last_login':
                    comparison = (a.last_login || '').localeCompare(b.last_login || '');
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        // Reset pagination
        currentPage = 1;
    }

    // Pagination calculations
    $: paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    $: totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Bulk action methods
    function toggleUserSelection(userId: number) {
        if (selectedUsers.has(userId)) {
            selectedUsers.delete(userId);
        } else {
            selectedUsers.add(userId);
        }
        selectedUsers = selectedUsers;
        isSelectAllChecked = selectedUsers.size === paginatedUsers.length;
    }

    function toggleSelectAll() {
        isSelectAllChecked = !isSelectAllChecked;
        selectedUsers = isSelectAllChecked 
            ? new Set(paginatedUsers.map(u => u.user_id)) 
            : new Set();
    }

    // User action methods
    function handleViewUser(user: User) {
        selectedUser = user;
        showUserModal = true;
        activeDropdown = null;
    }

    function handleEditUser(user: User) {
        console.log('Edit user', user);
        activeDropdown = null;
        // TODO: Implement edit user logic
    }

    function handleDeleteUser(user: User) {
        selectedUser = user;
        showDeleteModal = true;
        activeDropdown = null;
    }

    // function confirmDeleteUser() {
    //     if (selectedUser) {
    //         // TODO: Implement actual delete logic
    //         users = users.filter(u => u.user_id !== selectedUser.user_id);
    //         applyFiltersAndSort();
    //         showDeleteModal = false;
    //         selectedUser = null;
    //     }
    // }

    function changePage(newPage: number) {
        if (newPage > 0 && newPage <= totalPages) {
            currentPage = newPage;
        }
    }

    function toggleDropdown(userId: number) {
        activeDropdown = activeDropdown === userId ? null : userId;
    }

    function openFilterModal() {
        showFilterModal = true;
    }

    function applyFilters() {
        applyFiltersAndSort();
        showFilterModal = false;
    }

    function resetFilters() {
        selectedStatus = null;
        selectedUserGroup = null;
        selectedUserLevel = null;
        searchTerm = "";
        applyFiltersAndSort();
        showFilterModal = false;
    }

    function toggleSort(field: SortField) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
        applyFiltersAndSort();
    }
</script>

<div class="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div class="container mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <div class="flex space-x-2">
                <Button color="primary" class="flex items-center">
                    <span class="mr-2">
                        <PlusOutline />
                    </span>
                    Add New User
                </Button>
                {#if selectedUsers.size > 0}
                    <Button color="red" class="flex items-center">
                        Bulk Delete ({selectedUsers.size})
                    </Button>
                {/if}
            </div>
        </div>

        <!-- Search and Filter Section -->
        <div class="mb-6 flex space-x-4">
            <div class="relative flex-grow">
                <label for="user-search" class="sr-only">Search users</label>
                <Input 
                    id="user-search"
                    type="text" 
                    placeholder="Search users by name or username" 
                    bind:value={searchTerm}
                    on:input={applyFiltersAndSort}
                    class="pl-10"
                >
                    <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </Input>
            </div>
            <Button color="light" on:click={openFilterModal}>
                <FilterOutline class="mr-2" /> Filters
            </Button>
        </div>

        <!-- Loading and Error States -->
        {#if loading}
            <div class="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        {:else if error}
            <Alert color="red" dismissable>{error}</Alert>
        {:else if filteredUsers.length === 0}
            <div class="text-center py-10 text-gray-500">
                No users found. Try adjusting your search or filters.
            </div>
        {:else}
            <!-- User Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {#each paginatedUsers as user (user.user_id)}
                    <Card>
                        <div class="flex flex-col space-y-4 relative">
                            <div class="flex items-center space-x-4">
                                <Checkbox 
                                    checked={selectedUsers.has(user.user_id)}
                                    on:change={() => toggleUserSelection(user.user_id)}
                                />
                                <UserSolid class="w-12 h-12 text-gray-500 dark:text-gray-400" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                                        {user.full_name}
                                    </p>
                                    <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                                        @{user.user}
                                    </p>
                                </div>
                                <div class="relative">
                                    <Button 
                                        color="light" 
                                        size="sm" 
                                        on:click={() => toggleDropdown(user.user_id)}
                                    >
                                        <DotsVerticalOutline />
                                    </Button>
                                    {#if activeDropdown === user.user_id}
                                        <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div class="py-1">
                                                <button 
                                                    class="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left flex items-center"
                                                    on:click={() => handleViewUser(user)}
                                                >
                                                    <SearchOutline class="mr-2 w-4 h-4" /> View Details
                                                </button>
                                                <button 
                                                    class="text-yellow-600 dark:text-yellow-400 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left flex items-center"
                                                    on:click={() => handleEditUser(user)}
                                                >
                                                    <EditOutline class="mr-2 w-4 h-4" /> Edit User
                                                </button>
                                                <button 
                                                    class="text-red-600 dark:text-red-400 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left flex items-center"
                                                    on:click={() => handleDeleteUser(user)}
                                                >
                                                    <TrashBinOutline class="mr-2 w-4 h-4" /> Delete User
                                                </button>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <Badge 
                                    color={
                                        user.status === 'active' ? 'green' : 
                                        user.status === 'inactive' ? 'yellow' : 'red'
                                    }
                                >
                                    {user.status}
                                </Badge>
                                <div class="flex items-center space-x-2">
                                    <button 
                                        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        on:click={() => toggleSort('user_level')}
                                    >
                                        <SortOutline class="w-4 h-4" />
                                        Level: {user.user_level}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                {/each}
            </div>

            <!-- Pagination -->
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <Checkbox 
                        checked={isSelectAllChecked}
                        on:change={toggleSelectAll}
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-300">
                        Select All
                    </span>
                </div>
                <div class="flex justify-center items-center space-x-4">
                    <Button 
                        color="light" 
                        disabled={currentPage === 1}
                        on:click={() => changePage(currentPage - 1)}
                    >
                        Previous
                    </Button>
                    <span class="text-gray-600 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                        color="light" 
                        disabled={currentPage === totalPages}
                        on:click={() => changePage(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Filter Modal -->
<Modal bind:open={showFilterModal} size="md">
    <div class="p-6">
        <h2 class="text-xl font-bold mb-4">Filter Users</h2>
        <div class="space-y-4">
            <div>
                <label 
                    for="status-filter" 
                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    Status
                </label>
                <Select 
                    id="status-filter"
                    items={[
                        { value: null, name: 'All Statuses' },
                        { value: 'active', name: 'Active' },
                        { value: 'inactive', name: 'Inactive' },
                        { value: 'suspended', name: 'Suspended' }
                    ]} 
                    bind:value={selectedStatus}
                />
            </div>
            
            <!-- <div>
                <label 
                    for="group-filter" 
                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    User Group
                </label>
                <Select 
                    id="group-filter"
                    items={[
                        { value: null, name: 'All Groups' },
                        ...userGroups.map(group => ({ value: group, name: group }))
                    ]} 
                    bind:value={selectedUserGroup}
                />
            </div> -->
            
            <div>
                <label 
                    for="level-filter" 
                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    User Level
                </label>
                <Select 
                    id="level-filter"
                    items={[
                        { value: null, name: 'All Levels' },
                        ...userLevels.map(level => ({ value: level, name: `Level ${level}` }))
                    ]} 
                    bind:value={selectedUserLevel}
                />
            </div>
        </div>
        <div class="flex justify-between mt-6">
            <Button color="light" on:click={resetFilters}>
                Reset Filters
            </Button>
            <Button color="primary" on:click={applyFilters}>
                Apply Filters
            </Button>
        </div>
    </div>
</Modal>

<!-- User Details Modal -->
<Modal bind:open={showUserModal} size="md">
    {#if selectedUser}
        <div class="p-6">
            <h2 class="text-xl font-bold mb-4">User Details</h2>
            <div class="space-y-3">
                <p><strong>User ID:</strong> {selectedUser.user_id}</p>
                <p><strong>Username:</strong> {selectedUser.user}</p>
                <p><strong>Full Name:</strong> {selectedUser.full_name}</p>
                <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                <p><strong>User Level:</strong> {selectedUser.user_level}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
                {#if selectedUser.phone_login}
                    <p><strong>Phone Login:</strong> {selectedUser.phone_login}</p>
                {/if}
                {#if selectedUser.user_group}
                    <p><strong>User Group:</strong> {selectedUser.user_group}</p>
                {/if}
                <p><strong>Last Login:</strong> {selectedUser.last_login}</p>
            </div>
        </div>
    {/if}
</Modal>

<!-- Delete Confirmation Modal -->
<Modal bind:open={showDeleteModal} size="sm">
    <div class="p-6 text-center">
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this user?
        </h3>
        <div class="flex justify-center space-x-4">
            <Button color="red" >
                Yes, I'm sure
            </Button>
            <Button color="light" on:click={() => showDeleteModal = false}>
                No, cancel
            </Button>
        </div>
    </div>
</Modal>