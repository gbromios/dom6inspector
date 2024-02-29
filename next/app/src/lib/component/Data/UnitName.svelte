<script lang="ts">
  export let item: any;
  export let value: { n: string, f: string | null, i: number, w: boolean };
  item;

  let hover: boolean = false;


</script>

<div
  on:pointerenter={function () { hover = true; } }
  on:pointerleave={function () { hover = false; } }
  style="display: contents"
>
  <span class="unit-name not-text"
  >
    <span>
      {#if value.f }
        <!--{value.n} — <em>{value.f}</em>-->
        <em>{value.f}</em>, {value.n}
      {:else}
        {value.n}
      {/if}
    </span>
  </span>

  {#if value.w && hover}
  <span class="popoverflow" role="presentation">
    <span class="not-text">
      {#if value.f }
        <!--{value.n} — <em>{value.f}</em>-->
        <em>{value.f}</em>, {value.n}
      {:else}
        {value.n}
      {/if}
    </span>
  </span>
  {/if}
</div>

<style lang="less">
div {
  user-select: none; // lol
  em { color: #FFEB3B; }
}
.unit-name {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding: 0 4px;
  display: inline-block;
  height: var(--row-h);
  line-height: var(--row-h);
  align-self: stretch;
  align-items: center;

}
.popoverflow {
  position: absolute;
  top: -1px;
  left: -1px;
  pointer-events: none;

  text-wrap: nowrap;

  height: var(--row-h);
  z-index: 30;
  line-height: var(--row-h);

  //border: 1px solid var(--ln-color);
  //background-color: brown;
  border: 1px solid var(--se-color);
  background-color: var(--bg-color);
  padding-inline-start: 4px;
  padding-inline-end: 8px;
  border-inline-end: 2px solid var(--se-color);
}
</style>
