<script lang="ts">
  import ImgIcon from '$lib/component/ImgIcon.svelte';
  export let icon: string;
  export let text: string;
</script>

<span title={text}>
  <ImgIcon name={icon} />
</span>

<style lang="less">
  span {
    display: inline-block;
    text-align: center;
    width: 100%;
    & > :global(.img-icon) {
      position: relative;
      top: 3px;
      height: 16px;
      width: 16px;
    }
  }
</style>

