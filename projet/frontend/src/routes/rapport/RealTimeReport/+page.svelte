<script>
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';

  let groupedAgents = {
    READY: [],
    INCALL: [],
    PAUSED: [],
    WAITING: [],
  };
  let hopper = {};

  let socket;

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  onMount(() => {
    socket = io('http://localhost:8000', {
      withCredentials: true,
      transports: ['websocket'],
    });

    if (!socket) return;

    socket.on('connect', () => {
      console.log('✅ Connecté au WebSocket');
    });

    socket.on('realtime-update', (data) => {
      if (!data) return;
      hopper = data.hopper || {};

      groupedAgents.READY = data.agents?.filter(a => a.status === 'READY') || [];
      groupedAgents.INCALL = data.agents?.filter(a => a.status === 'INCALL') || [];
      groupedAgents.PAUSED = data.agents?.filter(a => a.status === 'PAUSED') || [];
      groupedAgents.WAITING = data.agents?.filter(a => a.status === 'WAITING') || [];
    });

    socket.on('disconnect', () => {
      console.log('❌ Déconnecté du WebSocket');
    });
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
  });
</script>
