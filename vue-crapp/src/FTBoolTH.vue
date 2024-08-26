<script setup lang="ts">
  import type { FTColumn } from './column';
  import ImgIcon from './ImgIcon.vue';
  defineProps<{
    tableName: string;
    column: FTColumn;
  }>();
</script>

<th>
<ImgIcon class="bool-head" :name="column.labelProps.icon" />
</th>

<style lang="less">
  img.bool-head {
    height: 16px;
    width: 16px;
  }
</style>

