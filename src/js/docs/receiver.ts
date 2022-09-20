import { actions, addAction, isAction } from '../actions';
import { hasProp, hasPropIs, isString } from '../util';

export function createDocChannel() {
  return new BroadcastChannel('docChannel');
}
export function initReceiver({
  setTopic,
}: {
  setTopic: (topic: string) => void;
}) {
  const docChannel = createDocChannel();
  docChannel.onmessage = (event: MessageEvent<unknown>) => {
    const data = event.data;
    if (hasPropIs(data, 'topic', isString)) {
      setTopic(data.topic);

      addAction('goto', { delay: 1, args: { elementId: 'docTopic' } });
    }

    if(hasPropIs(data, 'action', isAction)) {
      actions.push(data.action)
    }
  };
}
