<script lang="ts">
  import ImgIcon from '$lib/component/ImgIcon.svelte';
  import CustomMagicTable from '$lib/component/CustomMagic.svelte';
  export let item: any;
  export let value: any;
  let pinCM: boolean = false;
  let hoverCM: boolean = false;
  $: showCM = pinCM || hoverCM;
  function toggleHover (h: boolean) { hoverCM = h; }
  function togglePin (p: boolean) { pinCM = p; }
</script>

<span class="td-magic-paths">
  <span></span>
  {#if value.F}<ImgIcon name="magicF"/><span class="text">{value.F}</span>{/if}
  {#if value.A}<ImgIcon name="magicA"/><span class="text">{value.A}</span>{/if}
  {#if value.W}<ImgIcon name="magicW"/><span class="text">{value.W}</span>{/if}
  {#if value.E}<ImgIcon name="magicE"/><span class="text">{value.E}</span>{/if}
  {#if value.S}<ImgIcon name="magicS"/><span class="text">{value.S}</span>{/if}
  {#if value.N}<ImgIcon name="magicN"/><span class="text">{value.N}</span>{/if}
  {#if value.D}<ImgIcon name="magicD"/><span class="text">{value.D}</span>{/if}
  {#if value.G}<ImgIcon name="magicG"/><span class="text">{value.G}</span>{/if}
  {#if value.B}<ImgIcon name="magicB"/><span class="text">{value.B}</span>{/if}
  {#if value.H}<ImgIcon name="magicH"/><span class="text">{value.H}</span>{/if}
  {#if item.custommagic}
    <span
      tabindex="0"
      role="button"
      class={`custom-magic-lvl${hoverCM ? ' cm-hover' : ''}${pinCM ? ' cm-pinned' : ''}`}
      on:pointerenter={function () { toggleHover(true); } }
      on:pointerleave={function () { toggleHover(false); } }
      on:click={function () { togglePin(!pinCM); } }
      on:keydown={function ({ key }) { if (key === ' ') { togglePin(!pinCM); } } }
    >
      <ImgIcon name="custommagic"/>
      <span class="text">{value.U}</span>
    </span>
  {/if}
  {#if value.R}<ImgIcon name="research"/><span class="text">{value.R}</span>{/if}
</span>
{#if showCM }
  <aside>
    <CustomMagicTable customMagic={item.custommagic}/>
  </aside>
{/if}


<style lang="less">
  .td-magic-paths {
    align-self: stretch;
    display: flex;
    align-items: center;
    position: relative;
    user-select: none;
    & > span {
      position: relative;
      top: 1px;
      margin-inline-end: 2px;
    }

    & :global(.img-icon) {
      margin: 2px;
      height: 16px;
      width: 16px;
    }
    & :global(.img-icon[data-name="magicH"]) { margin-right: 5px; }
    & :global(.img-icon[data-name="magicB"]) { position: relative; top: 2px; }

    & > .custom-magic-lvl {
      & > span {
        margin-inline-end: 2px;
      }
      & > :global(.img-icon[data-name="custommagic"]) {
        position: relative;
        top: 1px;
        margin-right: -1px;
      }
      top: 0;
      border-left: solid 2px transparent;
      border-right: solid 2px transparent;
      align-self: stretch;
      display: flex;
      align-items: center;
      cursor: pointer;
      &.cm-hover { background-color: #333; }
      &.cm-pinned { background-color: var(--se-color); }
      color: var(--ln-color);
      & > :global(.img-icon) {
        height: 16px;
        width: 16px;
      }
    }


  }
  aside {
    pointer-events: none;
    z-index: 1000;
    color: var(--fg-color) !important; // hehe
    position: absolute;
    top: 100%;
    left: -2px;
    opacity: 1;
  }



</style>

