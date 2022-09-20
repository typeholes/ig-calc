<script setup lang="ts">
   import { cursorState, goToElement } from './FakeCursor';
</script>

<template>
   <div>
      <span v-if="cursorState.show" :class="{ animate: true, cursor: true }"
         >&#10146;
      </span>
   </div>
</template>

<style scoped>
   .cursor {
      z-index: 99999999;
      background: none;
      color: antiquewhite;
      font-size: 5ch;
      transform: rotate(-0.35turn);
      position: fixed;
      top: v-bind('cursorState.top + "px"');
      left: v-bind('cursorState.left + "px"');
      margin-top: -13px;
      animation-name: none;
   }

   .animate {
      animation-name: moveCursor;
      animation-duration: 1s;
      animation-direction: forward;
      animation-timing-function: ease-in-out;
   }

   @keyframes moveCursor {
      0% {
         top: v-bind('cursorState.oldTop + "px"');
         left: v-bind('cursorState.oldLeft + "px"');
      }
      100% {
         top: v-bind('cursorState.top + "px"');
         left: v-bind('cursorState.left + "px"');
      }
   }

   .shake {
      animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      transform: translate3d(0, 0, 0);
   }

   @keyframes shake {
      10%,
      90% {
         transform: translate3d(-1px, 0, 0);
      }

      20%,
      80% {
         transform: translate3d(2px, 0, 0);
      }

      30%,
      50%,
      70% {
         transform: translate3d(-4px, 0, 0);
      }

      40%,
      60% {
         transform: translate3d(4px, 0, 0);
      }
   }
</style>
