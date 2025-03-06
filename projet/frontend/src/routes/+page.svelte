<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
  
    let lineChart, barChart, pieChart;
    let currentTime = '';
    let messages = [];
    let newMessage = '';
  
    // Données fictives pour les membres et utilisateurs
    const teamMembers = [
      { name: 'seddik', role: 'Developer', avatar: '👩‍💻' },
      { name: 'zeineb', role: 'Designer', avatar: '🎨' },
      { name: 'khalil', role: 'Project Manager', avatar: '🗂️' }
    ];
  
    const users = [
      { name: 'David', avatar: '👤' },
      { name: 'Eve', avatar: '👤' },
      { name: 'Frank', avatar: '👤' },
      { name: 'Grace', avatar: '👤' }
    ];
  
    // Simulated chatbot response
    async function getChatbotResponse(userMessage) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(`Chatbot: You said "${userMessage}"`);
        }, 1000);
      });
    }
  
    onMount(() => {
      const ctx1 = document.getElementById('lineChart');
      if (ctx1 instanceof HTMLCanvasElement) {
        lineChart = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
              label: 'Total Spent',
              data: [20, 25, 80, 60, 70, 90],
              borderColor: 'rgba(0, 123, 255, 1)',
              backgroundColor: 'rgba(0, 123, 255, 0.2)',
              fill: true,
            }]
          }
        });
      }
  
      const ctx2 = document.getElementById('barChart');
      if (ctx2 instanceof HTMLCanvasElement) {
        barChart = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: ['17', '18', '19', '20', '21', '22', '23'],
            datasets: [{
              label: 'Weekly Revenue',
              data: [40, 60, 50, 80, 70, 90, 100],
              backgroundColor: 'rgba(255, 99, 132, 0.8)'
            }]
          }
        });
      }
  
      const ctx3 = document.getElementById('pieChart');
      if (ctx3 instanceof HTMLCanvasElement) {
        pieChart = new Chart(ctx3, {
          type: 'pie',
          data: {
            labels: ['Your Files', 'System'],
            datasets: [{
              data: [65, 35],
              backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)']
            }]
          }
        });
      }
  
      // Mettre à jour l'heure toutes les secondes
      setInterval(() => {
        const now = new Date();
        currentTime = now.toLocaleTimeString();
      }, 1000);
    });
  
    async function sendMessage() {
      if (newMessage.trim()) {
        const userMessage = newMessage;
        messages = [...messages, { text: userMessage, sender: 'User' }];
        newMessage = '';
  
        // Get chatbot response
        const chatbotResponse = await getChatbotResponse(userMessage);
        messages = [...messages, { text: chatbotResponse, sender: 'Chatbot' }];
      }
    }
  </script>
  
  <div class="d-flex">
      <!-- Horloge -->
      <div class="row mt-4">
        <div class="col-md-12 text-center">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Current Time</h5>
              <h2>{currentTime}</h2>
            </div>
          </div>
        </div>
      </div>
   
  
    <!-- Main Content -->
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card border-info shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-info">Earnings</h5>
              <p class="card-text">$</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-warning shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-warning">Spend This Month</h5>
              <p class="card-text">$</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-success shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-success">Sales</h5>
              <p class="card-text">$</p>
            </div>
          </div>
        </div>
      </div>
  
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Total Spent Over Time</h5>
              <canvas id="lineChart"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Weekly Revenue</h5>
              <canvas id="barChart"></canvas>
            </div>
          </div>
        </div>
      </div>
  
      <div class="row">
        <div class="col-md-12">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">File Distribution</h5>
              <canvas id="pieChart" style="max-height: 300px;"></canvas>
            </div>
          </div>
        </div>
      </div>
  
    
  
      <!-- Chatbot Interface -->
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Chatbot</h5>
              <div class="chat-box" style="max-height: 300px; overflow-y: auto; padding: 10px; border-radius: 5px; background-color: #f8f9fa;">
                {#each messages as message}
                  <div class="message {message.sender}">
                    <strong class="{message.sender === 'User' ? 'text-primary' : 'text-success'}">{message.sender}:</strong>
                    <span>{message.text}</span>
                  </div>
                {/each}
              </div>
              <div class="input-group mt-3">
                <input 
                  type="text" 
                  class="form-control" 
                  bind:value={newMessage} 
                  placeholder="Type a message..." 
                  on:keypress={event => event.key === 'Enter' && sendMessage()} 
                />
                <button class="btn btn-primary" on:click={sendMessage}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Team Members Section -->
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Team Members</h5>
              <div class="list-group">
                {#each teamMembers as member}
                  <div class="list-group-item d-flex align-items-center">
                    <span class="avatar me-2">{member.avatar}</span>
                    <div>
                      <strong>{member.name}</strong><br />
                      <small class="text-muted">{member.role}</small>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
  
        <!-- Users Section -->
        <div class="col-md-6">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Users</h5>
              <div class="list-group">
                {#each users as user}
                  <div class="list-group-item d-flex align-items-center">
                    <span class="avatar me-2">{user.avatar}</span>
                    <strong>{user.name}</strong>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
  
    </div>
  </div>
  
  <style>
    body {
      background-color: #f4f7fa;
      font-family: 'Arial', sans-serif;
    }
  
    .card {
      border-radius: 0.5rem;
      border: none;
    }
  
    .nav-link {
      transition: background-color 0.3s;
    }
  
    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  
    canvas {
      max-height: 300px;
    }
  
    .chat-box {
      margin-bottom: 10px;
      border-radius: 0.5rem;
      border: 1px solid #ddd;
    }
  
    .message {
      margin: 5px 0;
      padding: 5px 10px;
      border-radius: 0.5rem;
    }
  
    .User {
      text-align: right;
      background-color: rgba(0, 123, 255, 0.1);
    }
  
    .Chatbot {
      text-align: left;
      background-color: rgba(40, 167, 69, 0.1);
    }
  
    .list-group-item {
      border: none;
      display: flex;
      align-items: center;
      padding: 10px;
      transition: background-color 0.3s;
    }
  
    .list-group-item:hover {
      background-color: rgba(0, 123, 255, 0.1);
    }
  
    .avatar {
      font-size: 1.5rem; /* Adjust avatar size */
    }
  
    .h-100 {
      height: 100%; /* Ensure cards take full height */
    }
  </style>