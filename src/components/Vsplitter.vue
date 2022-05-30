<script setup lang="ts">
import { reactive } from "vue";
import { globalTheme } from "../js/theme";

const theme = globalTheme ?? {};

type LeftRight = "left" | "right";

interface Props {
  collapseDirection?: LeftRight;
  collapsed: boolean;
  leftColSpec?: string;
  rightColSpec?: string;
}

const props = withDefaults(defineProps<Props>(), {
  collapseDirection: "left",
  collapsed: false,
  leftColSpec: "45%",
  rightColSpec: "2fr",
});

const collapsableSide = props.collapseDirection;
const collapsableColSpec =
  props.collapseDirection === "left" ? props.leftColSpec : props.rightColSpec;

const collapsedLabel = props.collapseDirection === "left" ? "\u00AB" : "\u00BB";
const uncollapsedLabel =
  props.collapseDirection !== "left" ? "\u00AB" : "\u00BB";

const emit = defineEmits<{
  (e: "update:collapsed", value: boolean): void;
}>();

const localTheme = reactive({
  label: "\u00AB",
  left: {
    width:
      props.collapsed && props.collapseDirection === "left"
        ? "0%"
        : props.leftColSpec,
  },

  right: {
    width:
      props.collapsed && props.collapseDirection === "right"
        ? "0%"
        : props.rightColSpec,
  },
});

function toggle() {
  if (props.collapsed) {
    localTheme[collapsableSide].width = collapsableColSpec;
    localTheme.label = collapsedLabel;
  } else {
    localTheme[collapsableSide].width = "0%";
    localTheme.label = uncollapsedLabel;
  }
  emit("update:collapsed", !props.collapsed);
}
</script>

<template>
  <div class="container">
    <div class="vSplitter">
      <div
        v-if="!(props.collapsed && props.collapseDirection === 'left')"
        class="vLeft"
      >
        <slot name="left"></slot>
      </div>
      <div @click="toggle()" class="collapser">
        {{ localTheme.label }}
      </div>
      <div
        v-if="!(props.collapsed && props.collapseDirection === 'right')"
        class="vRight"
      >
        <slot name="right"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vSplitter {
  display: grid;
  grid-template-columns:
    v-bind('localTheme["left"].width')
    min-content
    v-bind('localTheme["right"].width');

  grid-template-rows: 1fr min-content 1fr;
  grid-gap: 1px;
}

.vLeft {
  grid-column: 1;
  grid-row: 1 / span 3;
}

.vRight {
  grid-column: 3;
  grid-row: 1 / span 3;
}

.collapser {
  grid-column: 2;
  grid-row: 2;
  background-color: #333333;
  border-radius: 25%;
}
</style>
