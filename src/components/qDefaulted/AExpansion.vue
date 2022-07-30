<script>
import { QExpansionItem } from 'quasar';
import { defineComponent } from 'vue';

const { props } = QExpansionItem;

export default defineComponent({
  props: {
    ...props,
    dense: {
      type: Boolean,
      default: true,
    },
  },
  setup: QExpansionItem.setup,
});
</script>
