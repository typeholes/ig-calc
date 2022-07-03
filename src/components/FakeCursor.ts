import { nextTick, reactive } from "vue";
import { defined } from "../js/util";

export const cursorState = reactive({
  show: false,
  top: 500,
  left: 500,
  oldTop: 500,
  oldLeft: 500,
  animate: false,
});

export function goToElement(elementId: string) {
  const el = document.getElementById(elementId);
  if (defined(el)) {
    const bounds = el.getBoundingClientRect();
    moveTo(
      window.scrollY + (bounds.top + bounds.bottom) / 2,
      window.scrollX + (bounds.left + bounds.right) / 2
    );
  }
}

export function moveTo(top: number, left: number) {
  cursorState.oldLeft = cursorState.left;
  cursorState.oldTop = cursorState.top;
  cursorState.left = left;
  cursorState.top = top;
  cursorState.animate = false;
  cursorState.show = false;
  nextTick(() => {
    cursorState.show = true;
    cursorState.animate = true;
  });
}
