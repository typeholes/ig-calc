<script>
import { QInput } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QInput;

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
  setup: QInput.setup,
});
</script>
