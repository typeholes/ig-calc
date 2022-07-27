<script>
import { QSelect } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QSelect;

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
  setup: QSelect.setup,
});
</script>
