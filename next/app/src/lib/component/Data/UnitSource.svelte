<script lang="ts">
  import ImgIcon from '$lib/component/ImgIcon.svelte';
  export let item: any;
  export let value: any;
  item;
  let pinExtend: boolean = false;
  let hoverExtend: boolean = false;
  $: showExtend = pinExtend || hoverExtend;
  function toggleHover (h: boolean) { hoverExtend = h; }
  function togglePin (p: boolean) { pinExtend = p; }

  const SRC_TYPE_ICON = {
    1: { name: 'rpcostCommander', title: 'Commander' },
    2: { name: 'rpcost', title: 'Unit' },
    3: { name: 'pretender', title: '' },
  }
  const mainIconName = SRC_TYPE_ICON[value.type as 1|2|3] as string;

</script>

<div class="unit-source-data"
  on:pointerenter={function () { toggleHover(true); } }
  on:pointerleave={function () { toggleHover(false); } }
  on:click={function () { togglePin(!pinExtend); } }
>
  <span class="unit-source">
    <ImgIcon name={mainIconName} />
  </span>
</div>


<style lang="less">
  .unit-source-data {
    position: relative;
    overflow: visible;
    width: var(--col-w);
    height: var(--row-h);
  }
  .unit-source {
    top: -1px;
    left: 0px;
    position: absolute;
    //pointer-events: none;
    width: 100%;
    display: grid;

    width: var(--col-w);
    height: var(--row-h);
    align-items: center;


    & :global(.img-icon) { margin: 2px; height: 16px; width: 16px; }
    & :global(.img-icon[data-name="rpcostCommander"]) {
      position: relative;
      top: -2px;
      margin: 0 -1px;
      height: 24px;
      width: 24px;
    }
    & :global(.img-icon[data-name="rpcost"]) {
      margin: 0px; height: 20px; width: 20px;
    }
    /*
    aside {
      min-width: 100%;
      z-index: 110;
      color: var(--fg-color) !important; // hehe
      position: absolute;
      top: 100%;
      left: 100%;
      opacity: 1;
      transform: translate(-100%, 0);
      & :global(table) {
        border-left: none;
        border-right: none;
      }
    }
    */
  }
</style>


