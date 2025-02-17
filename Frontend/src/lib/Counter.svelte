<script>
  let chequeCarte = "";
  let montant = "";
  let date = "";
  let banque = "";

  function submitForm(event) {
    event.preventDefault();
    alert(`Paiement envoyé :\n- Chèque/Carte: ${chequeCarte}\n- Montant: ${montant}\n- Date: ${date}\n- Banque: ${banque}`);
  }
</script>

<style>
  .container {
    max-width: 400px;
    margin: 40px auto;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: white;
    text-align: center;
  }

  label {
    display: block;
    margin: 10px 0 5px;
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 15px;
    font-size: 16px;
    cursor: pointer;
    border-radius: 5px;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>

<div class="container">
  <img src="money.png" width="80" alt="Icône d'argent">
  
  <h1>Paiement</h1>

  <form on:submit={submitForm}>
    <label for="chequeCarte">Numéro de chèque / carte :</label>
    <input id="chequeCarte" type="text" bind:value={chequeCarte} placeholder="***" />

    <label for="montant">Montant :</label>
    <input id="montant" type="text" bind:value={montant} placeholder="$" />

    <label for="date">Date :</label>
    <input id="date" type="text" bind:value={date} placeholder="jj/mm/aaaa" />

    <label for="banque">Banque :</label>
    <input id="banque" type="text" bind:value={banque} placeholder="Nom de la banque" />

    <button type="submit">Valider</button>
  </form>

  {#if chequeCarte || montant || date || banque}
    <div class="summary">
      <h2>Résumé :</h2>
      <p><strong>Chèque/Carte:</strong> {chequeCarte}</p>
      <p><strong>Montant:</strong> {montant}</p>
      <p><strong>Date:</strong> {date}</p>
      <p><strong>Banque:</strong> {banque}</p>
    </div>
  {/if}
</div>
