<script>
    // import { goto } from "$app/navigation";
  import logo from "../../public/mcdial.png"
    let username = "";
    let password = "";
    let errorMessage = "";
  
    function login() {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("isAuthenticated", "true");
        // goto("/dashboard");
      } else {
        errorMessage = "Nom d'utilisateur ou mot de passe incorrect.";
      }
    }
  </script>
  
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600">
    <div class="bg-white rounded-3xl shadow-xl w-full max-w-4xl flex overflow-hidden">
      <!-- Section Gauche -->
      <div class="hidden md:flex flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-indigo-500 w-1/2 text-white p-10">
        <img src={logo} alt="Illustration" class="w-72 mb-6">
        <p class="text-center">
           
        </p>
      </div>
  
      <!-- Section Droite (Formulaire) -->
      <div class="w-full md:w-1/2 p-10">
        <h2 class="text-2xl font-bold text-indigo-700 text-center mb-6">Welcome back</h2>
  
        {#if errorMessage}
          <p class="text-red-500 text-sm text-center mb-4">{errorMessage}</p>
        {/if}
  
        <div class="mb-4">
          <label class="block text-gray-600 font-semibold"> Admin name</label>
          <input type="text"  class="w-full border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none p-2">
        </div>
  
        <div class="mb-6">
          <label class="block text-gray-600 font-semibold">Password</label>
          <input type="password" bind:value={password} class="w-full border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none p-2">
        </div>
  
        <button on:click={login} class="w-full bg-indigo-500 text-white py-2 rounded-full hover:bg-indigo-600 transition">
          Login
        </button>
  
        <div class="text-center mt-4">
         
          <a href="#" class="text-indigo-500 hover:underline">Forgot Password?</a>
        </div>
      </div>
    </div>
  </div>
  