<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

    // API configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    interface Phone {
        extension: string;
        port?: string;
        server_ip?: string;
        dialplan_number?: string;
        status?: string;
        fullname?: string;
        voicemail_id?: string;
        user_group?: string;
    }

    let phones: Phone[] = [];
    let filteredUsers: Phone[] = [];
    let showAll = false;
    let isLoading = true;
    let searchQuery = '';
    let sortField = 'user';
    let sortDirection = 'asc';
  
    // Fetch the list of phones when the component mounts
    onMount(async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/list`);
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
          const errorData = contentType?.includes('application/json') 
            ? await response.json()
            : { message: 'Server error occurred' };
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        if (!contentType?.includes('application/json')) {
          throw new Error('Invalid response format from server');
        }

        phones = await response.json();
      } catch (error) {
        console.error('Failed to fetch phones:', error);
      } finally {
        isLoading = false;
      }
    });

    function afficherDetail(phoneID: string) {
        goto(`/phone/detail/?id=${phoneID}`)
    }
</script>

<div class="container">
    <h1>📞 𝐋𝐢𝐬𝐭𝐞𝐬 𝐝𝐞 𝐭é𝐥é𝐩𝐡𝐨𝐧𝐞</h1>
    
    {#if isLoading}
        <div class="loading">Loading...</div>
    {:else if phones.length === 0}
        <div class="no-data">No phones found</div>
    {:else}
        <table>
            <thead>
                <tr>
                    <th>EXTEN</th>
                    <th>PORTO</th>
                    <th>SERVER</th>
                    <th>DIAL PLAN</th>
                    <th>STATUS</th>
                    <th>NAME</th>
                    <th>VMAIL</th>
                    <th>GROUP</th>
                    <th>LINKS</th>
                </tr>
            </thead>
            <tbody>
                {#each phones as phone}
                    <tr>
                        <td>{phone.extension || '-'}</td>
                        <td>{phone.port || '-'}</td>
                        <td>{phone.server_ip || '-'}</td>
                        <td>{phone.dialplan_number || '-'}</td>
                        <td>{phone.status || '-'}</td>
                        <td>{phone.fullname || '-'}</td>
                        <td>{phone.voicemail_id || '-'}</td>
                        <td>{phone.user_group || '-'}</td>
                        <td>
                            <button on:click={() => afficherDetail(phone.extension)}>
                                View Details
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<style>
    .container {
        padding: 20px;
    }

    h1 {
        text-align: center;
        margin-bottom: 20px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    th {
        background-color: #f4f4f4;
        font-weight: bold;
    }

    tr:hover {
        background-color: #f5f5f5;
    }

    button {
        padding: 6px 12px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:hover {
        background-color: #45a049;
    }

    .loading, .no-data {
        text-align: center;
        padding: 20px;
        font-size: 18px;
        color: #666;
    }
</style>
