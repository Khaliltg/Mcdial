<script lang="ts">
  import Modal from '../common/Modal.svelte';
  import ProspectForm from '../prospect-form/ProspectForm.svelte';
  export let show = false;
  export let currentProspect = null;
  export let callActive = false;
  export let apiBaseUrl = 'http://localhost:8000/api';
  export let onClose = () => {};
</script>

<Modal {show} title="Fiche Prospect" width="max-w-3xl" on:close={onClose}>
  <ProspectForm {currentProspect} {callActive} {apiBaseUrl} />
</Modal>
