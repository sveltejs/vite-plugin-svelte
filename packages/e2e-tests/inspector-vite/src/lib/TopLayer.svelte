<script>
	let popover;
	let dialog;
</script>

<button id="open-popover" onclick={() => popover.showPopover()}>Open popover</button>
<button id="open-dialog" onclick={() => dialog.showModal()}>Open dialog</button>

<div id="popover" popover="manual" bind:this={popover}>
	<p id="popover-content">Content in a popover</p>
	<button id="close-popover" onclick={() => popover.hidePopover()}>Close popover</button>
</div>

<dialog id="dialog" bind:this={dialog}>
	<p id="dialog-content">Content in a modal dialog</p>
	<button id="close-dialog" onclick={() => dialog.close()}>Close dialog</button>
</dialog>

<style>
	#popover,
	dialog {
		width: 300px;
		height: 200px;
	}
</style>
