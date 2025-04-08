<script>
    // Data for the table
    const users = [
        { id: '', proto: '', server: '', dialplan: '', status: '', name: '', vmail: '', group: '' },
    ];

    // Function to handle actions
    function handleAction(action , id) {
        console.log(`${action} clicked for user ${id}`);
        // You would implement actual functionality here
    }
</script>

<div class="container">
    <h1>📞 𝐋𝐢𝐬𝐭𝐞𝐬 𝐝𝐞 𝐭é𝐥é𝐩𝐡𝐨𝐧𝐞</h1>
    
    <table>
        <thead>
            <tr>
                <th>EXTEN</th>
                <th>PROTO</th>
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
            {#each users as user (user.id)}
                <tr>
                    <td>{user.id}</td>
                    <td>{user.proto}</td>
                    <td>{user.server}</td>
                    <td>{user.dialplan}</td>
                    <td class="status {user.status.toLowerCase()}">{user.status}</td>
                    <td>{user.name}</td>
                    <td>{user.vmail}</td>
                    <td>{user.group}</td>
                    <td class="actions">
                        <button on:click={() => handleAction('MODIFY', user.id)}>MODIFY</button>
                        <button on:click={() => handleAction('STATS', user.id)}>STATS</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    body {
        margin: 0;
        background-color: #f4f4f4;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .container {
        max-width: 1200px;
        margin: 20px auto;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
        font-size: 2em;
        margin-bottom: 20px;
        color: #333;
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
        background-color: #1f22df;
        color: white;
        font-weight: bold;
    }
    
    tr:hover {
        background-color: #f1f1f1;
    }
    
    .status {
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .status.active {
        color: rgb(58, 36, 185);
    }
    
    .status.inactive {
        color: red;
    }
    
    .actions {
        display: flex;
        gap: 10px;
    }
    
    button {
        padding: 8px 15px;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    button:hover {
        background-color: #0056b3;
    }
    
    @media (max-width: 600px) {
        h1 {
            font-size: 1.5em;
        }

        th, td {
            padding: 8px;
        }

        button {
            padding: 6px 10px;
        }
    }
</style>