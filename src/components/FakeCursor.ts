import { nextTick, reactive } from 'vue';
import { defined } from '../js/util';

export const cursorState = reactive({
   show: false,
   top: 500,
   left: 500,
   oldTop: 500,
   oldLeft: 500,
   animate: false,
});

export function goToElement(el: HTMLElement | undefined) {
   if (!defined(el)) {
      return;
   }
  //  const appEl = document.getElementById('app');
  //  appEl?.scrollIntoView(true);

   el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

   let bounds = el.getBoundingClientRect();
   if (window.innerHeight - bounds.top < 80) {
      window.scrollBy(0, 160);
      bounds = el.getBoundingClientRect();
   }

   moveTo((bounds.top + bounds.bottom) / 2, (bounds.left + bounds.right) / 2);

   bounds = el.getBoundingClientRect();
   if (window.innerHeight - bounds.top < 80) {
      window.scrollBy(0, 160);
     cursorState.top += 160;
     cursorState.oldTop += 160;
      bounds = el.getBoundingClientRect();
      moveTo(
         (bounds.top + bounds.bottom) / 2,
         (bounds.left + bounds.right) / 2
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
   void nextTick(() => {
      cursorState.show = true;
      cursorState.animate = true;
   });
}
