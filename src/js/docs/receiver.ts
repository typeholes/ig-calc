import { actions, addAction, isAction } from '../actions';
import { hasPropIs, isString } from '../util';

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
    handleMessage(data, setTopic);
  };
}

function handleMessage(data: unknown, setTopic: (topic: string) => void) {
  if (Array.isArray(data)) {
    data.forEach((x) => handleMessage(x, setTopic));
  } else {
    if (hasPropIs(data, 'topic', isString)) {
      setTopic(data.topic);

      addAction('goto', { delay: 1, args: { elementId: 'docTopic' } });
    }

    if (hasPropIs(data, 'action', isAction)) {
      actions.push(data.action);
    }
  }
}
