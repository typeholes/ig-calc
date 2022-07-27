<script>
import { QBtnDropdown } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QBtnDropdown;

export default defineComponent({
  props: {
    ...props,
    glassy: {
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
