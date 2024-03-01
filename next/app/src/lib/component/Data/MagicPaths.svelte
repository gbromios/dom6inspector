<script lang="ts">
  import { BASE_PATHS } from '$lib/magic-stats';
  import ImgIcon from '$lib/component/ImgIcon.svelte';
  import CustomMagicTable from '$lib/component/CustomMagic.svelte';
  export let item: any;
  export let value: any;
  let pinExtend: boolean = false;
  let hoverExtend: boolean = false;
  const basePaths: { lvl: number, name: string, cls: string }[] = [];
  for (const path of BASE_PATHS) {
    const lvl = value[path] as number;
    if (!(lvl > 0)) continue;
    const name = `magic${path}`;
    let cls = 'path-level';
    if (basePaths.length >= 3) cls += ' elided-path';
    basePaths.push({ lvl, name, cls, });
  }
  const width = basePaths.length +
    (item.custommagic ? 1 : 0) +
    (value['R'] ? 1 : 0)
  const isWide = width > 6;
  $: showExtend = pinExtend || hoverExtend;
  $: mpClass = `magic-paths ${
    (hoverExtend || pinExtend) ? 'opened' : 'closed'
    } ${
      isWide ? 'wide' : 'narrow'
    }`
  function toggleHover (h: boolean) { hoverExtend = h; }
  function togglePin (p: boolean) { pinExtend = p; }


</script>

<div class="magic-paths-data"
  on:pointerenter={function () { toggleHover(true); } }
  on:pointerleave={function () { toggleHover(false); } }
  on:click={function () { togglePin(!pinExtend); } }
>
  <span class={mpClass}>
    {#if basePaths.length > 0}
      {#each basePaths as { lvl, name, cls }}
        <span data-name={name} class={isWide ? cls : 'path-level'}>
          <ImgIcon name={name}/>
          <span class="text">{lvl}</span>
        </span>
      {/each}
    {/if}
    {#if isWide}<span data-name={name} class="text paths-elided">…</span>{/if}
    {#if item.custommagic}
      <span data-name={name}
        class="path-level"
      >
        <ImgIcon name="custommagic"/>
        <span class="text">{value.U}</span>
      </span>
    {/if}
    {#if value.R}
      <span data-name={name} class="path-level">
        <ImgIcon name="research"/><span class="text">{value.R}</span>
      </span>
    {/if}
  {#if item.custommagic && showExtend}
    <aside>
      <CustomMagicTable customMagic={item.custommagic}/>
    </aside>
  {/if}
  </span>
</div>


<style lang="less">
  .magic-paths-data {
    position: relative;
    overflow: visible;
    width: var(--col-w);
    height: var(--row-h);

  }
  .magic-paths {
    top: -1px;
    left: 0px;
    position: absolute;
    pointer-events: none;
    width: 100%;
    display: grid;

    grid-template-columns: repeat(6, 1fr);

    &.wide {
      grid-template-rows: var(--row-h);
    }
    &.wide.opened {
      grid-template-rows: repeat(2, var(--row-h));
    }
    &.narrow.opened {
      grid-template-rows: var(--row-h);
    }
    &.closed {
      .elided-path { display: none; }
    }
    &.opened {
      .paths-elided { display: none; }
      flex-wrap: wrap;
      background-color: var(--se-color);
      position: absolute;
      //border: 1px solid #333;
      z-index: 100;
    }

    & :global(.img-icon) { margin: 2px; height: 16px; width: 16px; }
    & :global(.img-icon[data-name="magicA"]) {
      margin-right: 4px;
      position: relative;
      top: 1px;
    }
    & :global(.img-icon[data-name="magicH"]) { margin-right: 5px; }
    & :global(.img-icon[data-name="research"]) { margin-right: -3px; }
    & :global(.img-icon[data-name="magicB"]) { position: relative; top: 2px; }
    & :global(.img-icon[data-name="custommagic"]) {
      margin-right: -1px;
    }
    .paths-elided {
      justify-self: center;
    }

    .path-level {
      height: var(--row-h);
      display: flex;
      align-items: center;
      justify-content: space-around;
    }

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
  }
</style>

