import { boot } from 'quasar/wrappers';
import ExpressionDetail from 'src/components/expression/gui/ExpressionDetail.vue';
import AstSymbol from 'src/components/ast/AstSymbol.vue';

export default boot(async ({ app }) => {
  app.component('expression-detail', ExpressionDetail);
  app.component('ast-symbol', AstSymbol);
});
