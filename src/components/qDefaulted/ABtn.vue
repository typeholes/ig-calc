<script>
import { QBtn } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QBtn;

export default defineComponent({
  props: {
    ...props,
    dense: {
      type: Boolean,
      default: true,
    },
    hideBottomSpace: {
      type: Boolean,
      default: true,
    },
  },
  setup: QBtn.setup,
});
</script>
