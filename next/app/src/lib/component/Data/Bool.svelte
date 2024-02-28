<script lang="ts">
  export let value: boolean;
  export let item: any;
  item;
</script>

<span class={`bool ${value ? 'true' : 'false'}`}>
  {value ? '✓' : '✗'}
</span>

<style>
  span.bool {
    display: inline-block;
    width: 100%;
    text-align: center;
    user-select: none;
    position: relative;
  }
  span.bool.true {
    color: #4caf50;
    top: 1.5px;
  }
  span.bool.false { color: #f44336; }
</style>

