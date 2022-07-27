<script>
import { QToggle } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QToggle;

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
  setup: QToggle.setup,
});
</script>
