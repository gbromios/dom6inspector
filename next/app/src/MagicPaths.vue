<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { icons } from './icon';
  import { queryMouse } from './mouse';
  import ImgIcon from './ImgIcon.vue';
  defineProps<{ value: any; item?: any }>();
  defineOptions({ inheritAttrs: false })
  const pInCM = ref(false);
  //const pPin = ref<null|string>(null);
  const pPin = ref(false);

  function togglePinned (pin?: boolean) {
    pin ??= !pPin.value;
    if (pin) {
      //const { x, y } = queryMouse();
      //pPin.value = `--m-x: ${x}px; --m-y: ${y}px`;
      pPin.value = true;
    } else {
      pPin.value = false;
    }
  }

</script>

<template>
  <span v-if="value" class="td-magic-paths">
    <template v-if="value.F"><ImgIcon name="magicF"/>{{ value.F }}</template>
    <template v-if="value.A"><ImgIcon name="magicA"/>{{ value.A }}</template>
    <template v-if="value.W"><ImgIcon name="magicW"/>{{ value.W }}</template>
    <template v-if="value.E"><ImgIcon name="magicE"/>{{ value.E }}</template>
    <template v-if="value.S"><ImgIcon name="magicS"/>{{ value.S }}</template>
    <template v-if="value.N"><ImgIcon name="magicN"/>{{ value.N }}</template>
    <template v-if="value.D"><ImgIcon name="magicD"/>{{ value.D }}</template>
    <template v-if="value.G"><ImgIcon name="magicG"/>{{ value.G }}</template>
    <template v-if="value.B"><ImgIcon name="magicB"/>{{ value.B }}</template>
    <template v-if="value.H"><ImgIcon name="magicH" style="margin-right: 4px"/>{{ value.H }}</template>
    <span
      v-if="item?.custommagic"
      class="custom-magic-lvl"
      :class="{ 'custom-magic-lvl--pinned': pPin }"
      @pointerenter.passive="pInCM = true;"
      @pointerleave.passive="pInCM = false;"
      @click="togglePinned()"
      :style="{ color: `var(--${pPin ? 'hl' : 'ln' }-color)`}"
    >
      <ImgIcon  name="custommagic"/>
      {{ value.U }}
        <div
          class="here-panel custom-magic"
          :class="{
            'here-panel--pinned': pPin,
            'here-panel--hover': !pPin && pInCM,
          }"
        >
          <table>
            <thead><th>Paths</th><th>Level</th><th>Chance</th></thead>
            <tbody>
              <tr v-for="{ chance, lvl, paths } of item.custommagic.spec">
                <td class="pathicons">
                  <ImgIcon v-for="p in paths" :name="`magic${p}`" />
                </td>
                <td>+{{ lvl }}</td>
                <td>{{ chance }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      <!--<Teleport to="body" :disabled="pPin"> </Teleport>-->
    </span>
    <template v-if="item?.research != null">
      <ImgIcon name="research" style="margin-left: 4px"/>{{ item.research }}
    </template>
  </span>
</template>

<style lang="less">
  .td-magic-paths {
    display: flex;
    align-items: center;
    user-select: none;
  }
  .td-magic-paths > img {
    margin-right: 2px;
    &:not(:first-child) {
      margin-left: 0.25em;
    }
    height: 16px;
    width: 16px;
  }

  .td-magic-paths > .custom-magic-lvl {
    color: var(--ln-color);
    /*&:hover { filter: brightness(1.25); }*/
    align-self: stretch;
    display: flex;
    align-items: center;
    cursor: help;
    & > img {
      transform: translate(0, -1px);
      margin-right: 0;
      margin-left: 0.1em;
      height: 16px;
      width: 16px;
    }
    &.custom-magic-lvl {
      &::before {
        position: absolute;
        height: 16px;
        width: 16px;
        background-color: var(--se-color);

      }
    }
  }

  .custom-magic {
    table {
      background: #222;
      border: 1px solid var(--se-color);
    }
    & .pathicons {
      padding: 4px 4px;
      height: 22px;
      display: flex;
      align-items: center;
      > img { height: 16px; width: 16px; margin-right: 2px; }
    }
  }

  // TODO - move out
  .here-panel {
    pointer-events: none;
    z-index: 1000;
    color: var(--fg-color) !important; // hehe
    position: absolute;
    top: 100%;
    left: -2px;
    opacity: 0;
    &.here-panel--hover {
      pointer-events: unset;
      opacity: 1;
    }
    &.here-panel--pinned {
      pointer-events: unset;
      opacity: 1;
    }

    /*
    &.here-panel--hover {
      //position: fixed;
      //top: 0;
      //left: 0;
      //transform: translate(var(--m-x), var(--m-y));

      //transform: translate(0, 4px);
      pointer-events: unset;

    }

    &.here-panel--pinned {
      position: absolute;
      top: 100%;
      left: 0;
      //transform: translate(0, 4px);
      pointer-events: unset;
    }
    */
  }
</style>

