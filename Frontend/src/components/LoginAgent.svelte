<script>
    let email = '';
    let password = '';
    let errorMessage = '';

    const handleSubmit = async () => {
        if (!email || !password) {
            errorMessage = 'Veuillez remplir tous les champs.';
            return; 
        }

        const response = await fetch('http://localhost:5173/login', {
            method: 'POST',  // Correction de "mrthod"
            headers: {
                'Content-Type': 'application/json', // Correction des majuscules
            },
            body: JSON.stringify({ email, password }), // Correction de "json.stringify"
        });

        if (!response.ok) { // Correction de "repense"
            errorMessage = 'Identification incorrecte.';
        } else {
            console.log('Connexion réussie');
            errorMessage = ''; // Effacer le message d'erreur si la connexion réussit
        }
    };
</script>

<style>
    .form-container { /* Correction de "from-container" */
        display: flex;
        flex-direction: column;
        width: 300px;
        margin: auto;
    }

    .form-container input {
        margin-bottom: 10px;
        padding: 10px;
        font-size: 14px;
    }

    .form-container button {
        padding: 10px;
        background-color: blue;
        color: white;
        border: none; /* Correction de "nome" */
        cursor: pointer; /* Correction de "curser" */
    }

    .form-container button:hover {
        background-color: #4b45a0;
    }

    .error { /* Correction de "erro" */
        color: red;
        font-size: 15px;
    }
</style>

<div class="form-container"> <!-- Correction de "from-container" -->
    <h2>Connexion Agent</h2>

    <input 
        type="email"
        placeholder="Email"
        bind:value={email}
    />

    <input 
        type="password"
        placeholder="Mot de passe"
        bind:value={password}
    />

    <button on:click={handleSubmit}>Se connecter</button> <!-- Correction "handlesubmit" -->
    
    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}
</div>
