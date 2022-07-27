<script>
import { QBtnDropdown } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QBtnDropdown;

export default defineComponent({
  props: {
    ...props,
    glossy: {
      type: Boolean,
      default: true,
    },
    dense: {
      type: Boolean,
      default: true,
    },
    hideBottomSpace: {
      type: Boolean,
      default: true,
    },
  },
  setup: QBtnDropdown.setup,
});
</script>
