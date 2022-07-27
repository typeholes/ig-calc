<script>
import { QSlider } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QSlider;

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
  setup: QSlider.setup,
});
</script>
