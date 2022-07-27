<script>
import { QColor } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QColor;

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
  setup: QColor.setup,
});
</script>
