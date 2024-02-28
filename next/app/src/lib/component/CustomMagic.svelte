<script lang="ts">
  import ImgIcon from './ImgIcon.svelte';
  export let customMagic: any;
</script>


<table class="custom-magic">
  <thead>
    <th><span>Paths</span></th>
    <th><span>Lvl.</span></th>
    <th><span>Chance</span></th>
  </thead>
  <tbody>
    {#each customMagic.spec as { chance, lvl, paths } }
      <tr>
        <td class="pathicons">
          {#each paths as p }
            <ImgIcon name={`magic${p}`} />
          {/each}
        </td>
        <td><span>+{lvl}</span></td>
        <td><span>{chance}%</span></td>
      </tr>
    {/each}
  </tbody>
</table>
<style lang="less">
.custom-magic {
  border-spacing: 0;
  background: var(--se-color);
  border: 1px solid #333;

  td, th {
    font-weight: normal;
    border: 1px solid #333;
    padding: 4px 4px;
    text-align: center;
  }
  td.pathicons {
    padding: 7px 4px;
    display: flex;
    align-items: center;
    > :global(.img-icon) {
      height: 16px;
      width: 16px;
      margin-right: 2px;
    }
  }
}
</style>
